import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import Signature from 'react-native-signature-canvas';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useTranslation } from 'react-i18next';

export default function ContractScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { userId, selectedDate, schedules, name: registeredName } = route.params;
  const [name, setName] = useState('');
  const [signature, setSignature] = useState(null);
  const signRef = useRef();

React.useLayoutEffect(() => {
  navigation.setOptions({
    title: t('contract.title'),
  });
}, [navigation, t]);

  const handleOK = signatureData => {
    setSignature(signatureData);
  };

  const handleSubmit = async () => {
    if (!name || !signature) {
      Alert.alert(t('contract.requiredTitle'), t('contract.requiredMessage'));
      return;
    }

    if (name !== registeredName) {
      Alert.alert(t('contract.nameMismatchTitle'), t('contract.nameMismatchMessage'));
      return;
    }

    try {
      await setDoc(doc(db, "attendance", `${selectedDate}_${userId}`), {
        userId,
        date: selectedDate,
        name,
        signature,
        time: new Date().toISOString(),
        schedules,
        signed: true
      });

      Alert.alert(t('contract.successTitle'), t('contract.successMessage'));
      navigation.popToTop();
    } catch (err) {
      console.error(err);
      Alert.alert(t('contract.errorTitle'), t('contract.errorMessage'));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('contract.heading')}</Text>
          <Text style={styles.subtitle}>{t('contract.subtitle')}</Text>

          <TextInput
            placeholder={t('contract.namePlaceholder')}
            style={styles.input}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>{t('contract.signatureLabel')}</Text>
          <View style={styles.signatureBox}>
            <Signature
              onOK={handleOK}
              onEnd={() => signRef.current.readSignature()}
              ref={signRef}
              descriptionText={t('contract.signatureHint')}
              clearText={t('contract.clear')}
              confirmText={t('contract.confirm')}
              webStyle={`.m-signature-pad--footer { display: none; margin: 0px; }`}
            />
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>{t('contract.submit')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '90%',
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: 20,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    elevation: 2
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 20, textAlign: 'center' },
  input: {
    borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, marginBottom: 20,
    fontSize: 16, backgroundColor: '#fff'
  },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  signatureBox: {
    height: 300,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  submitButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});
