import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import { fetchUserData } from '../services/authService';
import API_BASE_URL from '../config/apiConfig';

export default function JobListScreen({ navigation, hasNotifications }) {
  const [jobListings, setJobListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);
  const { t } = useTranslation();

  const fetchJobs = async (uid) => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/list?userId=${uid}`);
      const data = await response.json();
      if (response.ok) {
        setJobListings(data);
      } else {
        console.error(t("jobList.fetchFail"), data.message);
      }
    } catch (error) {
      console.error(t("jobList.fetchError"), error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        navigation.replace("Login");
        return;
      }
      const user = await fetchUserData();
      setUserId(user.userId);
      await fetchJobs(user.userId);
    };
    init();
  }, []);

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({
        headerTitle: t("jobList.headerTitle"), // ✅ 문자열만 반환
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.navigate('Notification')}
            style={{ marginRight: 15, position: 'relative' }}
          >
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            {hasNotifications && <View style={styles.notificationDot} />}
          </TouchableOpacity>
        )
      });
    }, [hasNotifications, t])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const storedUserId = userId || (await fetchUserData()).userId;
    await fetchJobs(storedUserId);
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>{t("jobList.loading")}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <FlatList
        data={jobListings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.jobCard}
            onPress={() => navigation.navigate('JobDetail', { job: item })}
          >
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.wage}>{Number(item.wage).toLocaleString()}원</Text>
            <Text style={styles.date}>
              {item.startDate && item.endDate
                ? `${item.startDate} ~ ${item.endDate}`
                : t("jobList.noPeriod")}
            </Text>
            <Text style={styles.location}>📍 {item.location}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={50} color="#ccc" />
            <Text style={styles.emptyTextTitle}>{t("jobList.noJobs")}</Text>
            <Text style={styles.emptyTextSub}>{t("jobList.notifyNew")}</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: 20,
          paddingHorizontal: 20,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyTextTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 15,
  },
  emptyTextSub: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  jobCard: {
    backgroundColor: '#F8F8F8',
    padding: 18,
    marginBottom: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  wage: {
    fontSize: 16,
    color: 'red',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#777',
  },
  notificationDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 10,
    height: 10,
    backgroundColor: 'red',
    borderRadius: 5,
  },
});
