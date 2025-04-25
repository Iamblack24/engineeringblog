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
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const { GoogleGenerativeAI } = require("@google/generative-ai"); // Add Gemini server-side
require('dotenv').config();

// Only declare db once
const db = admin.firestore();

const app = express();

const isDev = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 3001; // Use different port for SSR server

// Configure CORS for development
app.use(cors({
  origin: isDev 
  ? 'http://localhost:3000'
  : ['https://engineeringhub.engineer', 'https://www.engineeringhub.engineer', 'https://enginehub.onrender.com'],
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
        "https://identitytoolkit.googleapis.com",
        "https://securetoken.googleapis.com",  // Add this for Firebase Auth
        "https://www.googleapis.com"           // Add this for Firebase Auth
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com", // For Font Awesome fonts
      ],
      objectSrc: ["'none'"],
      frameSrc: [
        "'self'",
        "https://engineeringhub.engineer",
        "https://*.firebaseapp.com",
        "https://firebase.googleapis.com",
        "https://*.google.com"
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

// Initialize Gemini AI Server-side
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY); // Ensure this key is available server-side

// Configure multer for memory storage (Increase limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // Increased to 25MB limit
  },
  fileFilter: (req, file, cb) => {
    // Basic MIME type validation
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
      // Add .doc if needed, but requires more complex handling
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, TXT, MD, and DOCX are allowed.'), false);
    }
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

// --- NEW Endpoint for Analysis and Submission ---
app.post('/api/analyze-article', upload.single('file'), async (req, res) => {
  console.log('Received article analysis request');
  const {
    title,
    authorName,
    authorEmail,
    photo // Optional cover photo URL
  } = req.body;
  const file = req.file;

  // 1. Validate Input
  if (!file || !title || !authorName || !authorEmail) {
    console.error('Validation Error: Missing required fields');
    return res.status(400).json({ error: 'Missing required fields (title, file, name, email).' });
  }
  if (!authorEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
     console.error('Validation Error: Invalid email format');
     return res.status(400).json({ error: 'Invalid email format.' });
  }

  let fileContent = '';
  try {
    // 2. Extract Text based on MIME type
    console.log(`Extracting text from: ${file.originalname} (${file.mimetype})`);
    if (file.mimetype === 'application/pdf') {
      const data = await pdf(file.buffer);
      fileContent = data.text;
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      fileContent = result.value;
    } else if (file.mimetype === 'text/plain' || file.mimetype === 'text/markdown') {
      fileContent = file.buffer.toString('utf8');
    } else {
       console.error(`File Type Error: Unsupported type ${file.mimetype}`);
       return res.status(400).json({ error: `Unsupported file type: ${file.mimetype}` });
    }

    if (!fileContent || fileContent.trim().length < 50) { // Basic check for meaningful content
      console.error('Extraction Error: No meaningful content extracted.');
      return res.status(400).json({ error: 'Could not extract meaningful text from the file. It might be empty, corrupted, or image-based.' });
    }
    console.log(`Text extracted successfully. Length: ${fileContent.length}`);

    // Truncate for analysis if necessary (adjust limit as needed)
    const maxChars = 30000;
    let analysisContent = fileContent;
    if (fileContent.length > maxChars) {
      console.log(`Content truncated for analysis from ${fileContent.length} to ${maxChars}`);
      analysisContent = fileContent.substring(0, maxChars) + '\n\n[Content truncated for analysis]';
    }

    // 3. AI Analysis (Gemini)
    console.log('Starting AI analysis...');
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Use appropriate model
    const prompt = `
      You are a technical article reviewer for a professional engineering site called Engineering Hub.
      Review the following article and determine if it meets our standards:

      Title: ${title}
      Content: ${analysisContent}

      Evaluate based on:
      1. Technical accuracy: Verify correctness of engineering concepts, data, and formulae. Cross-check references if possible.
      2. Code quality (if code is present): Assess clarity, efficiency, and correctness.
      3. Relevance to engineering: Ensure the topic is suitable for an engineering audience. Filter out overly general or unrelated topics.
      4. Originality: Briefly assess if the content seems original or potentially plagiarized (high-level check).
      5. Educational value: Does it teach something useful to engineers?
      6. Engagement potential: Is the writing style engaging for the target audience?
      7. Readability and clarity: Is the language clear, concise, and well-structured?

      Respond ONLY with a JSON object containing:
      - "decision": "ACCEPT" or "REJECT"
      - "explanation": "Brief explanation (max 3 sentences)."
      - "suggestion": "One key improvement suggestion (or 'None' if accepted)."

      Example ACCEPT response:
      {
        "decision": "ACCEPT",
        "explanation": "The article provides a clear and technically sound overview of the topic. The examples are relevant and well-explained.",
        "suggestion": "Consider adding a section on potential limitations."
      }

      Example REJECT response:
      {
        "decision": "REJECT",
        "explanation": "The technical concepts presented contain inaccuracies regarding formula application. The relevance to practical engineering is unclear.",
        "suggestion": "Verify all formulas and provide real-world application examples."
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    console.log('AI Raw Response:', responseText);

    let reviewResult;
    try {
        // Attempt to parse the JSON response from Gemini
        reviewResult = JSON.parse(responseText.replace(/```json\n?/, '').replace(/\n?```/, '')); // Clean potential markdown fences
         if (!reviewResult || typeof reviewResult !== 'object' || !reviewResult.decision || !reviewResult.explanation || !reviewResult.suggestion) {
            throw new Error('Invalid JSON structure in AI response.');
        }
    } catch (parseError) {
        console.error('AI Response Parsing Error:', parseError);
        console.error('Raw AI response that failed parsing:', responseText);
        // Fallback: Treat as rejection if parsing fails
        reviewResult = {
            decision: "REJECT",
            explanation: "The AI analysis could not be processed correctly. Please try submitting again.",
            suggestion: "Ensure the article content is clear and well-formatted."
        };
    }

    console.log('Parsed AI Review:', reviewResult);

    // 4. Handle Decision
    if (reviewResult.decision === 'ACCEPT') {
      console.log('Article ACCEPTED by AI. Proceeding with notification.');
      // 5. Send Email Notification (using existing transporter)
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL, // Send to admin
        cc: authorEmail, // CC the author
        subject: `[Engineering Hub] Article Submission Received: ${title}`,
        text: `New article submission received:\n\nAuthor: ${authorName}\nEmail: ${authorEmail}\nTitle: ${title}\n\nAI Analysis:\nDecision: ${reviewResult.decision}\nExplanation: ${reviewResult.explanation}\nSuggestion: ${reviewResult.suggestion}\n\n${photo ? `Cover Photo: ${photo}` : ''}\n\nThe full article is attached for review.`,
        html: `<h2>Article Submission Received</h2><p><strong>Author:</strong> ${authorName}</p><p><strong>Email:</strong> ${authorEmail}</p><p><strong>Title:</strong> ${title}</p><h3>AI Analysis:</h3><p><strong>Decision:</strong> ${reviewResult.decision}</p><p><strong>Explanation:</strong> ${reviewResult.explanation}</p><p><strong>Suggestion:</strong> ${reviewResult.suggestion}</p>${photo ? `<p><strong>Cover Photo:</strong> <a href="${photo}">${photo}</a></p>` : ''}<p>The full article is attached for review.</p>`,
        attachments: [{
          filename: file.originalname,
          content: file.buffer
        }]
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log('Email notification sent successfully.');
        // Send success response to client
        res.status(200).json({
          status: 'success',
          message: 'Article approved by AI and submitted for review!',
          analysis: reviewResult
        });
      } catch (emailError) {
        console.error('Email Sending Error:', emailError);
        // Still inform client of success, but log the email error server-side
         res.status(200).json({ // Send 200 because analysis+upload worked, but notify about email issue
          status: 'success_email_failed',
          message: 'Article approved and submitted, but confirmation email failed. We have received your submission.',
          analysis: reviewResult
        });
      }

    } else { // REJECT
      console.log('Article REJECTED by AI.');
      res.status(200).json({ // Send 200 OK, but indicate rejection in the body
        status: 'rejected',
        message: 'Article requires improvement based on AI review.',
        analysis: reviewResult
      });
    }

  } catch (error) {
    console.error('Error during article analysis process:', error);
    // More specific error handling
    if (error.message.includes('Invalid file type')) {
         res.status(400).json({ error: error.message });
    } else if (error.message.includes('extract text from PDF')) {
         res.status(400).json({ error: `Failed to process PDF: ${error.message}. Ensure it's not password-protected or corrupted.` });
    } else if (error.message.includes('mammoth')) {
         res.status(400).json({ error: `Failed to process DOCX: ${error.message}` });
    } else if (error.message.includes('AI analysis failed')) { // Catch specific AI errors if possible
         res.status(500).json({ error: 'The AI analysis service failed. Please try again later.' });
    }
     else {
        res.status(500).json({ error: 'An unexpected error occurred during processing.' });
    }
  }
});

// --- Remove or comment out the old /api/send-article endpoint ---
/*
app.post('/api/send-article', upload.single('file'), async (req, res) => {
  // ... old code ...
});
*/

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