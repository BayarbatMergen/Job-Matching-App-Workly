const express = require("express");
const router = express.Router();
const {
  addMessageToChat,
  getChatMessages,
  getChatRooms,
  createOrGetAdminChatRoom,
  createNoticeRoom,
  addUserToChatRoom,
  getChatParticipants,
  getUserNameById,
  markMessageAsRead,
  getUnreadChatRooms,
  getUnreadStatus,
  getLastMessageTime
} = require("../controllers/chatController");
const { verifyToken } = require("../middlewares/authMiddleware");

//  채팅방 목록 가져오기
router.get("/rooms", verifyToken, getChatRooms);

//  특정 채팅방의 모든 메시지 가져오기
router.get("/rooms/:roomId/messages", verifyToken, getChatMessages);

//  특정 채팅방에 메시지 추가
router.post("/rooms/:roomId/messages", verifyToken, addMessageToChat);

//  관리자 채팅방 생성 또는 반환
router.post("/admin-room", verifyToken, createOrGetAdminChatRoom);

//  공지방 생성 (옵션)
router.post("/notice-room", verifyToken, createNoticeRoom);

//  채팅방에 유저 추가 + 입장 메시지 자동 생성
router.post("/rooms/:roomId/add-user", verifyToken, addUserToChatRoom);

//  채팅방 참가자 목록 조회
router.get("/rooms/:roomId/participants", verifyToken, getChatParticipants);

//  사용자 이름 조회
router.get("/users/:uid", verifyToken, getUserNameById);

router.post('/rooms/:roomId/messages/:messageId/read', markMessageAsRead);

router.get("/unread-status", verifyToken, getUnreadStatus);

// 마지막 메시지 시간 조회 (토큰 필요)
router.get("/:roomId/last-message-time", getLastMessageTime);



module.exports = router;

