import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import Signature from 'react-native-signature-canvas';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function ContractScreen({ route, navigation }) {
const { userId, selectedDate, schedules, name: registeredName } = route.params;
  const [name, setName] = useState('');
  const [signature, setSignature] = useState(null);
const signRef = useRef();

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: '출근 서약서'
    });
  }, [navigation]);

  const handleOK = signatureData => {

    setSignature(signatureData);
  };

const handleSubmit = async () => {
  if (!name || !signature) {
    Alert.alert('필수 입력', '성명과 서명을 모두 입력해주세요.');
    return;
  }

  if (name !== registeredName) {
    Alert.alert('성명 불일치', '등록된 성명과 일치하지 않습니다.');
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

    Alert.alert('출근 완료', '출근 서약서가 저장되었습니다.');
    navigation.popToTop();
  } catch (err) {
    console.error(err);
    Alert.alert('저장 오류', '출근 정보 저장에 실패했습니다.');
  }
};

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View style={styles.card}>
          <Text style={styles.title}>출 근 서 약 서</Text>
          <Text style={styles.subtitle}>A Daily Labor Contract / Хөдөлмөрийн гэрээ</Text>

          <TextInput
            placeholder="성명을 입력하세요"
            style={styles.input}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>서명(Signature):</Text>
          <View style={styles.signatureBox}>
<Signature
  onOK={handleOK}
  onEnd={() => signRef.current.readSignature()}
  ref={signRef}
  descriptionText="여기에 서명하세요"
  clearText="지우기"
  confirmText="확인"
  webStyle={`.m-signature-pad--footer { display: none; margin: 0px; }`}
/>


          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>서약 제출</Text>
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
