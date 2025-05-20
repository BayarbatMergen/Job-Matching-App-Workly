import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { resetPasswordWithBackend } from "../services/authService";

const ResetPasswordRequestScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert("입력 오류", "이메일을 입력하세요.");
      return;
    }

    setLoading(true);
    try {
      const { message } = await resetPasswordWithBackend(email);

      Alert.alert("재설정 안내", message, [
        {
          text: "확인",
          onPress: () => navigation.replace("Login"),
        },
      ]);
    } catch (error) {
      Alert.alert("오류", error.message || "서버 오류");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        <Image
          source={require("../../assets/images/thechingu.png")}
          style={styles.logo}
        />
        <Text style={styles.title}>비밀번호 재설정</Text>
        <TextInput
          style={styles.input}
          placeholder="이메일 입력"
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[styles.resetButton, loading && styles.disabledButton]}
          onPress={handleReset}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.resetButtonText}>재설정 링크 받기</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.backText}>← 로그인 화면으로 돌아가기</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", alignItems: "center", paddingHorizontal: 30 },
  innerContainer: { width: "100%", alignItems: "center", marginTop: 200 },
  logo: { width: 180, height: 180, marginBottom: 50 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#333" },
  input: {
    width: "100%", height: 50, borderWidth: 1, borderColor: "#ddd",
    borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, fontSize: 16,
  },
  resetButton: {
    backgroundColor: "#FF5733", width: "100%", height: 50,
    justifyContent: "center", alignItems: "center", borderRadius: 8, marginBottom: 15,
  },
  disabledButton: { backgroundColor: "#FFB199" },
  resetButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  backText: { fontSize: 14, color: "#007AFF", marginTop: 10 },
});

export default ResetPasswordRequestScreen;
