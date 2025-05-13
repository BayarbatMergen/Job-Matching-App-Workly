import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { API_BASE_URL } from "../config/apiConfig";

export default function AdminJobDetailScreen({ route, navigation }) {
  const { job, updateJob } = route.params;

  const initialJob = {
    ...job,
    workDays: Array.isArray(job.workDays)
      ? job.workDays.join(', ')
      : job.workDays || '',
  };

  const [editedJob, setEditedJob] = useState(initialJob);
  const [visibleUserNames, setVisibleUserNames] = useState([]);

  useEffect(() => {
    const fetchUserNames = async () => {
      if (editedJob.visibleTo && Array.isArray(editedJob.visibleTo)) {
        try {
          const names = [];
          for (const uid of editedJob.visibleTo) {
            const response = await fetch(`${API_BASE_URL}/users/${uid}`);
            const data = await response.json();
            if (data && data.name) {
              names.push(data.name);
            } else {
              names.push('(이름 없음)');
            }
          }
          setVisibleUserNames(names);
        } catch (error) {
          console.error('사용자 이름 불러오기 실패:', error);
        }
      }
    };

    fetchUserNames();
  }, [editedJob.visibleTo]);

  const handleChange = (field, value) => {
    setEditedJob((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumberInput = (field, value) => {
    if (/^\d*$/.test(value)) {
      setEditedJob((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = () => {
    for (let key in editedJob) {
      if (editedJob[key] === '') {
        Alert.alert('입력 오류', '모든 항목을 입력해주세요.');
        return;
      }
    }

    const updatedJob = {
      ...editedJob,
      workDays: editedJob.workDays
        .split(',')
        .map((day) => day.trim()),
    };

    updateJob(updatedJob);
    Alert.alert('수정 완료', '공고가 성공적으로 수정되었습니다.');
    navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.detailTitle}>공고 수정</Text>

        <Text style={styles.label}>공고 제목</Text>
        <TextInput style={styles.input} value={editedJob.title} onChangeText={(text) => handleChange('title', text)} />

        <Text style={styles.label}>급여</Text>
        <TextInput
          style={styles.input}
          value={editedJob.wage}
          keyboardType="numeric"
          onChangeText={(text) => handleNumberInput('wage', text)}
          placeholder="숫자만 입력 가능"
        />

        <Text style={styles.label}>근무 시작일</Text>
        <TextInput
          style={styles.input}
          value={editedJob.startDate}
          onChangeText={(text) => handleChange('startDate', text)}
          placeholder="YYYY-MM-DD"
        />

        <Text style={styles.label}>근무 종료일</Text>
        <TextInput
          style={styles.input}
          value={editedJob.endDate}
          onChangeText={(text) => handleChange('endDate', text)}
          placeholder="YYYY-MM-DD"
        />

        <Text style={styles.label}>근무 요일</Text>
        <TextInput
          style={styles.input}
          value={editedJob.workDays}
          onChangeText={(text) => handleChange('workDays', text)}
          placeholder="예: 월, 화, 금"
        />

        <Text style={styles.label}>근무 시간</Text>
        <TextInput style={styles.input} value={editedJob.workHours} onChangeText={(text) => handleChange('workHours', text)} />

        <Text style={styles.label}>숙식 제공 여부</Text>
        <TouchableOpacity
          style={[styles.toggleButton, { backgroundColor: editedJob.accommodation ? '#4CAF50' : '#FF3B30' }]}
          onPress={() => handleChange('accommodation', !editedJob.accommodation)}
        >
          <Text style={styles.toggleText}>{editedJob.accommodation ? '숙식 제공 O' : '숙식 제공 X'}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>모집 인원</Text>
        <View style={styles.recruitmentContainer}>
          <View style={styles.recruitmentBox}>
            <Text style={styles.recruitmentLabel}>남성</Text>
            <TextInput
              style={styles.input}
              value={editedJob.maleRecruitment}
              keyboardType="numeric"
              onChangeText={(text) => handleNumberInput('maleRecruitment', text)}
            />
          </View>
          <View style={styles.recruitmentBox}>
            <Text style={styles.recruitmentLabel}>여성</Text>
            <TextInput
              style={styles.input}
              value={editedJob.femaleRecruitment}
              keyboardType="numeric"
              onChangeText={(text) => handleNumberInput('femaleRecruitment', text)}
            />
          </View>
        </View>

        <Text style={styles.label}>근무 지역</Text>
        <TextInput style={styles.input} value={editedJob.location} onChangeText={(text) => handleChange('location', text)} />

        <Text style={styles.label}>상세 요강</Text>
        <TextInput
          style={styles.textArea}
          value={editedJob.description}
          onChangeText={(text) => handleChange('description', text)}
          multiline
        />

        {editedJob.visibleTo && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.label}>공개 대상자</Text>
            {editedJob.visibleTo === 'all' ? (
              <Text style={{ color: 'green', marginTop: 5 }}>모든 사용자에게 공개됨</Text>
            ) : visibleUserNames.length > 0 ? (
              visibleUserNames.map((name, idx) => (
                <Text key={idx} style={{ color: '#555', marginTop: 3 }}>- {name}</Text>
              ))
            ) : (
              <Text style={{ color: '#888', marginTop: 5 }}>공개 대상자가 설정되지 않았습니다.</Text>
            )}
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>취소</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>저장</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, paddingVertical: 20 },
  container: { flex: 1, padding: 25, backgroundColor: '#fff' },
  detailTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#222' },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginTop: 5 },
  recruitmentContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  recruitmentBox: { flex: 1, marginHorizontal: 5 },
  recruitmentLabel: { fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
  textArea: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginTop: 5, height: 80 },
  toggleButton: { padding: 10, borderWidth: 1, borderRadius: 8, marginTop: 5, alignItems: 'center' },
  toggleText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  cancelButton: { flex: 1, backgroundColor: '#ccc', padding: 12, borderRadius: 8, alignItems: 'center', marginRight: 10 },
  cancelButtonText: { color: '#333', fontSize: 16, fontWeight: 'bold' },
  saveButton: { flex: 1, backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});