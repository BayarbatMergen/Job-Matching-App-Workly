const { getFirestore } = require("firebase-admin/firestore");
const { db } = require("../config/firebase");
const { sendAdminNotification } = require("../utils/notificationService");
const admin = require("firebase-admin");

/**
 *  전체 일정 조회 (관리자만 가능)
 */
const getAllSchedules = async (req, res) => {
  try {
    console.info("📥 [GET /api/schedules] 전체 일정 요청 수신");

    const schedulesRef = db.collection("schedules");
    const snapshot = await schedulesRef.get();

    if (snapshot.empty) {
      return res.status(404).json({ message: " 일정 데이터가 없습니다." });
    }

    let schedules = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return res.status(200).json(schedules);
  } catch (error) {
    console.error(" 전체 일정 조회 오류:", error);
    return res.status(500).json({ message: "서버 오류 발생", error: error.message });
  }
};

/**
 *  특정 유저의 일정 조회 (로그인한 사용자만 가능)
 */
const getUserSchedules = async (req, res) => {
  console.info(`📥 [GET /api/schedules/user] 요청 수신`);

  try {
    // 🔹 `verifyToken`에서 `req.user`가 올바르게 전달되었는지 확인
    if (!req.user || !req.user.userId) {
      console.error(" [getUserSchedules] req.user가 정의되지 않음");
      return res.status(401).json({ message: " 인증되지 않은 사용자입니다." });
    }

    const userId = req.user.userId;
    console.info(` 사용자 일정 요청 userId: ${userId}`);

    const querySnapshot = await db
      .collection("schedules")
      .where("userId", "==", userId)
      .get();

    if (querySnapshot.empty) {
      return res.status(404).json({ message: " 해당 사용자의 일정이 없습니다." });
    }

    const schedules = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(schedules);
  } catch (error) {
    console.error(" 사용자 일정 조회 오류:", error);
    return res.status(500).json({ message: "서버 오류 발생", error: error.message });
  }
};

/**
 *  개별 일정 조회
 */
const getScheduleById = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    console.info(` 개별 일정 요청 scheduleId: ${scheduleId}`);

    if (!scheduleId) {
      return res.status(400).json({ message: " scheduleId가 제공되지 않았습니다." });
    }

    const scheduleDoc = await db.collection("schedules").doc(scheduleId).get();

    if (!scheduleDoc.exists) {
      return res.status(404).json({ message: " 해당 일정이 존재하지 않습니다." });
    }

    return res.status(200).json({ id: scheduleDoc.id, ...scheduleDoc.data() });
  } catch (error) {
    console.error(" 개별 일정 조회 오류:", error);
    return res.status(500).json({ message: "서버 오류 발생", error: error.message });
  }
};

//  정산 요청 처리 함수 (최종 완성본)
const requestSettlement = async (req, res) => {
  try {
    

    const userId = req.user?.userId;  //  JWT 토큰에서 userId 가져오기
    const { totalWage } = req.body;

    if (!userId || !totalWage) {
      return res.status(400).json({ message: " userId와 totalWage가 필요합니다." });
    }

    

    //  1) 마지막 스케줄 종료일 검사
    const userSchedules = await db.collection('schedules').where('userId', '==', userId).get();
    let lastEndDate = new Date(0);
    userSchedules.forEach(doc => {
      const endDate = new Date(doc.data().endDate);
      if (endDate > lastEndDate) {
        lastEndDate = endDate;
      }
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (today <= lastEndDate) {
      return res.status(400).json({ message: '모든 스케줄이 종료된 다음 날부터 정산 요청이 가능합니다.' });
    }

    //  2) 이미 pending 상태의 요청이 있는지 검사
    const existingRequests = await db.collection('settlements')
      .where('userId', '==', userId)
      .where('status', '==', 'pending')
      .get();

    if (!existingRequests.empty) {
      return res.status(400).json({ message: '승인 대기 중인 정산 요청이 이미 존재합니다.' });
    }

    //  3) 정산 요청 저장
    await db.collection("settlements").add({
      userId,
      totalWage,
      status: "pending",
      requestedAt: new Date(),
    });

    //  4) 관리자 알림 전송
    await sendAdminNotification(userId, totalWage);

    res.status(200).json({ message: " 정산 요청이 관리자에게 전송되었습니다." });
  } catch (error) {
    console.error(" 정산 요청 오류:", error);
    res.status(500).json({ message: " 서버 오류 발생" });
  }
};

const approveSettlement = async (req, res) => {
  
  try {
    const { settlementId, userId } = req.body;
    
    if (!settlementId || !userId) {
      return res.status(400).json({ message: "settlementId와 userId가 필요합니다." });
    }

    // 1️⃣ 정산 요청 문서 가져오기
    const settlementRef = db.collection("settlements").doc(settlementId);
    const settlementSnap = await settlementRef.get();

    if (!settlementSnap.exists) {
      return res.status(404).json({ message: "해당 정산 요청이 존재하지 않습니다." });
    }

    const { totalWage } = settlementSnap.data();

    // 2️⃣ 정산 상태 업데이트
    await settlementRef.update({
      status: "approved",
      approvedAt: admin.firestore.Timestamp.now(),
    });

    // 3️⃣ 스케줄 삭제
    const scheduleQuery = db.collection("schedules").where("userId", "==", userId);
    const snapshot = await scheduleQuery.get();

    const batch = db.batch();
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // 4️⃣ 사용자에게 개인 알림 전송
    try {
      const result = await db.collection("notifications")
        .doc(userId)
        .collection("userNotifications")
        .add({
          title: "정산 완료",
          message: `요청하신 ${totalWage.toLocaleString()}원의 정산이 승인되었습니다.`,
          read: false,
          createdAt: admin.firestore.Timestamp.now(),
        });
      
    } catch (error) {
      console.error(" 알림 저장 실패:", error);
    }

    

    res.status(200).json({ message: "정산 승인 완료, 스케줄 삭제 및 사용자 알림 전송됨" });
  } catch (error) {
    console.error("정산 승인 처리 오류:", error);
    res.status(500).json({ message: "서버 오류 발생", error: error.message });
  }
};

//  정산 요청 처리 함수 (라우트 제거됨, `export`만 유지)
exports.requestSettlement = async (req, res) => {
  try {
    const { userId, totalWage } = req.body;

    if (!userId || !totalWage) {
      return res.status(400).json({ message: " userId와 totalWage가 필요합니다." });
    }

    

    //  Firestore에 정산 요청 저장
    await db.collection("settlementRequests").add({
      userId,
      totalWage,
      status: "pending",
      createdAt: new Date(),
    });

    //  관리자에게 알림 보내기
    await sendAdminNotification(userId, totalWage);

    res.status(200).json({ message: " 정산 요청이 관리자에게 전송되었습니다." });
  } catch (error) {
    console.error(" 정산 요청 오류:", error);
    res.status(500).json({ message: " 서버 오류 발생" });
  }
};

module.exports = {
  getAllSchedules,
  getUserSchedules,
  getScheduleById,
  requestSettlement,
  approveSettlement,
};