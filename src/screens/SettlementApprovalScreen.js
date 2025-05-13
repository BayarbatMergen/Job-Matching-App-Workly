import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import API_BASE_URL from "../config/apiConfig";

export default function SettlementApprovalScreen() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const fetchSettlementRequests = async () => {
    try {
      const snapshot = await getDocs(collection(db, "settlements"));
      const pendingRequests = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (data.status === "pending") {
          const userDoc = await getDoc(doc(db, "users", data.userId));
          const userData = userDoc.exists() ? userDoc.data() : { name: "알 수 없음" };

          pendingRequests.push({
            id: docSnap.id,
            userId: data.userId,
            userName: userData.name,
            totalWage: data.totalWage,
            requestedAt: data.requestedAt,
          });
        }
      }

      setRequests(pendingRequests);
    } catch (error) {
      console.error(" 정산 요청 가져오기 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlementRequests();
  }, []);

  const handleApprove = async (settlementId, userId) => {
    try {
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        Alert.alert("인증 오류", "토큰이 없습니다. 다시 로그인 해주세요.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/schedules/approve-settlement`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ settlementId, userId }),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert("승인 완료", "정산 요청이 승인되었고, 스케줄 데이터가 삭제되었습니다.");
        fetchSettlementRequests();
      } else {
        Alert.alert("오류", result.message || "승인 처리 중 문제가 발생했습니다.");
      }
    } catch (error) {
      console.error(" 승인 처리 오류:", error);
      Alert.alert("오류", "승인 처리 중 문제가 발생했습니다.");
    }
  };

  const handleReject = async (id) => {
    try {
      await updateDoc(doc(db, "settlements", id), { status: "rejected" });
      Alert.alert("거절 완료", "정산 요청이 거절되었습니다.");
      fetchSettlementRequests();
    } catch (error) {
      console.error(" 거절 처리 오류:", error);
      Alert.alert("오류", "거절 처리 중 문제가 발생했습니다.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>승인 대기 목록 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={styles.container}>
        <Text style={styles.header}>정산 승인 요청 목록</Text>

        {requests.length === 0 ? (
          <Text style={{ textAlign: "center", marginTop: 40 }}>대기 중인 요청이 없습니다.</Text>
        ) : (
          requests.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.userName}>{item.userName}</Text>
              <Text>요청 금액: {Number(item.totalWage).toLocaleString()}원</Text>
              <Text>
  요청 날짜: {new Date(item.requestedAt.seconds * 1000).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul", // 한국 시간대로 설정
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })}
</Text>

<View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={() => handleApprove(item.id, item.userId)}
                >
                  <Text style={styles.buttonText}>승인</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => handleReject(item.id)}
                >
                  <Text style={styles.buttonText}>거절</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
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
  headerBar: {
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
});
