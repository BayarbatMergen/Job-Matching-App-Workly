const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
module.exports = ({ db, admin, storage }) => {
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


  return router;
};

