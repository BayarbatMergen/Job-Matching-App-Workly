import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Checkbox from 'expo-checkbox';
import API_BASE_URL from "../config/apiConfig";
import RNPickerSelect from 'react-native-picker-select';
import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import uuid from 'react-native-uuid';
import { useTranslation } from 'react-i18next';

const RegisterScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { marketingConsent = false, termsAgreedAt = null, termsVersion = null } = route.params || {};
const [accountHolder, setAccountHolder] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState(null);
  const [phone, setPhone] = useState('');
  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [idImage, setIdImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const isPasswordValid = (password) => /^(?=.*[!@#$%^&*()]).{6,}$/.test(password);
  const isKoreanOnly = (text) => /^[\uAC00-\uD7A3]+$/.test(text);
  const isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const checkNameDuplication = async (name) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/check-name`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const data = await res.json();
    return res.ok && data.available; // true: 사용 가능, false: 중복
  } catch (error) {
    console.error("이름 중복 확인 실패:", error);
    throw new Error("이름 중복 확인 중 오류 발생");
  }
};
const checkPhoneDuplication = async (phone) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/check-phone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    const data = await res.json();
    return res.ok && data.available;
  } catch (error) {
    console.error("전화번호 중복 확인 실패:", error);
    throw new Error("전화번호 중복 확인 중 오류 발생");
  }
};
const checkEmailDuplication = async (email) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/check-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    return res.ok && data.available;
  } catch (error) {
    console.error("이메일 중복 확인 실패:", error);
    throw new Error("이메일 중복 확인 중 오류 발생");
  }
};
const formatPhoneNumber = (phone) => {
  if (!phone) return null;

  const onlyDigits = phone.replace(/[^\d]/g, '');

  // 11자리 010 번호 또는 10자리 82 번호
  if ((onlyDigits.length === 11 && onlyDigits.startsWith('010')) || 
      (onlyDigits.length === 10 && onlyDigits.startsWith('82'))) {
    return onlyDigits.length === 11 
      ? `+82${onlyDigits.slice(1)}` 
      : `+${onlyDigits}`;
  }

  return null;
};

  const handleGenderSelect = (selectedGender) => setGender(selectedGender);

  const pickerSelectStyles = {
    inputIOS: {
      fontSize: 16,
      paddingVertical: 12,
      paddingHorizontal: 15,
      color: '#333',
      backgroundColor: '#fff',
      borderRadius: 8,
      paddingRight: 30,
    },
    inputAndroid: {
      fontSize: 16,
      paddingVertical: 10,
      paddingHorizontal: 15,
      color: '#333',
      backgroundColor: '#fff',
      borderRadius: 8,
      paddingRight: 30,
    },
    iconContainer: {
      top: 20,
      right: 15,
    },
  };

const pickImage = () => {
Alert.alert(
  t('alert.noticeTitle'),       // 예: '안내'
  t('alert.uploadOnceWarning'),
    [
{ text: t('common.cancel'), style: "cancel" },
      {
        text: t('common.confirm'),
        onPress: async () => {
          const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!permissionResult.granted) {
            Alert.alert(t('alert.galleryPermission'));
            return;
          }

          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
          });

          if (!result.canceled) {
            setIdImage({
              uri: result.assets[0].uri,
              name: `photo-${Date.now()}.jpg`,
              type: 'image/jpeg'
            });
          }
        },
      },
    ],
    { cancelable: true }
  );
};


const uploadImageToFirebase = async (image) => {
  try {
    console.log("Firebase Storage 업로드 시작");

    const response = await fetch(image.uri);
    const blob = await response.blob();
    const filename = `idImages/${uuid.v4()}.jpg`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);

    console.log(" 업로드 성공 URL:", downloadURL);
    return downloadURL;
  } catch (error) {
    console.error("Firebase 업로드 전체 에러:", JSON.stringify(error));
    throw new Error('이미지 업로드 실패');
  }
};


const handleRegister = async () => {
  if (!agreeTerms) {
    Alert.alert(t('alert.terms'), t('auth.termsRequired'));
    return;
  }

  const cleanedPhone = phone.replace(/\D/g, '');
  if (cleanedPhone.length !== 11 || !cleanedPhone.startsWith('010')) {
    Alert.alert(t('alert.phoneTitle'), t('alert.phoneInvalid'));
    return;
  }

  const formattedPhone = `+82${cleanedPhone.slice(1)}`;

  if (!email || !password || !confirmPassword || !name || !phone || !gender || !bank || !accountNumber) {
    Alert.alert(t('error.input'), t('auth.fillAllFields'));
    return;
  }

  if (!isEmailValid(email)) {
    Alert.alert(t('alert.emailTitle'), t('alert.emailInvalid'));
    return;
  }

  if (!isKoreanOnly(name)) {
    Alert.alert(t('alert.nameTitle'), t('alert.nameInvalid'));
    return;
  }

  if (password !== confirmPassword) {
    Alert.alert(t('alert.passwordMismatchTitle'), t('alert.passwordMismatch'));
    return;
  }

if (!/^[a-zA-Z가-힣\s]+$/.test(accountHolder)) {
  Alert.alert(t('alert.accountHolderTitle'), t('alert.accountHolderInvalid'));
  return;
}

if (!idImage || !idImage.uri) {
  Alert.alert(t('alert.idMissingTitle'), t('alert.idMissing'))
  return;
}

// ✅ 등록 전 사용자에게 수정 불가능 안내
Alert.alert(t('alert.noticeTitle'), t('alert.uploadOnceWarning'));

setLoading(true);
let imageUrl = "";

try {
    const isEmailAvailable = await checkEmailDuplication(email);
  if (!isEmailAvailable) {
    Alert.alert(t('error.duplicateEmail'), t('error.emailTaken'))
    setLoading(false);
    return;
  }

  const isNameAvailable = await checkNameDuplication(name);
  if (!isNameAvailable) {
Alert.alert(t('error.duplicateNameTitle'), t('error.duplicateName'));
    setLoading(false);
    return;
  }

const isPhoneAvailable = await checkPhoneDuplication(formattedPhone);
if (!isPhoneAvailable) {
Alert.alert(t('error.duplicatePhoneTitle'), t('error.duplicatePhone'));
  setLoading(false);
  return;
}


  if (idImage && idImage.uri) {
    imageUrl = await uploadImageToFirebase(idImage);
  }

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        name,
        phone: formattedPhone,
        gender,
        bank,
        accountHolder, 
        accountNumber: accountNumber.replace(/-/g, ''),
        idImageUrl: imageUrl,
        marketingConsent,
        termsAgreedAt: termsAgreedAt || new Date().toISOString(),
        termsVersion: termsVersion || "1.0",
        role: 'user',
      }),
    });

    const result = await response.json();

    if (response.ok) {
      Alert.alert(t('auth.successTitle'), t('auth.successMessage'))
      navigation.replace("Login");
    } else {
      Alert.alert(t('auth.failTitle'), result.message || t('error.serverError'))
    }

  } catch (error) {
    console.error("등록 실패:", error);
    Alert.alert(t('auth.failTitle'), error.message || t('error.unknown'));
  } finally {
    setLoading(false);
  }
};



  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 50 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Image source={require('../../assets/images/thechingu.png')} style={styles.logo} />
          <Text style={styles.title}>{t('auth.register')}</Text>

          <TextInput
            style={styles.input}
            placeholder={t('auth.email')}
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder={t('auth.passwordHint')}
            placeholderTextColor="#aaa"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TextInput
            style={styles.input}
            placeholder={t('auth.passwordConfirm')}
            placeholderTextColor="#aaa"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TextInput
            style={styles.input}
            placeholder={t('auth.nameHint')}
            placeholderTextColor="#aaa"
            value={name}
            onChangeText={setName}
          />
          
          <View style={styles.genderContainer}>
            <Text style={styles.label}>{t('auth.genderSelect')}</Text>
            <View style={styles.genderButtons}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === "male" && styles.selectedGender,
                ]}
                onPress={() => handleGenderSelect("male")}
              >
                <Text
                  style={[
                    styles.genderButtonText,
                    gender === "male" && styles.selectedGenderText,
                  ]}
                >
                  {t('auth.male')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === "female" && styles.selectedGender,
                ]}
                onPress={() => handleGenderSelect("female")}
              >
                <Text
                  style={[
                    styles.genderButtonText,
                    gender === "female" && styles.selectedGenderText,
                  ]}
                >
                  {t('auth.female')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TextInput
            style={styles.input}
            placeholder={t('auth.phoneHint')}
            placeholderTextColor="#aaa"
            value={phone}
            keyboardType="numeric"
            onChangeText={(text) => {
              const onlyDigits = text.replace(/[^0-9]/g, '');
              let formatted = onlyDigits;
              if (onlyDigits.length <= 3) {
                formatted = onlyDigits;
              } else if (onlyDigits.length <= 7) {
                formatted = `${onlyDigits.slice(0, 3)}-${onlyDigits.slice(3)}`;
              } else {
                formatted = `${onlyDigits.slice(0, 3)}-${onlyDigits.slice(3, 7)}-${onlyDigits.slice(7, 11)}`;
              }
              setPhone(formatted);
            }}
          />

          <View style={styles.pickerContainer}>
            <Text style={styles.label}>{t('auth.bankLabel')}</Text>
            <View style={styles.pickerWrapper}>
              <RNPickerSelect
                onValueChange={(value) => setBank(value)}
                value={bank}
                placeholder={{ label: t('auth.selectBank'), value: "" }}
                items={[
                  { label: "국민은행", value: "국민은행" },
                  { label: "신한은행", value: "신한은행" },
                  { label: "하나은행", value: "하나은행" },
                  { label: "우리은행", value: "우리은행" },
                  { label: "카카오뱅크", value: "카카오뱅크" },
                  { label: "농협은행", value: "농협은행" },
                  { label: "IBK기업은행", value: "IBK기업은행" },
                  { label: "SC제일은행", value: "SC제일은행" },
                  { label: "케이뱅크", value: "케이뱅크" },
                  { label: "토스뱅크", value: "토스뱅크" },
                  { label: "씨티은행", value: "씨티은행" },
                  { label: "수협은행", value: "수협은행" },
                  { label: "대구은행", value: "대구은행" },
                  { label: "부산은행", value: "부산은행" },
                  { label: "광주은행", value: "광주은행" },
                  { label: "전북은행", value: "전북은행" },
                  { label: "경남은행", value: "경남은행" },
                  { label: "우체국", value: "우체국" },
                  { label: "신협", value: "신협" },
                  { label: "새마을금고", value: "새마을금고" },
                  { label: "산림조합중앙회", value: "산림조합중앙회" },
                  { label: "HSBC", value: "HSBC" },
                  { label: "JP모간체이스", value: "JP모간체이스" },
                  { label: "BOA", value: "BOA" },
                  { label: "중국은행", value: "중국은행" },
                  { label: "중국건설은행", value: "중국건설은행" },
                ]}
                style={pickerSelectStyles}
                useNativeAndroidPickerStyle={false}
                Icon={() => (
                  <View
                    style={{
                      backgroundColor: "transparent",
                      borderTopWidth: 6,
                      borderTopColor: "#000",
                      borderRightWidth: 6,
                      borderRightColor: "transparent",
                      borderLeftWidth: 6,
                      borderLeftColor: "transparent",
                      width: 0,
                      height: 0,
                      position: "absolute",
                      right: 15,
                      top: Platform.OS === "ios" ? 0: 12,
                      zIndex: 10,
                    }}
                  />
                )}
              />
            </View>
          </View>
<TextInput
  style={styles.input}
  placeholder={t('auth.accountHolder')}
  placeholderTextColor="#aaa"
  value={accountHolder}
  onChangeText={setAccountHolder}
/>

          <TextInput
            style={styles.input}
            placeholder={t('auth.accountNumber')}
            placeholderTextColor="#aaa"
            value={accountNumber}
            keyboardType="numeric"
            onChangeText={(text) => {
              const digits = text.replace(/\D/g, '');
              const formatted = digits.replace(/(\d{3})(\d{3,4})(\d{4,7})/, "$1-$2-$3");
              setAccountNumber(formatted);
            }}
            
          />

          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Text style={styles.uploadButtonText}>{t('auth.uploadId')}</Text>
          </TouchableOpacity>
          
          {idImage && <Image source={{ uri: idImage.uri }} style={styles.profileImage} />}

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.registerButtonText}>{t('auth.register')}</Text>}
          </TouchableOpacity>

          <View style={styles.checkboxContainer}>
            <Checkbox value={agreeTerms} onValueChange={setAgreeTerms} color={agreeTerms ? '#007AFF' : undefined} />
            <Text style={styles.checkboxLabel}>
  {t('auth.termsRequiredPrefix')}{' '}
              <Text onPress={() => navigation.navigate("ConsentScreen")} style={styles.linkText}>
                 {t('auth.termsLink')}
              </Text>
            </Text>
          </View>

          {!agreeTerms && (
            <Text style={styles.noticeText}>{t('auth.termsRequired')}</Text>
          )}

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>{t('auth.alreadyHaveAccount')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    paddingBottom: 80,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 160,
    height: 160,
    resizeMode: 'contain',
    marginBottom: 10,
    marginTop: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 25,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 12,
    fontSize: 15,
  },
  genderContainer: {
    width: '100%',
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    color: '#444',
  },
  genderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  selectedGender: {
    backgroundColor: '#007AFF',
  },
  genderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  selectedGenderText: {
    color: '#fff',
  },
  pickerContainer: {
    width: '100%',
    marginBottom: 12,
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    width: '100%',
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 12,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginVertical: 10,
  },
  registerButton: {
    backgroundColor: '#007AFF',
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 16,
    marginBottom: 12,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    width: '100%',
    paddingLeft: 2,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    flexWrap: 'wrap',
    flex: 1,
  },
  linkText: {
    color: '#007AFF',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  noticeText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  loginText: {
    marginTop: 20,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  pickerWrapper: {
    position: 'relative',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
});

export default RegisterScreen;