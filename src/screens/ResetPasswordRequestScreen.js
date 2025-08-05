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
import { useTranslation } from "react-i18next"; // ✅ i18n 훅
import { resetPasswordWithBackend } from "../services/authService";

const ResetPasswordRequestScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation(); // ✅ i18n 훅 사용

  const handleReset = async () => {
    if (!email) {
      Alert.alert(t("error.input"), t("error.emptyFields")); // ✅ 번역
      return;
    }

    setLoading(true);
    try {
      const { message } = await resetPasswordWithBackend(email);

      Alert.alert(t("auth.successTitle"), message, [
        {
          text: t("common.confirm"),
          onPress: () => navigation.replace("Login"),
        },
      ]);
    } catch (error) {
      Alert.alert(t("error.serverError"), error.message || t("error.tryAgainLater"));
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
        <Text style={styles.title}>{t("auth.forgotPassword")}</Text>
        <TextInput
          style={styles.input}
          placeholder={t("auth.email")}
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
            <Text style={styles.resetButtonText}>{t("auth.sendResetLink")}</Text> // ✅ 새 키 필요
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
         <Text style={styles.backText}>{`← ${t("auth.backToLogin")}`}</Text>
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
