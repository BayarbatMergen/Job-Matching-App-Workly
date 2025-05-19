const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

let initialized = false;

function initializeFirebase() {
  if (initialized) return;

 if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: "jobmatchingapp-383da.appspot.com",
    });
    console.log("✅ Firebase Admin SDK: cert 방식으로 초기화됨");
  }

  initialized = true;
}

module.exports = {
  initializeFirebase,
  get admin() {
    initializeFirebase();
    return admin;
  },
  get db() {
    initializeFirebase();
    return admin.firestore();
  },
  get storage() {
    initializeFirebase();
    return admin.storage().bucket();
  },
  get adminAuth() {
    initializeFirebase();
    return admin.auth();
  }
};
