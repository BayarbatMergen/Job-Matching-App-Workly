const admin = require('firebase-admin');
const functions = require('firebase-functions');

// 🔐 Firebase Functions에 저장된 config에서 키 가져오기
const serviceAccount = functions.config().admin;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'), 
    storageBucket: "jobmatchingapp-383da.appspot.com",
  });
  console.log(" Firebase Admin SDK initialized with functions.config()");
}

const db = admin.firestore();
const storage = admin.storage().bucket();

module.exports = {
  admin,
  db,
  storage,
};
