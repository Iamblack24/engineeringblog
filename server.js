const express = require('express');
const path = require('path');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const admin = require('./firebaseAdmin');
const { doc, setDoc, Timestamp } = require('firebase/firestore');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const cors = require('cors');
const multer = require('multer');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { StaticRouter } = require('react-router-dom/server');
const fs = require('fs');
require('dotenv').config();

// Only declare db once
const db = admin.firestore();

const app = express();

const isDev = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 3001; // Use different port for SSR server

// Configure CORS for development
app.use(cors({
  origin: isDev ? 'http://localhost:3000' : true, // Allow React dev server in development
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Generate nonce middleware
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});

// Use Helmet to set various HTTP headers for security
app.use(helmet());

// Set Content Security Policy with nonce
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        (req, res) => `'nonce-${res.locals.nonce}'`, // Dynamic nonce
        "https://www.googletagmanager.com",
        "https://pagead2.googlesyndication.com",
        "https://cdnjs.cloudflare.com", // For Font Awesome
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // For inline styles
        "https://cdnjs.cloudflare.com", // For Font Awesome
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:", // For ads and other external images
        "http:",
      ],
      connectSrc: [
        "'self'",
        "https://www.google-analytics.com",
        "https://firestore.googleapis.com",
        "https://firebase.googleapis.com",
        "https://*.google.com",
        "https://*.googleapis.com",
        "https://*.firebaseapp.com",
        "https://engineeringhub.engineer",
        "wss://*.firebaseio.com",
        "https://*.cloudfunctions.net",
        "https://identitytoolkit.googleapis.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com", // For Font Awesome fonts
      ],
      objectSrc: ["'none'"],
      frameSrc: [
        "https://pagead2.googlesyndication.com", // For Google Ads iframes
      ],
      manifestSrc: ["'self'"],
      mediaSrc: ["'self'"],
      workerSrc: [
        "'self'",
        "blob:", // For service workers
      ],
      childSrc: ["'self'", "blob:"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
    reportOnly: false, // Set to true initially to test without blocking
  })
);

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build'), {
  maxAge: '1y',
  etag: false,
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

//serve the service worker file from public directory
app.get('/firebase-messaging-sw.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'firebase-messaging-sw.js'));
});

// Endpoint to save the FCM token
app.post('/api/save-token', async (req, res) => {
  const { token, userId } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    // Save token to Firestore
    await setDoc(doc(db, 'fcm_tokens', token), {
      token,
      userId: userId || 'anonymous',
      createdAt: Timestamp.now(),
      lastUpdated: Timestamp.now()
    });

    res.status(200).json({ message: 'Token saved successfully' });
  } catch (error) {
    console.error('Error saving token:', error);
    res.status(500).json({ error: 'Failed to save token' });
  }
});

// Endpoint to send notifications
app.post('/api/send-notification', async (req, res) => {
  const { token, title, body } = req.body;
  if (!token || !title || !body) {
    return res.status(400).json({ error: 'Token, title, and body are required' });
  }

  const message = {
    notification: {
      title,
      body,
    },
    token,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    res.status(200).json({ message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Error sending notification' });
  }
});

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

// Email sending endpoint with file upload
app.post('/api/send-article', upload.single('file'), async (req, res) => {
  console.log('Received article submission request');
  try {
    const {
      authorName,
      authorEmail,
      documentTitle,
      documentContent,
      coverPhotoUrl,
      aiAnalysis
    } = req.body;

    const file = req.file;

    console.log('Request body:', {
      authorName,
      authorEmail,
      documentTitle,
      contentLength: documentContent ? documentContent.length : 0,
      hasPhoto: !!coverPhotoUrl,
      hasAnalysis: !!aiAnalysis,
      file: file ? {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      } : null
    });

    // Validate required fields
    if (!authorName || !authorEmail || !documentTitle || !documentContent || !file) {
      console.log('Missing required fields:', {
        hasAuthorName: !!authorName,
        hasAuthorEmail: !!authorEmail,
        hasTitle: !!documentTitle,
        hasContent: !!documentContent,
        hasFile: !!file
      });
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    // Create email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      cc: authorEmail,
      subject: `New Article Submission: ${documentTitle}`,
      text: `
New article submission received from Engineering Hub:

Author: ${authorName}
Email: ${authorEmail}
Title: ${documentTitle}

AI Analysis Results:
${aiAnalysis || 'No AI analysis provided'}

Article Content:
${documentContent.substring(0, 1000)}... [Content truncated]

${coverPhotoUrl ? `Cover Photo: ${coverPhotoUrl}` : 'No cover photo provided'}
      `,
      html: `
        <h2>New Article Submission from Engineering Hub</h2>
        <p><strong>Author:</strong> ${authorName}</p>
        <p><strong>Email:</strong> ${authorEmail}</p>
        <p><strong>Title:</strong> ${documentTitle}</p>
        
        <h3>AI Analysis Results:</h3>
        <pre>${aiAnalysis || 'No AI analysis provided'}</pre>
        
        <h3>Article Preview:</h3>
        <p>${documentContent.substring(0, 1000)}... [Content truncated]</p>
        
        ${coverPhotoUrl ? `<p><strong>Cover Photo:</strong> <a href="${coverPhotoUrl}">${coverPhotoUrl}</a></p>` : ''}
      `,
      attachments: [{
        filename: file.originalname,
        content: file.buffer
      }]
    };

    console.log('Attempting to send email...');
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');

    res.status(200).json({
      message: 'Article submitted successfully'
    });
  } catch (error) {
    console.error('Error in /api/send-article:', error);
    res.status(500).json({
      error: 'Failed to send article submission',
      details: error.message
    });
  }
});

// Add SSR middleware before the catch-all handler
app.get('*', (req, res, next) => {
  // Skip SSR in development mode (let Create React App handle it)
  if (isDev) {
    return next();
  }

  // Skip SSR for API routes and static files
  if (req.url.startsWith('/api') || req.url.includes('.')) {
    return next();
  }

  const App = require('./src/App').default;
  const context = {};
  
  const app = ReactDOMServer.renderToString(
    React.createElement(StaticRouter, { location: req.url, context },
      React.createElement(App)
    )
  );

  const indexFile = path.resolve('./build/index.html');
  fs.readFile(indexFile, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading index.html:', err);
      return next(err);
    }

    const html = data
      .replace('<div id="root"></div>', `<div id="root">${app}</div>`)
      .replace('</head>', `
        <script>
          window.__INITIAL_STATE__ = ${JSON.stringify({})};
        </script>
        </head>
      `);

    return res.send(html);
  });
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment variables loaded:', {
    hasEmailUser: !!process.env.EMAIL_USER,
    hasEmailPass: !!process.env.EMAIL_APP_PASSWORD,
    hasAdminEmail: !!process.env.ADMIN_EMAIL
  });
});