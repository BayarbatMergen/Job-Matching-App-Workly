// 📁 src/utils/notificationService.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Alert } from 'react-native';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { db } from "../config/firebase";

/**
 * ✅ 사용자 기기로부터 Expo Push Token을 받아 Firestore에 저장
 */
export const registerForPushNotificationsAsync = async (userId) => {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('알림 권한이 필요합니다!');
      return;
    }

    // ✅ Expo Push Token 가져오기
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig.extra.eas.projectId,
    })).data;

    

    // ✅ Firestore의 사용자 문서에 토큰 저장
    await setDoc(doc(db, "users", userId), {
      expoPushToken: token,
    }, { merge: true });

  } else {
    alert('기기에서만 푸시 알림이 가능합니다');
  }

  return token;
};

/**
 * ✅ Firestore에 사용자 승인 알림 생성 (앱 내 알림 용도)
 */
export const sendUserApplicationApprovalNotification = async (userEmail, jobTitle) => {
  try {
    

    await addDoc(collection(db, "notifications"), {
      recipientEmail: userEmail,
      message: `당신이 지원한 '${jobTitle}' 공고가 승인되었습니다.`,
      status: "unread",
      createdAt: new Date(),
    });

    
  } catch (error) {
    console.error("❌ 알림 전송 오류:", error);
  }
};

/**
 * ✅ 에뮬레이터 테스트용 Alert 알림 (실제 푸시 대체)
 */
export const sendTestNotification = async (title, body) => {
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
    },
    trigger: null,
  });
};

