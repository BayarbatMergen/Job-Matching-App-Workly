const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const express = require('express');
const cors = require('cors');

const ADMIN_UID = defineSecret('ADMIN_UID'); 

console.log('🚀 Firebase Functions 시작됨');

// ✅ Firebase Admin 초기화 모듈 로딩 및 강제 초기화 호출
const firebase = require('./config/firebase');
firebase.initializeFirebase(); // ✅ 이거 꼭 먼저 호출해야 됨!!

const { admin, db, storage } = firebase;
console.log('✅ Firebase Admin SDK 로딩 및 초기화 완료');

const app = express();
app.use(cors({ origin: true }));

// ✅ multipart/form-data 처리 라우터 먼저 (multer 대비)
const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes({ db, admin, storage }));
console.log('✅ /auth 라우터 등록 완료');

// ✅ JSON 및 URL 인코딩 파서
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ 나머지 라우터들 등록
const routes = [
  { path: '/admin', file: './routes/adminRoutes' },
  { path: '/application', file: './routes/applicationRoutes' },
  { path: '/chat', file: './routes/chatRoutes' },
  { path: '/jobs', file: './routes/jobRoutes' },
  { path: '/jobseeker', file: './routes/jobSeekerRoutes' },
  { path: '/schedule', file: './routes/scheduleRoutes' },
  { path: '/user', file: './routes/userRoutes' },
];

routes.forEach(({ path, file }) => {
  try {
    const routeModule = require(file);
    if (typeof routeModule === 'function') {
      app.use(path, routeModule({ db, admin, storage }));
      console.log(`✅ ${path} 라우터 등록 완료`);
    } else {
      console.error(`❌ ${path} 모듈이 함수가 아님`);
    }
  } catch (err) {
    console.error(`❌ ${path} 라우터 로딩 실패:`, err);
  }
});

// ✅ 기본 루트 라우터
app.get('/', (req, res) => {
  res.send('✅ Firebase Express Server Running');
});

console.log('✅ 모든 설정 완료, Firebase Functions에 연결합니다.');
exports.api = onRequest({ secrets: [ADMIN_UID] }, app);