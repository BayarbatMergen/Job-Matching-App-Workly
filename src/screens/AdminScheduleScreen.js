import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { collection, getDocs, query  } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigation } from '@react-navigation/native';

// 📆 한국어 캘린더 설정
LocaleConfig.locales['kr'] = {
  monthNames: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
  monthNamesShort: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
  dayNames: ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'],
  dayNamesShort: ['일','월','화','수','목','금','토'],
  today: '오늘',
};
LocaleConfig.defaultLocale = 'kr';

export default function AdminScheduleScreen() {
  const navigation = useNavigation();
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSchedules, setSelectedSchedules] = useState([]);
  const [allAttendanceList, setAllAttendanceList] = useState([]);
  const [selectedAttendanceList, setSelectedAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allSchedules, setAllSchedules] = useState([]);

  const fetchJobs = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'jobs'));
      const jobs = querySnapshot.docs.map(doc => doc.data());

      const marks = {};
      const scheduleMap = {};

      jobs.forEach(job => {
        if (job.startDate && job.endDate) {
          const start =
            typeof job.startDate.toDate === 'function'
              ? job.startDate.toDate()
              : new Date(job.startDate);

          const end =
            typeof job.endDate.toDate === 'function'
              ? job.endDate.toDate()
              : new Date(job.endDate);

          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateString = d.toISOString().split('T')[0];
            marks[dateString] = {
              customStyles: {
                container: { backgroundColor: '#4CAF50', borderRadius: 5 },
                text: { color: '#fff', fontWeight: 'bold' }
              }
            };

            if (!scheduleMap[dateString]) {
              scheduleMap[dateString] = [];
            }
            scheduleMap[dateString].push({
              title: job.title,
              wage: job.wage,
              location: job.location,
            });
          }
        }
      });

      setAllSchedules(scheduleMap);
      setMarkedDates(marks);
    } catch (error) {
      console.error('스케줄 불러오기 오류:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

useEffect(() => {
  const init = async () => {
    setLoading(true);
    await fetchJobs();
    await fetchAttendance();
    setLoading(false);
  };
  init();
}, []);

const onRefresh = useCallback(() => {
  setRefreshing(true);
  Promise.all([fetchJobs(), fetchAttendance()])
    .then(() => setRefreshing(false))
    .catch(() => setRefreshing(false));
}, []);


const fetchAttendance = async () => {
  try {
    const q = query(collection(db, "attendance"));
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    list.sort((a, b) => new Date(b.date) - new Date(a.date));
    setAllAttendanceList(list);
  } catch (err) {
    console.error("출근 현황 불러오기 오류:", err);
  }
};

const handleDayPress = (day) => {
  const selected = day.dateString;
  setSelectedDate(selected);
  setSelectedSchedules(allSchedules[selected] || []);
};


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>일정 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007AFF']} />
      }
    >
      <View style={styles.container}>
        <Calendar
          monthFormat={'yyyy MM'}
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
          <Text style={styles.selectedDateText}>
            {selectedDate ? `${selectedDate} 일정` : '날짜를 선택하세요'}
          </Text>
          <ScrollView style={styles.scheduleList}>
            {selectedSchedules.length > 0 ? (
              selectedSchedules.map((schedule, index) => (
                <View key={index} style={styles.scheduleDetail}>
                  <Text style={styles.scheduleDetailText}>{schedule.title}</Text>
                  <Text>급여: {Number(schedule.wage).toLocaleString()}원</Text>
                  <Text>위치: {schedule.location}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noScheduleText}>해당 날짜에 일정이 없습니다.</Text>
            )}
          </ScrollView>
        </View>


        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('ApprovedApplicationsScreen')}
        >
          <Text style={styles.buttonText}>공고 승인 내역 보기</Text>
        </TouchableOpacity>
<TouchableOpacity
  style={styles.button}
  onPress={() => navigation.navigate('AttendanceStatusScreen', { date: selectedDate })}
  disabled={!selectedDate}
>
  <Text style={styles.buttonText}>
    {selectedDate ? `${selectedDate} 출근 현황 보기` : '날짜를 선택하세요'}
  </Text>
</TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flex: 1 },
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 20 },
  calendar: { borderRadius: 10, backgroundColor: '#F8F8F8', paddingBottom: 10, elevation: 3 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  selectedScheduleContainer: {
    flex: 1,
    marginTop: 20,
    padding: 20,
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    elevation: 5,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: 10,
    color: '#333',
  },
  scheduleList: { flex: 1 },
  scheduleDetail: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
    elevation: 3,
  },
  scheduleDetailText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  noScheduleText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#AAA',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 20,
    marginHorizontal: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
