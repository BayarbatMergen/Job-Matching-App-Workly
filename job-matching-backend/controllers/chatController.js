const { db } = require("../config/firebase");
const admin = require('firebase-admin');

//  메시지 가져오기
const getChatMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!roomId) return res.status(400).json({ message: " 유효한 채팅방 ID가 필요합니다." });

    const messagesSnapshot = await db
      .collection("chats")
      .doc(roomId)
      .collection("messages")
      .orderBy("createdAt", "asc")
      .get();

    const messages = messagesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(messages);
  } catch (error) {
    console.error(" 채팅 메시지 불러오기 오류:", error);
    res.status(500).json({ message: " 서버 오류 발생" });
  }
};

//  메시지 추가
// 메시지 추가
const addMessageToChat = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { text } = req.body;
    const senderId = req.user.userId;

    if (!roomId || !text) {
      return res.status(400).json({ message: "roomId와 text가 필요합니다." });
    }

    const roomDoc = await db.collection("chats").doc(roomId).get();
    const roomData = roomDoc.data();

    if (roomData && roomData.roomType === "notice" && senderId !== process.env.ADMIN_UID) {
      return res.status(403).json({ message: "공지방에는 관리자만 메시지를 보낼 수 있습니다." });
    }

    const createdAt = admin.firestore.Timestamp.now();
    const messageRef = db.collection("chats").doc(roomId).collection("messages").doc();
    
    const newMessage = {
      text,
      senderId,
      createdAt,
      readBy: [senderId], // 처음 보낸 사람은 읽은 것으로 처리
    };

    await messageRef.set(newMessage);

    return res.status(200).json({
      message: "메시지 추가 성공!",
      data: { id: messageRef.id, ...newMessage },
    });
  } catch (error) {
    console.error("메시지 추가 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
};


//  채팅방 목록 가져오기
const getChatRooms = async (req, res) => {
  try {
    const { userId } = req.user;
    if (!userId) return res.status(401).json({ message: " 사용자 인증 필요" });

    const participantRoomsSnapshot = await db
      .collection("chats")
      .where("participants", "array-contains", userId)
      .get();

    const participantRooms = participantRoomsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(participantRooms);
  } catch (error) {
    console.error(" 채팅방 목록 불러오기 오류:", error);
    res.status(500).json({ message: " 서버 오류 발생" });
  }
};

//  관리자 채팅방 생성
const createOrGetAdminChatRoom = async (req, res) => {
  try {
    const { userId } = req.user;
    const adminUid = process.env.ADMIN_UID;

    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ message: " 사용자 정보를 찾을 수 없습니다." });
    const userName = userDoc.data().name || "사용자";

    const existingRoomSnapshot = await db.collection("chats")
      .where("type", "==", "admin")
      .where("participants", "array-contains", userId)
      .get();

    if (!existingRoomSnapshot.empty) {
      const existingRoom = existingRoomSnapshot.docs[0];
      return res.status(200).json({
        roomId: existingRoom.id,
        name: existingRoom.data().name || `관리자 상담 (${userName})`,
        roomType: existingRoom.data().roomType || "admin",
      });
    }

    const newRoom = {
      name: `관리자 상담 (${userName})`,
      participants: [userId, adminUid],
      createdAt: admin.firestore.Timestamp.now(),
      type: "admin",
      roomType: "admin",
    };

    const roomRef = await db.collection("chats").add(newRoom);
    return res.status(201).json({
      roomId: roomRef.id,
      name: newRoom.name,
      roomType: newRoom.roomType,
    });
  } catch (error) {
    console.error(" 관리자 채팅방 생성 오류:", error);
    res.status(500).json({ message: " 서버 오류 발생" });
  }
};

//  공지방 생성
const createNoticeRoom = async (req, res) => {
  try {
    const { name, participants } = req.body;

    if (!name) return res.status(400).json({ message: " 방 이름이 필요합니다." });

    const newRoom = {
      name,
      participants,
      createdAt: admin.firestore.Timestamp.now(),
      type: 'notice',
      roomType: 'notice',
    };

    const roomRef = await db.collection("chats").add(newRoom);
    return res.status(201).json({ roomId: roomRef.id, name, roomType: 'notice' });
  } catch (error) {
    console.error(" 공지방 생성 오류:", error);
    res.status(500).json({ message: " 서버 오류 발생" });
  }
};

//  채팅방에 새 유저 추가 + 입장 메시지 자동 생성
const addUserToChatRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body;

    if (!roomId || !userId) {
      return res.status(400).json({ message: "roomId와 userId가 필요합니다." });
    }

    const userDoc = await db.collection("users").doc(userId).get();
    const userName = userDoc.exists ? userDoc.data().name : "사용자";

    const chatRef = db.collection("chats").doc(roomId);
    await chatRef.update({
      participants: admin.firestore.FieldValue.arrayUnion(userId),
    });

    await chatRef.collection("messages").add({
      text: `📢 ${userName}님이 입장하셨습니다.`,
      senderId: "system",
      createdAt: admin.firestore.Timestamp.now(),
    });

    res.status(200).json({ message: " 유저 추가 및 입장 메시지 전송 완료" });
  } catch (error) {
    console.error(" 유저 추가 오류:", error);
    res.status(500).json({ message: " 서버 오류 발생" });
  }
};

