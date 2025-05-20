const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() }); // 메모리에 저장
const admin = require('firebase-admin');
const crypto = require("crypto");
const nodemailer = require("nodemailer");

module.exports = ({ db, admin }) => {

const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';
const smtpConfig = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
};

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
    let { email, password, name, phone, gender, bank, accountNumber, role, idImageUrl } = req.body;

    // [1] 필수 입력값 확인
    if (!email || !password || !name || !phone || !gender) {
      return res.status(400).json({ message: '모든 필드를 입력하세요.' });
    }

    email = email.toLowerCase().trim();
    role = role === 'admin' ? 'admin' : 'user';
    const formattedPhone = formatPhoneNumber(phone);

    // [2] 같은 이름 중복 확인
    const existingName = await db.collection('users').where('name', '==', name).get();
    if (!existingName.empty) {
      return res.status(400).json({ message: '이미 존재하는 이름입니다. 다른 이름을 사용하세요.' });
    }

    // [3] 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // [4] Firebase 사용자 생성
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
      phoneNumber: formattedPhone,
    });
    await admin.auth().setCustomUserClaims(userRecord.uid, { role });
    // [5] 이미지 업로드 (신분증 확인은 여기서)
    let imageUrl = idImageUrl || '';
    if (req.file) {
      imageUrl = await uploadFileToStorage(req.file);
    }

    if (!imageUrl) {
      return res.status(400).json({ message: '신분증 사진이 필요합니다.' });
    }

    // [6] Firestore 저장
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

    await db.collection('users').doc(userRecord.uid).set(userData);

    res.status(201).json({
      message: "회원가입 성공!",
      userId: userRecord.uid,
      user: {
        ...userData,
        password: undefined, // 보안상 프론트로 전송하지 않음
      }
    });

  } catch (error) {
    if (error.code === 'auth/phone-number-already-exists') {
      return res.status(400).json({ message: "이미 사용 중인 전화번호입니다." });
    }
    if (error.code === 'auth/invalid-phone-number') {
      return res.status(400).json({ message: "유효하지 않은 전화번호 형식입니다." });
    }

    console.error('[회원가입 오류]', error);
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
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "현재 비밀번호와 새 비밀번호를 입력하세요." });
    }

    const userId = req.user.userId;
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const userData = userSnap.data();

    // 현재 비밀번호 확인
    const isMatch = await bcrypt.compare(currentPassword, userData.password);
    if (!isMatch) {
      return res.status(400).json({ message: "현재 비밀번호가 일치하지 않습니다." });
    }

    // 새 비밀번호 유효성 검사
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (newPassword.length < 6 || !specialCharRegex.test(newPassword)) {
      return res.status(400).json({ message: '비밀번호는 6자 이상이며 특수문자를 포함해야 합니다.' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await userRef.update({
      password: hashedNewPassword,
      passwordChangedAt: new Date()
    });

    res.status(200).json({ message: "비밀번호 변경이 완료되었습니다." });
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

router.post('/request-reset-password', async (req, res) => {
  const { email } = req.body;

  try {
    const userSnap = await db.collection('users').where('email', '==', email).limit(1).get();
    if (userSnap.empty) return res.status(404).json({ message: '해당 이메일을 가진 사용자가 없습니다.' });

    const userDoc = userSnap.docs[0];
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpire = Date.now() + 1000 * 60 * 60;

    await userDoc.ref.update({ resetToken, resetTokenExpire });

const resetLink = `https://jobmatchingapp-383da.web.app/reset-password?token=${resetToken}&uid=${userDoc.id}`;


    // ✅ 환경변수에서 smtp 설정 읽기

    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: parseInt(smtpConfig.port),
      secure: false,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
    });

    const mailOptions = {
      from: smtpConfig.user,
      to: email,
      subject: "비밀번호 재설정 안내",
      html: `
        <p>안녕하세요,</p>
        <p>아래 버튼을 클릭하여 비밀번호를 재설정하세요. 유효시간은 1시간입니다.</p>
        <a href="${resetLink}" style="padding: 10px 20px; background-color: #007AFF; color: white; text-decoration: none; border-radius: 5px;">비밀번호 재설정</a>
        <p>만약 요청하지 않았다면 이 이메일을 무시하셔도 됩니다.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ 이메일 전송 완료:", resetLink);

    res.status(200).json({ message: "비밀번호 재설정 링크가 이메일로 전송되었습니다." });

  } catch (err) {
    console.error("비밀번호 재설정 링크 생성 오류:", err.message, err.stack);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

// ✅ 최종 권장 버전
router.post('/reset-password', async (req, res) => {
  const { token, uid, newPassword } = req.body;

  if (!uid || !token || !newPassword) {
    return res.status(400).json({ message: "필수 항목 누락" });
  }

  try {
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ message: "사용자 없음" });

    const userData = userDoc.data();

    if (userData.resetToken !== token || Date.now() > userData.resetTokenExpire) {
      return res.status(400).json({ message: "유효하지 않거나 만료된 토큰" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await userRef.update({
      password: hashed,
      resetToken: admin.firestore.FieldValue.delete(),
      resetTokenExpire: admin.firestore.FieldValue.delete()
    });

    return res.status(200).json({ message: "비밀번호가 성공적으로 변경되었습니다." });
  } catch (err) {
    console.error("비밀번호 재설정 오류:", err);
    return res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

  return router;
};
