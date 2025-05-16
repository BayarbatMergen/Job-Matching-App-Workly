const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middlewares/authMiddleware');

module.exports = ({ db, admin, storage }) => {

const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';


const formatPhoneNumber = (phone) => {
  // 이미 올바른 국제전화 형식이면 그대로 통과
  if (/^\+8210\d{7,8}$/.test(phone)) {
    return phone;
  }

  // 숫자만 추출
  const digits = phone.replace(/[^\d]/g, '');

  // 010으로 시작하고 11자리면 국제번호로 변환
  if (/^010\d{8}$/.test(digits)) {
    return `+82${digits.slice(1)}`;
  }

  return null;
};


router.post('/register', async (req, res) => {
  try {
    console.log('📥 [1] 요청 바디 전체:', JSON.stringify(req.body, null, 2));

    let { email, password, name, phone, gender, bank, accountNumber, role, idImageUrl } = req.body;

    if (!email || !password || !name || !phone || !gender) {
      console.log('❌ [2] 필수 항목 누락');
      return res.status(400).json({ message: '모든 필드를 입력하세요.' });
    }

    console.log('🔍 [3] 전화번호 입력값:', phone);
    const onlyDigits = phone.replace(/[^\d]/g, '');
    console.log('🔢 [4] 숫자만 추출된 전화번호:', onlyDigits);

    const isValidPhoneFormat = onlyDigits.length === 11 && onlyDigits.startsWith('010');
    if (!isValidPhoneFormat) {
      console.error('❌ [5] 전화번호 형식 오류:', onlyDigits);
      return res.status(400).json({
        message: "올바른 전화번호 형식이 아닙니다.",
        details: `입력된 번호: ${phone}, 추출된 숫자: ${onlyDigits}`
      });
    }

    const formattedPhone = `+82${onlyDigits.slice(1)}`;
    console.log('✅ [6] 최종 변환된 번호:', formattedPhone);

    console.log('🔒 [7] 비밀번호 해싱 시작');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ [8] 해싱된 비밀번호:', hashedPassword);
    console.log('🧪 [8.1] typeof hashedPassword:', typeof hashedPassword);
    console.log('🧪 [8.2] hashedPassword 값:', hashedPassword);

    console.log('📤 [9] Firebase 사용자 생성 시작');
    const userRecord = await admin.auth().createUser({
      email,
      displayName: name,
      phoneNumber: formattedPhone,
    });
    console.log('✅ [10] Firebase 사용자 생성 성공:', userRecord.uid);

    const imageUrl = idImageUrl || 'https://your-default-profile-url.com';

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

    console.log('🧪 [11.3] Firestore 저장 직전 데이터:', JSON.stringify(userData, null, 2));
    if (!userData.password) {
      console.warn('🚨 [WARN] password 필드가 비어있거나 undefined입니다.');
    }

    // ✅ 강제 병합 방식으로 저장
    await db.collection('users').doc(userRecord.uid).set(
      {
        ...userData,
        password: hashedPassword,
      },
      { merge: true }
    );

    console.log('✅ [12] Firestore 저장 성공');

    res.status(201).json({ 
      message: "회원가입 성공!", 
      userId: userRecord.uid,
      user: {
        ...userData,
        password: undefined, // 클라이언트 응답에 password 포함 X
      }
    });

  } catch (error) {
    console.error("🔥 [ERROR] 회원가입 중 오류 발생:", {
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

    const userSnap = await db.collection('users').where('email', '==', email.toLowerCase().trim()).limit(1).get();
    if (userSnap.empty) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });

    const userDoc = userSnap.docs[0];
    const userData = userDoc.data();

    const token = jwt.sign({
      userId: userData.userId,
      email: userData.email,
      role: userData.role || 'user',
    }, SECRET_KEY, { expiresIn: '7d' });

    const customToken = await admin.auth().createCustomToken(userData.userId);

    res.json({
      message: '로그인 성공!',
      token,
      firebaseToken: customToken,
      user: {
        userId: userData.userId,
        email: userData.email,
        name: userData.name,
        role: userData.role || 'user',
      },
    });
  } catch (error) {
    console.error('로그인 오류:', error);
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