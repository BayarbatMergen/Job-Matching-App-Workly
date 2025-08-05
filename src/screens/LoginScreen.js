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
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchUserData, saveUserData, resetPasswordWithBackend } from "../services/authService";
import API_BASE_URL from "../config/apiConfig";
import Checkbox from 'expo-checkbox';
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from 'react-i18next';

const LoginScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoLoginChecked, setAutoLoginChecked] = useState(false);
const [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    const tryAutoLogin = async () => {
      try {
        const shouldAutoLogin = await AsyncStorage.getItem("autoLogin");

        if (shouldAutoLogin === "true") {
          setAutoLoginChecked(true);
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
      Alert.alert(t('error.input'), t('error.emptyFields'));
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
        if (!autoTrigger) Alert.alert(t('error.loginFailed'), result.message || t('error.invalidCredentials'));
      }
    } catch (err) {
      console.error("로그인 중 오류:", err);
      Alert.alert(t('error.serverError'), err.message || t('error.tryAgainLater'));
    } finally {
      setLoading(false);
    }
  };

return (
  <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    style={{ flex: 1, backgroundColor: "#fff" }}
  >
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1 }}>
        {/* 상단 고정 영역 */}
        <View style={styles.header}>
          <Image source={require("../../assets/images/thechingu.png")} style={styles.logo} />
          <Text style={styles.title}>{t('common.login')}</Text>
        </View>

        {/* 스크롤 가능한 영역 */}
        <ScrollView
          contentContainerStyle={styles.formContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TextInput
            style={styles.input}
            placeholder={t('auth.email')}
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder={t('auth.password')}
              placeholderTextColor="#aaa"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={22}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.checkboxContainer}>
            <Checkbox
              value={autoLoginChecked}
              onValueChange={setAutoLoginChecked}
              color={autoLoginChecked ? "#007AFF" : undefined}
            />
            <Text style={styles.checkboxLabel}>{t('auth.autoLogin')}</Text>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.disabledButton]}
            onPress={() => handleLogin()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>{t('common.login')}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerContainer}>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.registerText}>{t('auth.register')}</Text>
            </TouchableOpacity>
            <Text style={styles.separator}> | </Text>
            <TouchableOpacity onPress={() => navigation.navigate("ResetPasswordRequest")}>
              <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>
          </View>
           <View style={styles.languageSelector}>
<Text style={{ fontSize: 16, marginBottom: 10 }}>Language</Text>
          <View style={{ flexDirection: "row", justifyContent: "center" }}>
            <TouchableOpacity onPress={() => i18n.changeLanguage('ko')}>
              <Text style={[styles.langButton, i18n.language === 'ko' && styles.langActive]}>
                🇰🇷 KO
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => i18n.changeLanguage('mn')}>
              <Text style={[styles.langButton, i18n.language === 'mn' && styles.langActive]}>
                🇲🇳 MN
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => i18n.changeLanguage('en')}>
              <Text style={[styles.langButton, i18n.language === 'en' && styles.langActive]}>
                🇺🇸 EN
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        </ScrollView>

        {/* 🌐 언어 선택은 스크롤 바깥으로 */}
       
      </View>
    </TouchableWithoutFeedback>
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
  checkboxContainer: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", marginTop: 5 },
  checkboxLabel: { marginLeft: 8, fontSize: 15, color: "#555" },
  header: {
  alignItems: "center",
  marginTop: 200,
  marginBottom: 20,
},
formContainer: {
  paddingHorizontal: 30,
  flexGrow: 1,
  justifyContent: "flex-start",
  alignItems: "center",
},
passwordContainer: {
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 8,
  paddingHorizontal: 15,
  marginBottom: 12,
  height: 50,
  width: "100%",
  justifyContent: "space-between",
},
languageSelector: {
  alignItems: "center",
  marginVertical: 10,     // ✅ 위아래 여백
  paddingBottom: 10,      // ✅ 홈 인디케이터와 겹치지 않도록 아래 패딩 추가
  position: "absolute",   // ✅ 아래에 고정하지 말고
  bottom: 30,             // ✅ 살짝 위로 올림
  width: "100%",          // ✅ 가운데 정렬
},
langButton: {
  fontSize: 16,
  marginHorizontal: 2,
  paddingVertical: 4,
  paddingHorizontal: 8,
  color: "#333",
},
langActive: {
  fontWeight: "bold",
  color: "#007AFF",
},
languageSelectorTop: {
  alignItems: "center",
  marginTop: 50,
  marginBottom: 20,
},
passwordInput: {
  flex: 1,
  fontSize: 16,
  color: "#333",
},
});

export default LoginScreen;
