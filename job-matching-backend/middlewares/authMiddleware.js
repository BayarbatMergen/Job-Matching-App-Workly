const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: " 인증 토큰이 없습니다!" });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = jwt.verify(token, SECRET_KEY);
    

    req.user = decodedToken;
    next();
  } catch (error) {
    console.error(" [verifyToken] 인증 오류:", error.message);
    return res.status(403).json({ message: " 유효하지 않은 토큰입니다!" });
  }
};

module.exports = { verifyToken };
