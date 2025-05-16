const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() }); // 메모리에 저장

module.exports = ({ db, admin }) => {

const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

const formatPhoneNumber = (phone) => {
  if (!phone) return null;

  const cleaned = phone.replace(/\D/g, '');

  // 01012345678 → +821012345678
  if (cleaned.length === 11 && cleaned.startsWith('010')) {
    return `+82${cleaned.slice(1)}`;
  }

  // 이미 +8210... 형식이라면 그대로 허용
  if (/^\+8210\d{7,8}$/.test(phone)) {
    return phone;
  }

  return null;
};

    const uploadFileToStorage = async (file) => {
    const { originalname, buffer, mimetype } = file;
    const filename = `idImages/${Date.now()}_${originalname}`;
    const bucket = admin.storage().bucket();
    const fileRef = bucket.file(filename);

    await fileRef.save(buffer, {
      metadata: { contentType: mimetype },
    });

    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: '03-09-2491',
    });

    return url;
  };

router.post('/register', upload.single('idImage'), async (req, res) => {
  try {
    console.log('📥 [1] 요청 바디:', req.body);
    console.log('📎 [2] 업로드된 파일:', req.file);

    let { email, password, name, phone, gender, bank, accountNumber, role } = req.body;

    if (!email || !password || !name || !phone || !gender) {
      console.warn('❌ [3] 필수 입력값 누락됨');
      return res.status(400).json({ message: '모든 필드를 입력하세요.' });
    }

    email = email.toLowerCase().trim();
    role = role === 'admin' ? 'admin' : 'user';

    const formattedPhone = formatPhoneNumber(phone);
    console.log('📞 [4] 변환된 전화번호:', formattedPhone);

    if (!formattedPhone) {
      console.error('❌ [5] 전화번호 형식 오류:', phone);
      return res.status(400).json({ message: "올바른 전화번호 형식이 아닙니다." });
    }

    // 🔒 비밀번호 해싱
    console.log('🔐 [6] 비밀번호 해싱 시작');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ [7] 해싱된 비밀번호:', hashedPassword);

    // 🧪 추가 확인
    console.log('🧪 [7.1] hashedPassword typeof:', typeof hashedPassword);
    if (!hashedPassword) {
      console.warn('🚨 [7.2] hashedPassword가 비어있음!');
    }

    // ✅ Firebase Auth에 사용자 생성
    console.log('🚀 [8] Firebase 사용자 생성 요청');
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
      phoneNumber: formattedPhone,
    });
    console.log('✅ [9] Firebase 사용자 생성 완료:', userRecord.uid);

    // 📸 이미지 업로드
    let imageUrl = req.body.idImageUrl || 'https://your-default-profile-url.com';
    if (req.file) {
      console.log('🖼️ [10] 이미지 업로드 시작');
      imageUrl = await uploadFileToStorage(req.file);
      console.log('✅ [11] 이미지 업로드 완료:', imageUrl);
    }

    const userData = {
      userId: userRecord.uid,
      name,
      email,
      phone: formattedPhone,
      gender,
      bank: bank || "은행 미선택",
      accountNumber: accountNumber || "0000-0000-0000",
      role,
      idImage: imageUrl,
      password: hashedPassword,
      createdAt: new Date(),
    };

    console.log('🧾 [12] Firestore 저장 전 userData:', JSON.stringify(userData, null, 2));
    console.log('🗝️ [13] userData 필드 목록:', Object.keys(userData));
    if (!userData.password) {
      console.warn('🚨 [13.1] password 필드가 undefined입니다.');
    } else {
      console.log('✅ [13.2] password 필드가 존재합니다.');
    }

    // Firestore 저장
    await db.collection('users').doc(userRecord.uid).set(userData);
    console.log('✅ [14] Firestore 저장 성공');

    // 응답
    res.status(201).json({
      message: "회원가입 성공!",
      userId: userRecord.uid,
      user: {
        ...userData,
        password: undefined, // 프론트로 password 안 보냄
      }
    });

  } catch (error) {
    console.error("🔥 [ERROR] 회원가입 실패:", {
      code: error.code,
      message: error.message,
      stack: error.stack,
    });

    if (error.code === 'auth/phone-number-already-exists') {
      return res.status(400).json({ message: "이미 사용 중인 전화번호입니다." });
    }

    if (error.code === 'auth/invalid-phone-number') {
      return res.status(400).json({ message: "유효하지 않은 전화번호 형식입니다." });
    }

    res.status(500).json({ message: error.message || '서버 오류' });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: '이메일과 비밀번호를 입력하세요.' });
    }

    const userSnap = await db
      .collection('users')
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get();

    if (userSnap.empty) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const userDoc = userSnap.docs[0];
    const userData = userDoc.data();

    // 🔒 비밀번호 비교
    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    // 🔑 JWT 토큰 발급
    const token = jwt.sign(
      {
        userId: userData.userId,
        email: userData.email,
        role: userData.role || 'user',
      },
      SECRET_KEY,
      { expiresIn: '7d' }
    );

    // 🔐 Firebase용 커스텀 토큰도 발급
    const customToken = await admin.auth().createCustomToken(userData.userId);

    // 🔁 응답 데이터
    const { password: _, ...safeUserData } = userData;

    res.json({
      message: '로그인 성공!',
      token,
      firebaseToken: customToken,
      user: safeUserData,
    });

  } catch (error) {
    console.error('🔥 로그인 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      console.warn(" 해당 사용자를 찾을 수 없음:", userId);
      return res.status(404).json({ message: " 사용자 정보를 찾을 수 없습니다." });
    }

    const userData = userSnap.data();
    delete userData.password;
    res.status(200).json(userData);
  } catch (error) {
    console.error(" 사용자 정보 조회 오류:", error);
    res.status(500).json({ message: " 서버 오류 발생" });
  }
});

router.put('/update', verifyToken, async (req, res) => {
  try {
    const { name, phone, gender, idImageUrl } = req.body;
    const userId = req.user.userId;

    let updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = formatPhoneNumber(phone);
    if (gender) updateData.gender = gender;
    if (idImageUrl) updateData.idImage = idImageUrl;

    await db.collection('users').doc(userId).update(updateData);
    res.status(200).json({ message: " 사용자 정보 수정 성공!", updatedUser: updateData });
  } catch (error) {
    console.error(" 사용자 정보 수정 중 오류:", error);
    res.status(500).json({ message: " 서버 오류 발생" });
  }
});

router.put('/change-password', verifyToken, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ message: "새 비밀번호를 입력하세요." });
    }

    const userId = req.user.userId;
    await admin.auth().updateUser(userId, { password: newPassword });

    res.status(200).json({ message: "비밀번호 변경 성공!" });
  } catch (error) {
    console.error("비밀번호 변경 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

router.post("/validate-token", (req, res) => {
  const token = req.body.token;
  if (!token) return res.status(400).json({ message: "토큰이 제공되지 않았습니다." });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ message: "토큰이 유효하지 않습니다." });
    res.status(200).json({ valid: true, user: decoded });
  });
});

router.get("/me", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ message: " 사용자를 찾을 수 없습니다." });
    }

    const userData = userSnap.data();
    delete userData.password;

    res.status(200).json(userData);
  } catch (error) {
    console.error(" 사용자 정보 조회 오류:", error);
    res.status(500).json({ message: " 서버 오류 발생" });
  }
});

  return router;
};
