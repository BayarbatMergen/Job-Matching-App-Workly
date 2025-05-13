import "dotenv/config";

export default {
  expo: {
    name: "job-matching-app",
    slug: "job-matching-app",
    version: "1.0.0",
    entryPoint: "index.js",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    
    ios: {
      bundleIdentifier: "com.company.jobmatchapp", // ✅ Firebase에서 등록한 iOS 번들 ID
      supportsTablet: true,
      googleServicesFile: "./GoogleService-Info.plist" // ✅ iOS용 Firebase 파일 경로
    },

    android: {
      package: "com.anonymous.jobmatchingapp", // ✅ Firebase에서 등록한 Android 패키지명
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      googleServicesFile: "./google-services.json" // ✅ Android용 Firebase 파일 경로
    },

    web: {
      bundler: "metro",
      favicon: "./assets/images/favicon.png"
    },

    plugins: [
      "expo-secure-store",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ]
    ],    

    experiments: {
      typedRoutes: true
    },

    extra: {
      useBackendAuth: true,
      firebaseApiKey: process.env.FIREBASE_API_KEY || "AIzaSyAMGE19uGk-A62cRMTWrf164o2XNTTevLI",
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN || "jobmatchingapp-383da.firebaseapp.com",
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "jobmatchingapp-383da",
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET || "jobmatchingapp-383da.appspot.com",
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "937100963582",
      firebaseAppId: process.env.FIREBASE_APP_ID || "1:937100963582:web:a722b7f770cb3d3db73faf",
      firebaseMeasurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-85K46L7DNP",
      eas: {
        projectId: "83bb19eb-57b1-4d6b-ad6a-8af26ea7a58e"
      }
    }
  }
};
