const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");

//  로그인 함수 (최종 수정)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "이메일과 비밀번호를 입력하세요." });
    }

    // Firestore에서 사용자 찾기
    const userQuery = await admin
      .firestore()
      .collection("users")
      .where("email", "==", email)
      .get();

    if (userQuery.empty) {
      return res.status(401).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const userDoc = userQuery.docs[0];
    const user = userDoc.data();
    
    const userId = userDoc.id;

    // 비밀번호 검증 (실제 서비스에서는 반드시 해시 비교 필요)
    if (user.password !== password) {
      return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
    }

    // JWT 토큰 생성 (role 포함)
    const token = jwt.sign(
      {
        userId,
        email: user.email,
        role: user.role?.toLowerCase() === "admin" ? "admin" : "user",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Firebase Custom Token 생성
    const customToken = await admin.auth().createCustomToken(userId);

    //  최종 응답
    res.json({
      message: " 로그인 성공!",
      token,
      firebaseToken: customToken,   //  여기서 customToken 사용!
      user: {
        userId,
        email: user.email,
        name: user.name,
        role: user.role?.toLowerCase() === "admin" ? "admin" : "user",
      },
    });
  } catch (error) {
    console.error(" [로그인 실패]:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!userId) {
      return res.status(400).json({ message: " 사용자 ID가 없습니다!" });
    }

    const userRef = admin.firestore().collection("users").doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ message: " 사용자 정보를 찾을 수 없습니다!" });
    }

    res.status(200).json({ user: userSnap.data() });
  } catch (error) {
    console.error(" [getUserProfile] 사용자 정보 조회 실패:", error);
    res.status(500).json({ message: " 서버 오류 발생" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.user.userId;

    if (!newPassword) {
      return res.status(400).json({ message: "새 비밀번호를 입력하세요." });
    }

    await admin.auth().updateUser(userId, { password: newPassword });
    res.status(200).json({ message: "비밀번호 변경 완료!" });
  } catch (error) {
    console.error(" 비밀번호 변경 실패:", error);
    res.status(500).json({ message: "비밀번호 변경 실패" });
  }
};

const validateToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ valid: false, message: " 토큰이 제공되지 않았습니다." });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ valid: false, message: " 토큰이 유효하지 않습니다." });
    }

    
    return res.json({
      valid: true,
      userId: decoded.userId,
      role: decoded.role === "admin" ? "admin" : "user",
    });
  } catch (error) {
    console.error(" [validateToken] 오류 발생:", error);
    return res.status(500).json({ valid: false, message: " 서버 오류 발생" });
  }
};

module.exports = { login, getUserProfile, validateToken, changePassword };
