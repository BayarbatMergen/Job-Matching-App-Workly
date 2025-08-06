import React, { useState, useEffect } from "react";
import { TouchableOpacity, Text, Alert, ActivityIndicator } from "react-native";
import * as SecureStore from "expo-secure-store";
import { db } from "../config/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import API_BASE_URL from "../config/apiConfig";
import { useTranslation } from "react-i18next";

const jwtDecode = require("jwt-decode");

const ApplyButton = ({ job, navigation }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUserId = await SecureStore.getItemAsync("userId");
        const storedToken = await SecureStore.getItemAsync("token");

        if (!storedUserId || !storedToken) {
          console.warn(t("apply.noStoredData"));
          navigation.navigate("Login");
          return;
        }

        const decodedToken = jwtDecode(storedToken);
        const email = decodedToken.email;

        setUserId(storedUserId);
        setToken(storedToken);
        setUserEmail(email);
      } catch (error) {
        console.error(t("apply.loadUserError"), error);
        navigation.navigate("Login");
      }
    };

    fetchUserData();
  }, [navigation]);

  useEffect(() => {
    const checkAlreadyApplied = async () => {
      if (!userEmail || !job?.id) return;

      try {
        const response = await fetch(
          `${API_BASE_URL}/jobs/applied?jobId=${job.id}&userEmail=${userEmail}`
        );
        const data = await response.json();

        if (response.ok && data.alreadyApplied) {
          setHasApplied(true);
        }
      } catch (error) {
        console.error(t("apply.duplicateCheckError"), error);
      }
    };

    checkAlreadyApplied();
  }, [userEmail, job]);

  const handleApply = async () => {
    if (!userId || !token || !userEmail) {
      Alert.alert(t("apply.authErrorTitle"), t("apply.authErrorMessage"), [
        { text: t("common.confirm"), onPress: () => navigation.navigate("Login") },
      ]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jobId: job.id, userEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        const userQuery = query(
          collection(db, "users"),
          where("email", "==", userEmail)
        );
        const userSnap = await getDocs(userQuery);
        const userData = userSnap.docs[0]?.data();
        const userName = userData?.name || userEmail;

        await addDoc(collection(db, "notifications"), {
          type: "application",
          status: "unread",
          createdAt: serverTimestamp(),
          recipientRole: "admin",
          jobId: job.id,
          jobTitle: job.title,
          userEmail: userEmail,
          message: t("apply.notifyAdmin", { userName, jobTitle: job.title }),
        });

        Alert.alert(t("apply.successTitle"), t("apply.successMessage", { jobTitle: job.title }));
        setHasApplied(true);
        navigation.replace("JobList");
      } else {
        if (data.message === "이미 해당 공고에 지원하셨습니다.") {
          setHasApplied(true);
          Alert.alert(t("apply.duplicateAlertTitle"), data.message);
        } else {
          throw new Error(data.message || t("apply.failedRequest"));
        }
      }
    } catch (error) {
      console.error(t("apply.requestError"), error.message);
      Alert.alert(t("common.errorOccurred"), error.message);
    } finally {
      setLoading(false);
    }
  };

  if (hasApplied) {
    return (
      <TouchableOpacity
        style={{
          backgroundColor: "gray",
          padding: 15,
          borderRadius: 8,
          alignItems: "center",
        }}
        disabled
      >
        <Text style={{ color: "#FFF", fontSize: 16 }}>
          {t("apply.alreadyApplied")}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handleApply}
      style={{
        backgroundColor: "#007AFF",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
      }}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#FFF" />
      ) : (
        <Text style={{ color: "#FFF", fontSize: 18, fontWeight: "bold" }}>
          {t("apply.button")}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default ApplyButton;
