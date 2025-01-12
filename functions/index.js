const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
const cors = require('cors')({ origin: true });

// Create transporter for sending emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Admin email to receive article submissions
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

exports.sendArticleSubmissionEmail = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const { 
        authorName,
        authorEmail,
        documentTitle,
        documentUrl,
        coverPhotoUrl,
        aiAnalysis 
      } = req.body;

      // Email to admin
      const adminMailOptions = {
        from: process.env.EMAIL_USER,
        to: ADMIN_EMAIL,
        subject: 'New Article Submission for Review',
        html: `
          <h2>New Article Submission</h2>
          <p><strong>Author Name:</strong> ${authorName}</p>
          <p><strong>Author Email:</strong> ${authorEmail}</p>
          <p><strong>Document Title:</strong> ${documentTitle}</p>
          <p><strong>Document URL:</strong> <a href="${documentUrl}">View Document</a></p>
          ${coverPhotoUrl ? `<p><strong>Cover Photo:</strong> <a href="${coverPhotoUrl}">View Cover Photo</a></p>` : ''}
          <h3>AI Analysis Results:</h3>
          <pre>${aiAnalysis}</pre>
        `
      };

      // Email to author
      const authorMailOptions = {
        from: process.env.EMAIL_USER,
        to: authorEmail,
        subject: 'Article Submission Received - Engineering Hub',
        html: `
          <h2>Congratulations! Your Article Has Passed Initial Review</h2>
          <p>Dear ${authorName},</p>
          <p>Thank you for submitting your article "${documentTitle}" to Engineering Hub. We're pleased to inform you that your article has successfully passed our initial AI-powered analysis.</p>
          <h3>Next Steps:</h3>
          <ol>
            <li>Your article will be reviewed by our team of industry professionals within the next 24 hours.</li>
            <li>You will receive a follow-up email with the final review decision.</li>
            <li>If approved, your article will be published on Engineering Hub.</li>
          </ol>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>The Engineering Hub Team</p>
        `
      };

      // Send emails
      await Promise.all([
        transporter.sendMail(adminMailOptions),
        transporter.sendMail(authorMailOptions)
      ]);

      res.status(200).json({ message: 'Emails sent successfully' });
    } catch (error) {
      console.error('Error sending emails:', error);
      res.status(500).json({ error: 'Error sending emails' });
    }
  });
});
