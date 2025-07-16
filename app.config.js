import "dotenv/config";

export default {
  expo: {
    name: "job-matching-app",
    slug: "job-matching-app",
    version: "1.0.0",
    entryPoint: "index.js",
    orientation: "portrait",
    icon: "./assets/images/thechingu.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    owner: "mrgnnn1",

ios: {
  bundleIdentifier: "com.company.jobmatchapp",
  supportsTablet: true,
  googleServicesFile: "./GoogleService-Info.plist",
  infoPlist: {
    ITSAppUsesNonExemptEncryption: false,
    NSPhotoLibraryUsageDescription: "사진을 선택하기 위해 사진 라이브러리에 접근합니다.",
    NSCameraUsageDescription: "사진을 촬영하기 위해 카메라를 사용합니다.",
    NSPhotoLibraryAddUsageDescription: "사진을 저장하기 위해 사진 라이브러리에 접근합니다."
  }
    },

    android: {
      package: "com.anonymous.jobmatchingapp",
      adaptiveIcon: {
        foregroundImage: "./assets/images/thechingu.png",
        backgroundColor: "#ffffff"
      },
      googleServicesFile: "./google-services.json"
    },

    web: {
      bundler: "metro",
      favicon: "./assets/images/thechingu.png"
    },

    plugins: [
      "expo-secure-store",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/thechingu.png",
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
