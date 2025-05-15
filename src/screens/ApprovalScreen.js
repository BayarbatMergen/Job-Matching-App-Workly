import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../config/firebase";
import axios from "axios";
import API_BASE_URL from "../config/apiConfig"; // ←  default export에 맞는 import 방식


export default function ApplicationApprovalScreen() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApplicationRequests = async () => {
    try {
      const snapshot = await getDocs(collection(db, "applications"));
      const pendingRequests = [];
  
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
  
        if (data.status === "pending") {
          let userName = data.userEmail;
  
          // userId로 사용자 이름 가져오기
          if (data.userId) {
            try {
              const userDoc = await getDocs(
                collection(db, "users")
              );
              const userInfo = userDoc.docs.find(u => u.id === data.userId)?.data();
              if (userInfo?.name) {
                userName = userInfo.name;
              }
            } catch (err) {
              console.warn(`사용자 이름 불러오기 실패: ${data.userId}`, err.message);
            }
          }
  
          pendingRequests.push({
            id: docSnap.id,
            ...data,
            userName,
          });
        }
      }
  
      setRequests(pendingRequests);
    } catch (error) {
      console.error("지원 요청 가져오기 오류:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchApplicationRequests();
  }, []);
const [isProcessing, setIsProcessing] = useState(false); 
  //  서버 API 호출로 승인 처리
const handleApprove = async (applicationId) => {
  if (isProcessing) return;
  setIsProcessing(true); // 🔒 버튼 잠금

  try {
    const res = await axios.post(`${API_BASE_URL}/application/applications/${applicationId}/approve`);
    console.log('🔥 요청 URL:', `${API_BASE_URL}/application/applications/${applicationId}/approve`);
    console.log("📦 승인 API 응답:", res.status, res.data);
    Alert.alert(" 승인 완료", res.data.message || "승인이 완료되었습니다.");

    fetchApplicationRequests();
  } catch (error) {
    console.error(" 승인 처리 오류:", {
      message: error.message,
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
      headers: error.config?.headers,
    });
    Alert.alert(" 승인 실패", error.response?.data?.message || "오류 발생");
  } finally {
    setIsProcessing(false); // 🔓 버튼 재활성화
  }
};


  const handleReject = async (id) => {
    try {
      await deleteDoc(doc(db, "applications", id));
      Alert.alert("거절 완료", "지원 요청이 거절되었습니다.");
      fetchApplicationRequests();
    } catch (error) {
      console.error(" 거절 오류:", error);
      Alert.alert("오류", "거절 처리 중 문제가 발생했습니다.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>지원 대기 목록 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>지원 승인 대기 목록</Text>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.userInfo}>지원자: {item.userName ?? item.userEmail ?? "N/A"}</Text>

            <Text>공고 제목: {item.jobTitle ?? "N/A"}</Text>
            <Text>상태: {item.status}</Text>
            <Text>
              지원일:{" "}
              {item.appliedAt?.seconds
                ? new Date(item.appliedAt.seconds * 1000).toLocaleString("ko-KR", {
                    timeZone: "Asia/Seoul",
                  })
                : "날짜 없음"}
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.approveButton}
                onPress={() => handleApprove(item.id)}
              >
                <Text style={styles.buttonText}>승인하기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => handleReject(item.id)}
              >
                <Text style={styles.buttonText}>거절하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 50 }}>
            대기 중인 요청이 없습니다.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  card: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 10,
  },
  userInfo: { fontWeight: "bold", marginBottom: 5, color: "#007AFF" },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  approveButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 8,
    flex: 0.48,
    alignItems: "center",
  },
  rejectButton: {
    backgroundColor: "#FF3B30",
    padding: 10,
    borderRadius: 8,
    flex: 0.48,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});
