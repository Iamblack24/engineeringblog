const admin = require('firebase-admin');
const serviceAccount = require('./engineering-hub-3045c-9987ccc5a30a');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://Engineering Hub.firebaseio.com'
});

module.exports = admin;