//  채팅방 참가자 조회
const getChatParticipants = async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!roomId) return res.status(400).json({ message: "roomId가 필요합니다." });

    const chatDoc = await db.collection("chats").doc(roomId).get();
    if (!chatDoc.exists) return res.status(404).json({ message: "채팅방을 찾을 수 없습니다." });

    const participantIds = chatDoc.data().participants || [];

    const userPromises = participantIds.map((uid) => db.collection("users").doc(uid).get());
    const userDocs = await Promise.all(userPromises);
    const users = userDocs.map((doc) => ({ id: doc.id, ...doc.data() }));

    res.status(200).json(users);
  } catch (error) {
    console.error(" 채팅 참가자 조회 오류:", error);
    res.status(500).json({ message: " 서버 오류 발생" });
  }
};

const getUserNameById = async (req, res) => {
  try {
    const { uid } = req.params;
    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: " 사용자를 찾을 수 없습니다." });
    }

    const userData = userDoc.data();
    return res.status(200).json({ name: userData.name || "이름 없음" });
  } catch (error) {
    console.error(" 사용자 정보 조회 실패:", error);
    return res.status(500).json({ message: " 서버 오류", error: error.message });
  }
};

const markMessageAsRead = async (req, res) => {
  try {
    const { roomId, messageId } = req.params;
    const { userId } = req.body;

    const msgRef = db.collection('chats').doc(roomId).collection('messages').doc(messageId);
    await msgRef.update({
      readBy: admin.firestore.FieldValue.arrayUnion(userId)
    });

    res.status(200).json({ message: "읽음 처리 완료" });
  } catch (error) {
    console.error("읽음 처리 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
};

const getUnreadChatRooms = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId가 필요합니다." });

    const chatSnapshot = await db
      .collection("chats")
      .where("participants", "array-contains", userId)
      .get();

    const unreadRoomIds = [];

    for (const doc of chatSnapshot.docs) {
      const roomId = doc.id;
      const messagesSnapshot = await db
        .collection("chats")
        .doc(roomId)
        .collection("messages")
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();

      let hasUnread = false;
      messagesSnapshot.forEach((msgDoc) => {
        const msg = msgDoc.data();
        if (msg.senderId !== userId && (!msg.readBy || !msg.readBy.includes(userId))) {
          hasUnread = true;
        }
      });

      if (hasUnread) unreadRoomIds.push(roomId);
    }

    return res.status(200).json({ unreadRoomIds });
  } catch (error) {
    console.error("안읽은 메시지 조회 오류:", error);
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
};

// 사용자 기준 읽지 않은 채팅방 목록 조회
const getUnreadStatus = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ message: "userId가 필요합니다." });

    const chatSnap = await db.collection("chats")
      .where("participants", "array-contains", userId)
      .get();

    const unreadStatus = {}; // { roomId: true/false }

    const checkPromises = chatSnap.docs.map(async (doc) => {
      const roomId = doc.id;
      const messagesSnap = await db.collection("chats").doc(roomId)
        .collection("messages")
        .orderBy("createdAt", "desc")
        .limit(10) // 최근 메시지 10개만 확인 (퍼포먼스)
        .get();

      let hasUnread = false;

      messagesSnap.forEach((msgDoc) => {
        const msg = msgDoc.data();
        const senderId = msg.senderId;
        const readBy = msg.readBy || [];

        if (senderId !== userId && !readBy.includes(userId)) {
          hasUnread = true;
        }
      });

      unreadStatus[roomId] = hasUnread;
    });

    await Promise.all(checkPromises);

    return res.status(200).json(unreadStatus);
  } catch (error) {
    console.error(" 읽지 않은 상태 확인 오류:", error);
    return res.status(500).json({ message: "서버 오류 발생" });
  }
};

// 마지막 메시지 시간 반환
const getLastMessageTime = async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!roomId) {
      return res.status(400).json({ message: "roomId가 필요합니다." });
    }

    const snapshot = await db
      .collection("chats")
      .doc(roomId)
      .collection("messages")
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(200).json({ lastMessageTime: null });
    }

    const lastMessage = snapshot.docs[0].data();

    let lastMessageTime = null;
    if (lastMessage.createdAt && typeof lastMessage.createdAt.toDate === "function") {
      lastMessageTime = lastMessage.createdAt.toDate();
    }

    return res.status(200).json({ lastMessageTime });
  } catch (err) {
    console.error("⛔ 마지막 메시지 시간 가져오기 실패:", err);
    return res.status(500).json({ message: "마지막 메시지 시간 불러오기 실패" });
  }
};

module.exports = {
  addMessageToChat,
  getChatMessages,
  getChatRooms,
  createOrGetAdminChatRoom,
  createNoticeRoom,
  addUserToChatRoom,         //  신규 유저 추가 + 입장 메시지
  getChatParticipants,       //  참가자 목록 조회
  getUserNameById,
  markMessageAsRead,
  getUnreadChatRooms,
  getUnreadStatus,
  getLastMessageTime,
};
