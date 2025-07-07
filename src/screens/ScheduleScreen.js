import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import * as SecureStore from 'expo-secure-store';
import { fetchUserData } from '../services/authService';
import { fetchUserSchedules } from '../services/scheduleService';
import { collection, getDocs } from 'firebase/firestore';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from '../config/firebase';
import API_BASE_URL from '../config/apiConfig';

LocaleConfig.locales['kr'] = {
  monthNames: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
  monthNamesShort: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
  dayNames: ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'],
  dayNamesShort: ['일','월','화','수','목','금','토'],
  today: '오늘'
};
LocaleConfig.defaultLocale = 'kr';

export default function ScheduleScreen({ navigation }) {
  const [scheduleData, setScheduleData] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSchedules, setSelectedSchedules] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [totalWage, setTotalWage] = useState(0);
  const [allTotalWage, setAllTotalWage] = useState(0);
  const [userId, setUserId] = useState(null);
    const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasPendingSettlement, setHasPendingSettlement] = useState(false);
  const isWithinCheckinTime = () => {
  const now = new Date();
  const hours = now.getHours();

  return hours >= 8 && hours < 10;
};

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const token = await SecureStore.getItemAsync("token");
        if (!token) {
          Alert.alert("로그인 필요", "로그인이 필요합니다.");
          navigation.replace("Login");
          return;
        }
        const user = await fetchUserData();
        setUserId(user?.userId);
        setUserName(user?.name);
      } catch (error) {
        Alert.alert("오류", "인증이 필요합니다.", [
          { text: "확인", onPress: () => navigation.navigate("Login") },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, [navigation]);

  useEffect(() => {
    if (userId) {
      fetchSchedules(userId);
      checkPendingSettlement(userId);
    }
  }, [userId]);

  useEffect(() => {
  // 앱 들어가면 자동으로 오늘 날짜 선택
  const todayStr = new Date().toISOString().split("T")[0];
  setSelectedDate(todayStr);
  if (scheduleData[todayStr]) {
    setSelectedSchedules(scheduleData[todayStr]);
    const total = scheduleData[todayStr].reduce((sum, s) => sum + (Number(s.wage) || 0), 0);
    setTotalWage(total);
  } else {
    setSelectedSchedules([]);
    setTotalWage(0);
  }
}, [scheduleData]);

  const checkPendingSettlement = async (uid) => {
    try {
      const snapshot = await getDocs(collection(db, "settlements"));
      const pending = snapshot.docs.find(doc => doc.data().userId === uid && doc.data().status === "pending");
      setHasPendingSettlement(!!pending);
    } catch (error) {
      console.error("정산 대기 상태 확인 오류:", error);
    }
  };

  const fetchSchedules = async (uid) => {
    try {
      const schedulesArray = await fetchUserSchedules(uid);
      const formattedSchedules = {};
      let totalWageSum = 0;

      schedulesArray.forEach((schedule) => {
        const start = new Date(schedule.startDate);
        const end = new Date(schedule.endDate);

        const diffDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
        const dailyWage = Number(schedule.wage);

        for (let i = 0; i < diffDays; i++) {
          const date = new Date(start);
          date.setDate(start.getDate() + i);
          const dateStr = date.toISOString().split("T")[0];

          if (!formattedSchedules[dateStr]) {
            formattedSchedules[dateStr] = [];
          }

          formattedSchedules[dateStr].push({
            name: schedule.name || schedule.title || "제목 없음",
            wage: dailyWage,
            date: dateStr,
          });
        }

        totalWageSum += dailyWage * diffDays;
      });

      setScheduleData(formattedSchedules);
      setAllTotalWage(totalWageSum);

      const marks = {};
      Object.keys(formattedSchedules).forEach((date) => {
        marks[date] = {
          customStyles: {
            container: { backgroundColor: "#4CAF50", borderRadius: 5 },
            text: { color: "#fff", fontWeight: "bold" },
          },
        };
      });

      setMarkedDates(marks);
    } catch (error) {
      console.error("일정 데이터 로딩 오류:", error);
    }
  };

  const handleDayPress = (day) => {
    const selected = day.dateString;
    setSelectedDate(selected);
    const filteredSchedules = scheduleData[selected] || [];
    setSelectedSchedules(filteredSchedules);
    const total = filteredSchedules.reduce((sum, s) => sum + (Number(s.wage) || 0), 0);
    setTotalWage(total);
  };

  const handleSettlementRequest = async () => {
    if (allTotalWage === 0) {
      Alert.alert("정산 요청 실패", "정산할 일정이 없습니다.");
      return;
    }

    try {
      const token = await SecureStore.getItemAsync("token");
      const response = await fetch(`${API_BASE_URL}/schedules/request-settlement`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ totalWage: allTotalWage }),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert("정산 요청 완료", `총 급여 ${allTotalWage.toLocaleString()}원 요청 완료.`);
        setHasPendingSettlement(true);
      } else {
        Alert.alert("정산 요청 실패", result.message || "서버 오류");
      }
    } catch (error) {
      Alert.alert("정산 요청 실패", "서버 오류 발생");
    }
  };

