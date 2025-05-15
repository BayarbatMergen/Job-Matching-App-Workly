const { db } = require("../config/firebase");

// ✅ 관리자에게 정산 요청 알림 전송 (role 기반 저장)
exports.sendAdminNotification = async (userId, amount) => {
  try {
    // 🔍 사용자 정보 가져오기
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      console.warn("사용자 정보 없음.");
      return;
    }

    const userData = userDoc.data();
    const userName = userData.name || "알 수 없음";
    const userEmail = userData.email || "이메일 없음";

    // 📩 알림 메시지 생성
    const message = `사용자 ${userName} (${userEmail})님이 ${amount.toLocaleString()}원 정산 요청을 보냈습니다.`;

    // ✅ 관리자 역할을 가진 모든 사용자가 볼 수 있도록 role 기반 저장
    await db.collection("notifications").add({
      title: "정산 요청",
      message,
      type: "settlement",
      status: "unread",
      recipientRole: "admin", // ✅ 중요
      createdAt: new Date(),
    });

    console.log("✅ 관리자 역할 대상 정산 알림 전송 완료");

  } catch (error) {
    console.error("❌ 관리자 알림 전송 오류:", error);
  }
};
