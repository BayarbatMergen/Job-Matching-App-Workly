// ✅ i18n 적용 완료된 JobDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, Alert
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import ApplyButton from '../components/ApplyButton';
import { useTranslation } from 'react-i18next';

export default function JobDetailScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { job } = route.params ?? {};
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUserId = await SecureStore.getItemAsync('userId');
        if (storedUserId) {
          setUserId(storedUserId);
        }
      } catch (error) {
        console.error(" 사용자 ID 불러오기 오류:", error);
      }
    };
    fetchUserData();
  }, []);

  if (!job) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>{t('job.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.detailTitle}>{job.title}</Text>

        <View style={styles.infoBox}>
          <Text style={styles.detailSubTitle}>{t('job.conditions')}</Text>
          <Text style={styles.detailText}><Text style={styles.bold}>{t('job.period')}:</Text> {job.startDate && job.endDate ? `${job.startDate} ~ ${job.endDate}` : t('job.undefined')}</Text>
          <Text style={styles.detailText}><Text style={styles.bold}>{t('job.wage')}:</Text> {job.wage ? `${Number(job.wage).toLocaleString()}원` : t('job.undefined')}</Text>
          <Text style={styles.detailText}><Text style={styles.bold}>{t('job.days')}:</Text> {Array.isArray(job.workDays) ? job.workDays.join(", ") : job.workDays || t('job.undefined')}</Text>
          <Text style={styles.detailText}><Text style={styles.bold}>{t('job.hours')}:</Text> {job.workHours || t('job.undefined')}</Text>
          <Text style={styles.detailText}><Text style={styles.bold}>{t('job.industry')}:</Text> {job.industry || t('job.undefined')}</Text>
          <Text style={styles.detailText}><Text style={styles.bold}>{t('job.employmentType')}:</Text> {job.employmentType || t('job.undefined')}</Text>
          <Text style={styles.detailText}><Text style={styles.bold}>{t('job.accommodation')}:</Text> {job.accommodation ? "O" : "X"}</Text>
          <Text style={styles.detailText}>
            <Text style={styles.bold}>{t('job.recruitment')}:</Text> {t('job.male')} {job.maleRecruitment || 0}{t('job.people')} / {t('job.female')} {job.femaleRecruitment || 0}{t('job.people')}
          </Text>
          <Text style={styles.detailText}><Text style={styles.bold}>{t('job.location')}:</Text> {job.location || t('job.undefined')}</Text>
        </View>

        <View style={styles.descriptionBox}>
          <Text style={styles.detailSubTitle}>{t('job.descriptionTitle')}</Text>
          <Text style={styles.descriptionText}>{job.description || t('job.noDescription')}</Text>
        </View>

        <ApplyButton job={job} navigation={navigation} />
      </View>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, paddingVertical: 20 },
  container: { flex: 1, padding: 25, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  detailTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#222' },
  infoBox: {
    backgroundColor: '#F9F9F9',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
  },
  detailSubTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#444' },
  detailText: { fontSize: 16, color: '#333', marginBottom: 10 },
  bold: { fontWeight: 'bold', color: '#000' },
  descriptionBox: {
    backgroundColor: '#FAFAFA',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 30,
  },
  descriptionText: { fontSize: 15, color: '#444', lineHeight: 22 },
});
