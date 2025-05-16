import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchUserData, saveUserData, resetPasswordWithBackend } from "../services/authService";
import API_BASE_URL from "../config/apiConfig";
import Checkbox from 'expo-checkbox';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [isResetMode, setIsResetMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [autoLoginChecked, setAutoLoginChecked] = useState(false);

useEffect(() => {
  const tryAutoLogin = async () => {
    try {
      const shouldAutoLogin = await AsyncStorage.getItem("autoLogin");

      if (shouldAutoLogin === "true") {
        setAutoLoginChecked(true); // ✅ 체크박스도 체크 상태로
        const storedEmail = await AsyncStorage.getItem("email");
        const storedPassword = await AsyncStorage.getItem("password");

        if (storedEmail && storedPassword) {
          setEmail(storedEmail);
          setPassword(storedPassword);
          handleLogin(storedEmail, storedPassword, true);
        }
      }
    } catch (error) {
      console.error("자동 로그인 시도 중 오류:", error);
    }
  };

  tryAutoLogin();
}, []);

  const handleLogin = async (overrideEmail, overridePassword, autoTrigger = false) => {
    const loginEmail = overrideEmail || email;
    const loginPassword = overridePassword || password;

    if (!loginEmail || !loginPassword) {
      Alert.alert("입력 오류", "이메일과 비밀번호를 입력하세요.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error("서버 응답이 JSON 형식이 아닙니다.");
      }

      if (response.ok) {
        await saveUserData(
          result.token,
          result.user.userId,
          result.user.email,
          loginPassword,
          result.user.role,
          result.user.name
        );

        if (autoLoginChecked) {
          await AsyncStorage.setItem("autoLogin", "true");
          await AsyncStorage.setItem("email", loginEmail);
          await AsyncStorage.setItem("password", loginPassword);
        } else {
          await AsyncStorage.removeItem("autoLogin");
        }

        await fetchUserData();

        if (result.user.role === "admin") {
          navigation.replace("AdminMain");
        } else {
          navigation.replace("Main");
        }
      } else {
        if (!autoTrigger) Alert.alert("로그인 실패", result.message || "이메일 또는 비밀번호 오류");
      }
    } catch (err) {
      console.error("로그인 중 오류:", err);
      Alert.alert("서버 오류", err.message || "잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      Alert.alert("입력 오류", "이메일을 입력하세요.");
      return;
    }

    setLoading(true);
    try {
      const message = await resetPasswordWithBackend(resetEmail);
      Alert.alert("비밀번호 재설정", message);
      setIsResetMode(false);
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
        <Image source={require("../../assets/images/thechingu.png")} style={styles.logo} />

        {!isResetMode ? (
          <>
            <Text style={styles.title}>로그인</Text>
            <TextInput
              style={styles.input}
              placeholder="이메일"
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="비밀번호"
              placeholderTextColor="#aaa"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

<View style={styles.checkboxContainer}>
  <Checkbox
    value={autoLoginChecked}
    onValueChange={setAutoLoginChecked}
    color={autoLoginChecked ? '#007AFF' : undefined}
  />
  <Text style={styles.checkboxLabel}>자동 로그인</Text>
</View>


            <TouchableOpacity
              style={[styles.loginButton, loading && styles.disabledButton]}
              onPress={() => handleLogin()}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>로그인</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footerContainer}>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.registerText}>회원가입</Text>
              </TouchableOpacity>
              <Text style={styles.separator}> | </Text>
              <TouchableOpacity onPress={() => setIsResetMode(true)}>
                <Text style={styles.forgotPasswordText}>비밀번호 찾기</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.title}>비밀번호 찾기</Text>
            <TextInput
              style={styles.input}
              placeholder="이메일 입력"
              placeholderTextColor="#aaa"
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType="email-address"
            />
            <TouchableOpacity
              style={[styles.resetButton, loading && styles.disabledButton]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.resetButtonText}>비밀번호 재설정 요청</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsResetMode(false)}>
              <Text style={styles.backToLoginText}>로그인으로 돌아가기</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", alignItems: "center", paddingHorizontal: 30 },
  innerContainer: { width: "100%", alignItems: "center", marginTop: 200 },
  logo: { width: 180, height: 180, marginBottom: 10 },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 20, color: "#333" },
  input: {
    width: "100%", height: 50, borderWidth: 1, borderColor: "#ddd",
    borderRadius: 8, paddingHorizontal: 15, marginBottom: 12, fontSize: 16,
  },
  loginButton: {
    backgroundColor: "#007AFF", width: "100%", height: 50,
    justifyContent: "center", alignItems: "center", borderRadius: 8, marginTop: 10,
  },
  disabledButton: { backgroundColor: "#A0C4FF" },
  loginButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  footerContainer: { flexDirection: "row", marginTop: 15 },
  registerText: { color: "#007AFF", fontSize: 16, fontWeight: "500" },
  forgotPasswordText: { color: "#FF5733", fontSize: 16, fontWeight: "500" },
  separator: { fontSize: 16, color: "#333", marginHorizontal: 10 },
  resetButton: {
    backgroundColor: "#FF5733", width: "100%", height: 50,
    justifyContent: "center", alignItems: "center", borderRadius: 8, marginTop: 10,
  },
  resetButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  backToLoginText: { color: "#007AFF", fontSize: 16, marginTop: 15, fontWeight: "500" },
  checkboxContainer: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", marginTop: 5 },
  checkboxLabel: { marginLeft: 8, fontSize: 15, color: "#555" },
});

export default LoginScreen;
