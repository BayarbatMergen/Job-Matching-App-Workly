const admin = require("firebase-admin");

let initialized = false;

function initializeFirebase() {
  if (initialized) return;

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: "jobmatchingapp-383da.appspot.com",
    });
    console.log("✅ Firebase Functions 환경: applicationDefault()로 Firebase 초기화");
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
