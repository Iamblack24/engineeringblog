const express = require('express');
const path = require('path');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const { db } = require('./firebase'); // Add this import at top
const { doc, setDoc, Timestamp } = require('firebase/firestore');

const app = express();

// Use Helmet to set various HTTP headers for security
app.use(helmet());

// Set Content Security Policy
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://www.googletagmanager.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);

//middleware to parse JSON bodies
app.use(bodyParser.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build'), {
  maxAge: '1y',
  etag: false,
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
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});