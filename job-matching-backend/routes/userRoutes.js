const express = require('express');
const router = express.Router();
const { db } = require('../config/firebaseAdmin');

// 🔹 전체 사용자 목록 반환
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(users);
  } catch (error) {
    console.error('전체 사용자 불러오기 오류:', error);
    res.status(500).json({ message: '서버 오류', error: error.message });
  }
});

// 🔹 사용자 UID로 이름 반환
router.get('/:uid', async (req, res) => {
  let { uid } = req.params;
  uid = uid.trim(); // 공백 제거

  try {
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const userData = userDoc.data();
    return res.status(200).json({ name: userData.name || '(이름 없음)' });
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    res.status(500).json({ message: '서버 오류', error: error.message });
  }
});

module.exports = router;
