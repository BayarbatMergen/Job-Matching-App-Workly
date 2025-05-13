import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import axios from "axios";
import API_BASE_URL from "../config/apiConfig";
import userSelectionStore from "../store/userSelectionStore";
import RNPickerSelect from "react-native-picker-select";

export default function AdminJobFormScreen({ navigation }) {
  const [form, setForm] = useState({
    title: "",
    wage: "",
    startDate: "",
    endDate: "",
    workDays: "",
    workHours: "",
    industry: "",
    employmentType: "",
    accommodation: false,
    maleRecruitment: "",
    femaleRecruitment: "",
    location: "",
    description: "",
  });

  const [sendToAll, setSendToAll] = useState(false);

  const handleNumberInput = (key, value) => {
    if (/^\d*$/.test(value)) {
      setForm((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleSubmit = async () => {
    for (let key in form) {
      if (form[key] === "" && key !== "description") {
        Alert.alert("입력 오류", "모든 항목을 입력해주세요.");
        return;
      }
    }

    try {
      const jobData = {
        ...form,
        wage: Number(form.wage),
        maleRecruitment: Number(form.maleRecruitment || 0),
        femaleRecruitment: Number(form.femaleRecruitment || 0),
        workDays: form.workDays
          .split(",")
          .map((day) => day.trim())
          .filter((day) => day !== ""),
        notifyUsers: sendToAll ? "all" : userSelectionStore.selectedUsers,
      };

      const response = await axios.post(`${API_BASE_URL}/jobs/add`, jobData);
      Alert.alert("등록 완료", "공고가 성공적으로 등록되었습니다.");
      userSelectionStore.clearSelectedUsers();
      navigation.goBack();
    } catch (error) {
      console.error("공고 등록 API 오류:", error);
      Alert.alert("등록 실패", "공고 등록 중 오류가 발생했습니다.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.header}>공고 등록</Text>

        <Text style={styles.label}>공고 제목</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={(text) => setForm({ ...form, title: text })}
          placeholder="공고 제목 입력"
        />

        <Text style={styles.label}>급여 (숫자만)</Text>
        <TextInput
          style={styles.input}
          value={form.wage}
          keyboardType="numeric"
          onChangeText={(text) => handleNumberInput("wage", text)}
          placeholder="100000"
        />

        <Text style={styles.label}>근무 시작일 (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={form.startDate}
          onChangeText={(text) => setForm({ ...form, startDate: text })}
        />

        <Text style={styles.label}>근무 종료일 (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={form.endDate}
          onChangeText={(text) => setForm({ ...form, endDate: text })}
        />

        <Text style={styles.label}>근무 요일 (쉼표로 구분)</Text>
        <TextInput
          style={styles.input}
          value={form.workDays}
          onChangeText={(text) => setForm({ ...form, workDays: text })}
          placeholder="예: 월, 화, 금"
        />

        <Text style={styles.label}>근무 시간</Text>
        <TextInput
          style={styles.input}
          value={form.workHours}
          onChangeText={(text) => setForm({ ...form, workHours: text })}
          placeholder="예: 09:00 ~ 18:00"
        />

<Text style={styles.label}>업종</Text>
<View style={styles.pickerWrapper}>
  <RNPickerSelect
    onValueChange={(value) => setForm({ ...form, industry: value })}
    value={form.industry}
    placeholder={{ label: "선택하세요", value: "" }}
    items={[
      { label: "요식업", value: "요식업" },
      { label: "서비스업", value: "서비스업" },
      { label: "물류/창고", value: "물류/창고" },
      { label: "정비", value: "정비" },
      { label: "기타", value: "기타" },
    ]}
    style={pickerSelectStyles}
    useNativeAndroidPickerStyle={false}
    Icon={() => (
      <View
        style={{
          backgroundColor: "transparent",
          borderTopWidth: 8,
          borderTopColor: "#000",
          borderRightWidth: 6,
          borderRightColor: "transparent",
          borderLeftWidth: 6,
          borderLeftColor: "transparent",
          width: 0,
          height: 0,
          position: "absolute",
          right: 15,
          top: 20,
        }}
      />
    )}
  />
</View>

 
<Text style={styles.label}>고용 형태</Text>
<View style={styles.pickerWrapper}>
  <RNPickerSelect
    onValueChange={(value) => setForm({ ...form, employmentType: value })}
    value={form.employmentType}
    placeholder={{ label: "선택하세요", value: "" }}
    items={[
      { label: "정규직", value: "정규직" },
      { label: "계약직", value: "계약직" },
      { label: "장기", value: "장기" },
      { label: "아르바이트", value: "아르바이트" },
    ]}
    style={pickerSelectStyles}
    useNativeAndroidPickerStyle={false}
    Icon={() => (
      <View
        style={{
          backgroundColor: "transparent",
          borderTopWidth: 8,
          borderTopColor: "#000",
          borderRightWidth: 6,
          borderRightColor: "transparent",
          borderLeftWidth: 6,
          borderLeftColor: "transparent",
          width: 0,
          height: 0,
          position: "absolute",
          right: 15,
          top: 20,
        }}
      />
    )}
  />
</View>


        <Text style={styles.label}>숙식 제공 여부</Text>
        <TouchableOpacity
          style={[styles.toggleButton, { backgroundColor: form.accommodation ? "#4CAF50" : "#FF3B30" }]}
          onPress={() => setForm({ ...form, accommodation: !form.accommodation })}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>
            {form.accommodation ? "숙식 제공 O" : "숙식 제공 X"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>모집 인원</Text>
        <View style={styles.recruitmentContainer}>
          <View style={styles.recruitmentBox}>
            <Text>남성</Text>
            <TextInput
              style={styles.input}
              value={form.maleRecruitment}
              keyboardType="numeric"
              onChangeText={(text) => handleNumberInput("maleRecruitment", text)}
            />
          </View>
          <View style={styles.recruitmentBox}>
            <Text>여성</Text>
            <TextInput
              style={styles.input}
              value={form.femaleRecruitment}
              keyboardType="numeric"
              onChangeText={(text) => handleNumberInput("femaleRecruitment", text)}
            />
          </View>
        </View>

        <Text style={styles.label}>근무 위치</Text>
        <TextInput
          style={styles.input}
          value={form.location}
          onChangeText={(text) => setForm({ ...form, location: text })}
          placeholder="근무지 입력"
        />

        <Text style={styles.label}>상세 설명</Text>
        <TextInput
          style={styles.textArea}
          value={form.description}
          onChangeText={(text) => setForm({ ...form, description: text })}
          multiline
          placeholder="업무 내용 및 추가 사항"
        />

        <View style={styles.alertTypeContainer}>
          <TouchableOpacity
            style={[styles.alertTypeButton, sendToAll && { backgroundColor: "#4CAF50" }]}
            onPress={() => setSendToAll(true)}
          >
            <Text style={styles.alertTypeButtonText}>모든 사용자에게 알림</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.alertTypeButton, !sendToAll && { backgroundColor: "#4CAF50" }]}
            onPress={() => {
              setSendToAll(false);
              navigation.navigate("UserSelectionScreen");
            }}
          >
            <Text style={styles.alertTypeButtonText}>특정 사용자 선택</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>공고 등록</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    color: "black",
    paddingRight: 30,
    marginTop: 5,
    width: '100%', // 추가
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    color: "black",
    paddingRight: 30,
    marginTop: 5,
    width: '100%', // 추가
  },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },
  label: { fontSize: 16, fontWeight: "bold", marginTop: 15 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
  },
  toggleButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  recruitmentContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  recruitmentBox: { flex: 1, marginHorizontal: 5 },
  textArea: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
    height: 100,
  },
  alertTypeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
  },
  alertTypeButton: {
    flex: 0.48,
    backgroundColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  alertTypeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
  pickerWrapper: {
    position: "relative",
    zIndex: 10,
  },
  
});