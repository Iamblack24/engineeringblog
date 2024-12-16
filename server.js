const express = require('express');
const path = require('path');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const admin = require('./firebaseAdmin');
const { doc, setDoc, Timestamp } = require('firebase/firestore');
const crypto = require('crypto');

// Only declare db once
const db = admin.firestore();

const app = express();

// Generate nonce middleware - MOVE THIS TO THE TOP
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
        "https://cdnjs.cloudflare.com",
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

//middleware to parse JSON bodies
app.use(bodyParser.json());

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

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'build', 'index.html');
  const html = require('fs').readFileSync(indexPath, 'utf8');
  const renderedHtml = html.replace(/<%- nonce %>/g, res.locals.nonce);
  res.send(renderedHtml);
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});