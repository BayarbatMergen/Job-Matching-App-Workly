const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

module.exports = ({ db, admin, storage }) => {

  // 🔹 지원 승인 API
  router.post('/applications/:applicationId/approve', async (req, res) => {
    try {
      const { applicationId } = req.params;

      // 1️⃣ 지원 내역 조회
      const applicationRef = db.collection('applications').doc(applicationId);
      const applicationDoc = await applicationRef.get();

      if (!applicationDoc.exists) {
        return res.status(404).json({ message: '지원 내역을 찾을 수 없습니다.' });
      }

      const applicationData = applicationDoc.data();
      const { userId, userEmail, jobId } = applicationData;

      // 2️⃣ 공고 정보 조회
      const jobRef = db.collection('jobs').doc(jobId);
      const jobDoc = await jobRef.get();

      if (!jobDoc.exists) {
        return res.status(404).json({ message: '공고 정보를 찾을 수 없습니다.' });
      }

      const jobData = jobDoc.data();
      const { title, location, startDate, endDate, wage: rawWage } = jobData;
      const wage = Number(rawWage);

      if (isNaN(wage)) {
        return res.status(400).json({ message: '공고의 wage 값이 유효한 숫자가 아닙니다.' });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      const dayCount = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      const totalWage = wage * dayCount;

      // 3️⃣ 스케줄 생성
      await db.collection('schedules').add({
        userId,
        userEmail,
        name: title?.trim() || "제목 없음",
        title,
        location,
        jobId,
        wage,
        totalWage,
        startDate,
        endDate,
        createdAt: admin.firestore.Timestamp.now(),
      });

      // 4️⃣ 지원 상태 업데이트
      await applicationRef.update({
        status: 'approved',
        approvedAt: admin.firestore.Timestamp.now(),
        totalWage,
      });

      // 5️⃣ 단톡방 참가자에 유저 추가
      const chatRoomSnap = await db.collection('chats')
        .where('jobId', '==', jobId)
        .limit(1)
        .get();

      if (!chatRoomSnap.empty) {
        const chatRoomDoc = chatRoomSnap.docs[0];
        await chatRoomDoc.ref.update({
          participants: admin.firestore.FieldValue.arrayUnion(userId),
        });
      } else {
        console.warn(`⚠️ jobId: ${jobId} 에 해당하는 채팅방이 존재하지 않습니다.`);
      }

      // 6️⃣ 사용자 알림 전송
      try {
        console.log("📢 사용자 알림 전송 시작:", userId, title);

        await db
          .collection('notifications')
          .doc(userId)
          .collection('userNotifications')
          .add({
            title: '공고 승인 완료',
            message: `"${title}" 공고에 대한 지원이 승인되었습니다.`,
            read: false,
            createdAt: admin.firestore.Timestamp.now(),
          });

        console.log(" 사용자 알림 전송 완료");
      } catch (err) {
        console.error("사용자 알림 전송 실패:", err);
      }

      return res.status(200).json({ message: '지원 승인 및 알림 전송 완료' });

    } catch (error) {
      console.error('지원 승인 오류:', error);
      return res.status(500).json({ message: '서버 오류 발생', error: error.message });
    }
  });

  return router;
};