const handleCheckIn = async () => {
  if (selectedSchedules.length === 0) {
    Alert.alert("출근 불가", "오늘은 근무 일정이 없습니다.");
    return;
  }
  if (!isWithinCheckinTime()) {
    Alert.alert("출근 시간 아님", "출근 가능한 시간은 7:00 ~ 14:00 입니다.");
    return;
  }

  try {
    const docRef = doc(db, "attendance", `${selectedDate}_${userId}`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      Alert.alert("출근 실패", "오늘 이미 출근하셨습니다.");
      return;
    }

    // 여기서 Alert 없이 Contract 화면으로 이동
    navigation.navigate("Contract", {
      userId,
      selectedDate,
      schedules: selectedSchedules,
      name: userName
    });

  } catch (error) {
    console.error("출근 오류:", error);
    Alert.alert("출근 실패", "출근 처리 중 오류가 발생했습니다.");
  }
};


  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (userId) {
      await fetchSchedules(userId);
      await checkPendingSettlement(userId);
    }
    setRefreshing(false);
  }, [userId]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.container}>
        <Calendar
          monthFormat={'yyyy . MM'}
          onDayPress={handleDayPress}
          markingType={'custom'}
          markedDates={markedDates}
          theme={{
            todayTextColor: '#FF5733',
            arrowColor: '#007AFF',
            textDayFontSize: 20,
            textMonthFontSize: 22,
            textDayHeaderFontSize: 16,
          }}
          style={styles.calendar}
        />

        <View style={styles.selectedScheduleContainer}>
          <Text style={styles.selectedDateText}>{selectedDate || '날짜를 선택하세요'}</Text>
          {selectedSchedules.length > 0 ? (
            selectedSchedules.map((s, i) => (
              <View key={i} style={styles.scheduleDetail}>
                <Text style={styles.scheduleDetailText}>일정: {s.name}</Text>
                <Text>급여: {Number(s.wage).toLocaleString()}원</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noScheduleText}>해당 날짜에 일정이 없습니다.</Text>
          )}
        </View>

        <View style={styles.allTotalWageContainer}>
          <Text style={styles.allTotalWageText}>총 급여 합산: {allTotalWage.toLocaleString()}원</Text>
        </View>
{selectedSchedules.length > 0 && (
<TouchableOpacity
  style={[
    styles.attendanceButton,
    !isWithinCheckinTime() && { backgroundColor: '#ccc' }
  ]}
  onPress={handleCheckIn}
  disabled={!isWithinCheckinTime()}
>
  <Text style={styles.attendanceButtonText}>
    {isWithinCheckinTime() ? "출근" : "출근 시간 아님"}
  </Text>
</TouchableOpacity>


)}
        <TouchableOpacity
          style={[
            styles.settlementButton,
            hasPendingSettlement && { backgroundColor: '#aaa' }
          ]}
          onPress={handleSettlementRequest}
          disabled={hasPendingSettlement}
        >
          <Text style={styles.settlementButtonText}>
            {hasPendingSettlement ? "승인 대기 중" : "정산 요청"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flex: 1 },
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  calendar: { borderRadius: 10, backgroundColor: '#F8F8F8', paddingBottom: 10, elevation: 3 },
  selectedScheduleContainer: { marginTop: 20, padding: 20, backgroundColor: '#F9F9F9', borderRadius: 10, marginHorizontal: 20, borderWidth: 1, borderColor: '#DDDDDD' },
  selectedDateText: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  scheduleDetail: { backgroundColor: '#FFFFFF', padding: 15, marginBottom: 8, borderRadius: 10, borderWidth: 1, borderColor: '#007AFF' },
  scheduleDetailText: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
  noScheduleText: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', color: '#AAA' },
  allTotalWageContainer: { marginTop: 10, padding: 12, backgroundColor: '#FFD700', borderRadius: 10, marginHorizontal: 20, alignItems: 'center' },
  allTotalWageText: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  settlementButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center', marginVertical: 20, marginHorizontal: 20 },
  settlementButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  attendanceButton: {
  backgroundColor: '#4CAF50',
  padding: 15,
  borderRadius: 8,
  alignItems: 'center',
  marginVertical: 10,
  marginHorizontal: 20
},
attendanceButtonText: {
  color: 'white',
  fontSize: 18,
  fontWeight: 'bold'
}

});
