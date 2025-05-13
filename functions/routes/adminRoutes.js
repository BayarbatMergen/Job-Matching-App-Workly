const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middlewares/authMiddleware');
const adminOnlyMiddleware = require('../middlewares/adminOnlyMiddleware');

module.exports = ({ db, admin, cloudinary }) => {
//  관리자 로그인 API (users 컬렉션 사용)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const userQuery = await db.collection('users').where('email', '==', email).where('role', '==', 'admin').get();

    if (userQuery.empty) {
      return res.status(400).json({ message: '관리자 계정을 찾을 수 없습니다.' });
    }

    const adminData = userQuery.docs[0].data();
    const isMatch = await bcrypt.compare(password, adminData.password);

    if (!isMatch) {
      return res.status(400).json({ message: '비밀번호가 잘못되었습니다.' });
    }

    const token = jwt.sign(
      { userId: adminData.userId, email: adminData.email, role: adminData.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: ' 관리자 로그인 성공!',
      admin: { email: adminData.email, name: adminData.name },
      token
    });
  } catch (error) {
    console.error(" 관리자 로그인 오류:", error);
    res.status(500).json({ message: '서버 오류', error: error.message });
  }
});


//  모든 구직자 조회 API
router.get('/jobseekers', async (req, res) => {
  try {
    const jobseekersSnapshot = await db.collection('jobseekers').get();
    const jobseekers = jobseekersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.status(200).json(jobseekers);
  } catch (error) {
    res.status(500).json({ message: '서버 오류', error: error.message });
  }
});

//  특정 구직자 삭제 API
router.delete('/jobseekers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('jobseekers').doc(id).delete();

    res.status(200).json({ message: `구직자 ${id} 삭제 완료!` });
  } catch (error) {
    res.status(500).json({ message: '서버 오류', error: error.message });
  }
});

//  모든 구인 공고 조회 API
router.get('/jobs', async (req, res) => {
  try {
    const jobsSnapshot = await db.collection('jobs').get();
    const jobs = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: '서버 오류', error: error.message });
  }
});

//  특정 구인 공고 삭제 API
router.delete('/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('jobs').doc(id).delete();

    res.status(200).json({ message: `구인 공고 ${id} 삭제 완료!` });
  } catch (error) {
    res.status(500).json({ message: '서버 오류', error: error.message });
  }
});

router.get('/notifications', async (req, res) => {
  try {
    

    const notificationsSnap = await db.collection('notifications').orderBy('timestamp', 'desc').get();
    const notifications = notificationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    
    res.status(200).json(notifications);
  } catch (error) {
    console.error(" 관리자 알림 조회 중 오류 발생:", error);
    res.status(500).json({ message: " 서버 오류 발생" });
  }
});

//  모든 사용자(글로벌) 알림 생성 API
router.post('/global-notifications', verifyToken, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: '알림 메시지를 입력해주세요.' });
    }

    const newNotification = {
      message,
      createdAt: new Date(),
    };

    const docRef = await db.collection('globalNotifications').add(newNotification);

    res.status(201).json({
      message: ' 글로벌 알림이 추가되었습니다!',
      docId: docRef.id,
      data: newNotification,
    });
  } catch (error) {
    console.error(' 글로벌 알림 추가 오류:', error);
    res.status(500).json({ message: '서버 오류' });
  }
});

//  특정 사용자에게 알림 전송 API
router.post('/user-notifications', verifyToken, async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ message: 'userId와 message를 입력해주세요.' });
    }

    const newNotification = {
      message,
      createdAt: new Date(),
      read: false,
    };

    await db.collection('notifications').doc(userId).collection('userNotifications').add(newNotification);

    res.status(201).json({
      message: ` ${userId} 에게 알림이 전송되었습니다.`,
      data: newNotification,
    });
  } catch (error) {
    console.error(' 사용자 알림 전송 오류:', error);
    res.status(500).json({ message: '서버 오류' });
  }
});

router.post('/applications/:applicationId/approve', async (req, res) => {
  try {
    const { applicationId } = req.params;

    // 1️⃣ 지원 내역 조회
    const applicationRef = db.collection('applications').doc(applicationId);
    const applicationDoc = await applicationRef.get();

    if (!applicationDoc.exists) {
      return res.status(404).json({ message: ' 지원 내역을 찾을 수 없습니다.' });
    }

    const applicationData = applicationDoc.data();
    const { userId, userEmail, jobId, wage } = applicationData;

    // 2️⃣ 공고 정보 조회
    const jobRef = db.collection('jobs').doc(jobId);
    const jobDoc = await jobRef.get();

    if (!jobDoc.exists) {
      return res.status(404).json({ message: ' 공고 정보를 찾을 수 없습니다.' });
    }

    const jobData = jobDoc.data();
    const { title, location, startDate, endDate } = jobData;

    // 3️⃣ 스케줄 생성
    await db.collection('schedules').add({
      userId,
      userEmail,
      name: title?.trim() || "제목 없음",
      title,
      location,
      jobId,
      wage,
      startDate,
      endDate,
      createdAt: admin.firestore.Timestamp.now(),
    });
    

    // 4️⃣ 지원 상태 업데이트
    await applicationRef.update({ status: 'approved' });
    

    // 5️⃣ 공지 단톡방 찾기 및 유저 초대
    

    const chatRoomSnap = await db.collection('chats')
      .where('jobId', '==', jobId)
      .where('roomType', '==', 'notice') //  명확한 구분을 위해 roomType도 필터링
      .limit(1)
      .get();

    if (!chatRoomSnap.empty) {
      const chatRoomDoc = chatRoomSnap.docs[0];
      const chatRef = chatRoomDoc.ref;
      const chatData = chatRoomDoc.data();

      const currentParticipants = chatData.participants || [];

      if (!currentParticipants.includes(userId)) {
        await chatRef.update({
          participants: admin.firestore.FieldValue.arrayUnion(userId),
        });
        
      } else {
        
      }
    } else {
      console.warn(` jobId: ${jobId} 에 해당하는 공지 단톡방이 존재하지 않습니다.`);
    }

    // 6️⃣ 완료 응답
    res.status(200).json({ message: ' 승인 완료 및 스케줄/단톡방 처리 완료' });

  } catch (err) {
    console.error(' 승인 처리 오류:', err);
    res.status(500).json({ message: ' 서버 오류 발생', error: err.message });
  }
});

