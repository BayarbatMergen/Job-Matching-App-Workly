const express = require('express');
const router = express.Router();
const { db, auth } = require('../config/firebase'); //  올바른 경로로 변경
const bcrypt = require('bcrypt');

/*  1. 구직자 회원가입 API
router.post('/register', async (req, res) => {
    try {
       // <== 여기 추가!
      const { name, email, password, phone, bank, accountNumber } = req.body;
  
      if (!name || !email || !password || !phone || !bank || !accountNumber) {
        return res.status(400).json({ message: '모든 필드를 입력하세요.' });
      }
  
      const userRef = db.collection('jobseekers').doc(email);
      const userSnap = await userRef.get();
  
      if (userSnap.exists) {
        return res.status(400).json({ message: '이미 존재하는 이메일입니다.' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      await userRef.set({
        name,
        email,
        phone,
        bank,
        accountNumber,
        password: hashedPassword,
        createdAt: new Date(),
      });
  
      res.status(201).json({ message: '구직자 회원가입 성공!' });
    } catch (error) {
      res.status(500).json({ message: '서버 오류', error: error.message });
    }
  });
  */

//  2. 구직자 목록 조회 API
router.get('/', async (req, res) => {
  try {
    const usersSnapshot = await db.collection('jobseekers').get();
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: '서버 오류', error: error.message });
  }
});

//  3. 특정 구직자 조회 API
router.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const userRef = db.collection('jobseekers').doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ message: '구직자를 찾을 수 없습니다.' });
    }

    res.status(200).json({ id: userSnap.id, ...userSnap.data() });
  } catch (error) {
    res.status(500).json({ message: '서버 오류', error: error.message });
  }
});

//  4. 구직자 정보 수정 API
router.put('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;

    const userRef = db.collection('jobseekers').doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ message: '구직자를 찾을 수 없습니다.' });
    }

    await userRef.update(updates);
    res.status(200).json({ message: '구직자 정보가 수정되었습니다.' });
  } catch (error) {
    res.status(500).json({ message: '서버 오류', error: error.message });
  }
});

//  5. 구직자 삭제 API
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const userRef = db.collection('jobseekers').doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ message: '구직자를 찾을 수 없습니다.' });
    }

    await userRef.delete();
    res.status(200).json({ message: '구직자가 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ message: '서버 오류', error: error.message });
  }
});

module.exports = router;
