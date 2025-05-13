import * as SecureStore from "expo-secure-store";
import API_BASE_URL from "../config/apiConfig";
import { fetchUserData } from "./authService";

export const fetchUserSchedules = async () => {
  try {
    

    const token = await SecureStore.getItemAsync("token");
    let userId = await SecureStore.getItemAsync("userId");

    if (!userId) {
      console.warn(" userId 없음 → fetchUserData() 호출하여 저장 시도...");
      userId = await fetchUserData();
      if (userId) {
        await SecureStore.setItemAsync("userId", userId);
      }
    }

    if (!token || !userId) {
      console.warn(" 토큰 또는 userId 없음 → 일정 요청 중단");
      return [];
    }

    const requestUrl = `${API_BASE_URL}/schedules/user/${userId}`;
    

    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 404) {
      console.warn(" 가져올 일정이 없습니다.");
      return [];
    }

    if (!response.ok) {
      throw new Error(` API 요청 실패: ${response.status}`);
    }

    const schedules = await response.json();
    
    return schedules;
  } catch (error) {
    console.error(" [fetchUserSchedules] 일정 불러오기 오류:", error.message);
    return [];
  }
};
