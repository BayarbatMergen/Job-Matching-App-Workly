import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import API_BASE_URL from "../config/apiConfig";

const ResetPasswordScreen = ({ route, navigation }) => {
  const uid = route?.params?.uid;
  const token = route?.params?.token;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [valid, setValid] = useState(true);

  // ⛔ 렌더링 도중 네비게이션 금지 → useEffect로 옮기기
  useEffect(() => {
    if (!uid || !token) {
      Alert.alert("잘못된 접근", "비밀번호 재설정 링크가 잘못되었습니다.");
      navigation.replace("Login");
      setValid(false);
    }
  }, [uid, token]);

  const handleSubmit = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert("오류", "비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, token, newPassword }),
      });

      const result = await res.json();

      if (!res.ok) {
        Alert.alert("오류", result.message || "비밀번호 재설정 실패");
        return;
      }

      Alert.alert("성공", result.message || "비밀번호가 재설정되었습니다.");
      navigation.replace("Login");
    } catch (err) {
      Alert.alert("오류", err.message || "서버 오류");
    }
  };

  // ❗잘못된 링크인 경우 렌더링 안함
  if (!valid) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>새 비밀번호 입력</Text>
      <TextInput
        placeholder="새 비밀번호"
        secureTextEntry
        style={styles.input}
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextInput
        placeholder="비밀번호 확인"
        secureTextEntry
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>비밀번호 재설정</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 22, marginBottom: 20, textAlign: "center" },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default ResetPasswordScreen;