//  승인 대기 중인 지원 내역 가져오기
router.get('/applications/pending', async (req, res) => {
  try {
    const pendingAppsSnapshot = await db.collection('applications')
      .where('status', '==', 'pending')
      .get();

    const pendingApplications = pendingAppsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(pendingApplications);
  } catch (err) {
    console.error(' 승인 대기 지원 내역 가져오기 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});


//  모든 채팅방 목록 가져오기 (관리자용)
router.get('/chats/all-rooms', async (req, res) => {
  try {
    

    const chatRoomsSnapshot = await db.collection("chats").get();
    const chatRooms = chatRoomsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    
    res.status(200).json(chatRooms);
  } catch (error) {
    console.error(" (관리자) 채팅방 목록 불러오기 오류:", error);
    res.status(500).json({ message: " 서버 오류 발생" });
  }
});

//  특정 사용자 상세 정보 가져오기 API
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    

    const userRef = admin.firestore().collection('users').doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      console.warn(` userId ${userId} 에 해당하는 사용자를 찾을 수 없습니다.`);
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const userData = userSnap.data();
    

    const { password, ...safeData } = userData;

    res.status(200).json(safeData);
  } catch (error) {
    console.error('사용자 상세 조회 오류:', error);
    res.status(500).json({ message: '사용자 정보 가져오기 실패', error: error.message });
  }
});


router.patch('/change-password', async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    const userSnapshot = await admin.firestore().collection('users').where('email', '==', email).get();

    if (userSnapshot.empty) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    
    const isMatch = await bcrypt.compare(currentPassword, userData.password);
    if (!isMatch) {
      return res.status(400).json({ message: '현재 비밀번호가 일치하지 않습니다.' });
    }

    // 비밀번호 조건 검사
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (newPassword.length < 6 || !specialCharRegex.test(newPassword)) {
      return res.status(400).json({ message: '비밀번호는 6자 이상이며 특수문자를 포함해야 합니다.' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await userDoc.ref.update({ password: hashedNewPassword });

    res.status(200).json({ message: '비밀번호 변경 완료' });
  } catch (error) {
    console.error(' 비밀번호 변경 실패:', error);
    res.status(500).json({ message: '서버 오류로 비밀번호 변경에 실패했습니다.' });
  }
});

router.post('/notice', async (req, res) => {
  try {
    const { title, content, author } = req.body;
    const createdAt = new Date(); // 현재 시간

    await admin.firestore().collection('notices').add({
      title,
      content,
      author,
      createdAt,
    });

    res.status(200).json({ message: '공지사항 등록 성공' });
  } catch (error) {
    console.error(' 공지사항 등록 실패:', error);
    res.status(500).json({ message: '공지사항 등록 실패' });
  }
});

router.post('/settlements/request', async (req, res) => {
  const { userId } = req.body;

  try {
    // 1️⃣ pending 요청 있는지 확인
    const existingRequest = await db.collection('settlements')
      .where('userId', '==', userId)
      .where('status', '==', 'pending')
      .get();

    if (!existingRequest.empty) {
      return res.status(400).json({ message: '이미 대기 중인 정산 요청이 있습니다.' });
    }

    // 2️⃣ 사용자 정보 가져오기
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const userData = userDoc.data();
    const totalWage = userData.totalWage || 0;

    if (totalWage <= 0) {
      return res.status(400).json({ message: '요청할 누적 금액이 없습니다.' });
    }

    // 3️⃣ 정산 요청 생성
    await db.collection('settlements').add({
      userId,
      totalWage,
      status: 'pending',
      requestedAt: admin.firestore.Timestamp.now(),
    });

    // 4️⃣ 누적 금액 초기화
    await db.collection('users').doc(userId).update({
      totalWage: 0,
    });

    return res.status(201).json({ message: '정산 요청이 성공적으로 등록되었습니다.' });
  } catch (error) {
    console.error(' 정산 요청 중 오류 발생:', error);
    return res.status(500).json({ message: '서버 오류', error: error.message });
  }
});

router.delete("/chats/delete-room/:roomId", async (req, res) => {
  const { roomId } = req.params;

  try {
    const chatRef = db.collection("chats").doc(roomId);
    const chatSnap = await chatRef.get();

    if (!chatSnap.exists) {
      return res.status(404).json({ message: " 해당 채팅방이 존재하지 않습니다." });
    }

    //  메시지 하위 컬렉션도 같이 삭제하려면 여기에 추가 가능

    await chatRef.delete();
    
    return res.status(200).json({ message: " 채팅방 삭제 완료" });
  } catch (error) {
    console.error(" 단톡방 삭제 오류:", error);
    return res.status(500).json({ message: " 서버 오류", error: error.message });
  }
});

// 모든 사용자 조회 API
router.get('/users', verifyToken, async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => ({ userId: doc.id, ...doc.data() }));

    res.status(200).json(users);
  } catch (error) {
    console.error("사용자 목록 조회 실패:", error);
    res.status(500).json({ message: '사용자 목록을 불러오지 못했습니다.' });
  }
});


  return router;
};
