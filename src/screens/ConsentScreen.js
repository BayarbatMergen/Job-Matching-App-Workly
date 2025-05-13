import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

const ConsentScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* 이용약관 */}
        <Text style={styles.title}>이용약관</Text>
        <Text style={styles.section}>
          제1조 (목적){"\n"}
          본 약관은 더친구(이하 '회사')가 제공하는 아르바이트 매칭 플랫폼 서비스 이용과 관련하여, 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.{"\n\n"}

          제2조 (정의){"\n"}
          ① “회원”이란 본 약관에 동의하고 회원가입을 완료한 자를 말합니다.{"\n"}
          ② “구인자”란 일자리를 등록하는 자, “구직자”란 일자리를 찾는 자를 의미합니다.{"\n\n"}

          제3조 (약관의 효력 및 변경){"\n"}
          회사는 본 약관을 서비스 초기화면 또는 연결화면에 게시하며, 관련 법령을 위반하지 않는 범위 내에서 개정할 수 있습니다.{"\n\n"}

          제4조 (서비스 제공){"\n"}
          회사는 다음 서비스를 제공합니다.{"\n"}
          - 아르바이트 정보 등록 및 검색{"\n"}
          - 채팅, 공지, 스케줄 관리 기능{"\n"}
          - 구직자 프로필 및 평가 시스템{"\n\n"}

          제5조 (회원의 의무){"\n"}
          회원은 정확한 정보를 기재하고, 타인의 정보를 도용하거나 서비스를 부정한 목적으로 사용해서는 안 됩니다.{"\n\n"}

          제6조 (서비스 중단 및 변경){"\n"}
          회사는 시스템 점검, 천재지변 등의 사유로 사전 공지 없이 서비스의 전부 또는 일부를 제한, 변경할 수 있습니다.{"\n\n"}

          제7조 (계약 해지 및 이용 제한){"\n"}
          회원은 언제든지 탈퇴할 수 있으며, 회사는 약관 위반 시 이용 제한 또는 탈퇴 조치를 취할 수 있습니다.{"\n\n"}

          제8조 (면책 조항){"\n"}
          회사는 천재지변, 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.{"\n\n"}

          제9조 (관할법원 및 준거법){"\n"}
          서비스 이용 중 발생한 분쟁은 회사의 본사 소재지를 관할하는 법원에서 해결합니다.{"\n\n"}

          본 약관은 2025년 4월 4일부터 시행됩니다.
        </Text>

        {/* 개인정보 수집 및 이용 동의 */}
        <Text style={styles.title}>개인정보 수집 및 이용 동의</Text>
        <Text style={styles.section}>
          회사는 '개인정보 보호법' 및 관련 법령에 따라 이용자의 개인정보를 안전하게 처리하며, 다음과 같은 내용에 동의합니다.{"\n\n"}

          1. 수집 항목{"\n"}
          - 필수: 이름, 연락처, 이메일, 계좌번호, 신분증 이미지{"\n"}
          - 선택: 마케팅 수신 여부{"\n\n"}

          2. 수집 목적{"\n"}
          - 회원 가입 및 본인 인증{"\n"}
          - 구인/구직 연결, 스케줄 관리 및 정산{"\n"}
          - 고객 지원 및 문의 응대{"\n\n"}

          3. 보유 및 이용 기간{"\n"}
          - 회원 탈퇴 시까지 보유하며, 관계 법령에 따라 일정 기간 보관 후 파기합니다.{"\n\n"}

          4. 제3자 제공{"\n"}
          - 원칙적으로 제3자에게 제공하지 않으며, 필요한 경우 별도 동의를 받습니다.{"\n\n"}

          5. 동의 거부 권리 및 불이익{"\n"}
          - 필수 항목의 동의를 거부할 경우 회원가입 및 서비스 이용이 제한될 수 있습니다.{"\n\n"}
        </Text>

        {/* 마케팅 정보 수신 동의 */}
        <Text style={styles.title}>마케팅 정보 수신 동의 (선택)</Text>
        <Text style={styles.section}>
          회사는 이벤트, 할인 혜택, 서비스 안내 등의 정보를 전달하기 위해 아래와 같은 방식으로 마케팅 정보를 수신합니다.{"\n\n"}

          1. 수신 항목{"\n"}
          - 이메일, 문자메시지(SMS), 푸시 알림{"\n\n"}

          2. 수신 목적{"\n"}
          - 신상품 정보, 프로모션 및 이벤트 안내{"\n"}
          - 고객 맞춤형 서비스 제공{"\n\n"}

          3. 수신 동의 철회{"\n"}
          - 이용자는 언제든지 설정에서 수신 동의를 철회할 수 있으며, 철회 시 이후부터 마케팅 정보는 제공되지 않습니다.{"\n\n"}

          ※ 마케팅 수신 동의는 선택사항이며, 미동의 시에도 기본 서비스 이용에는 제한이 없습니다.
        </Text>

        {/* 뒤로가기 버튼 */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.button}>
          <Text style={styles.buttonText}>뒤로가기</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 20,
    paddingBottom: 60, // ✅ 버튼이 짤리지 않도록 여유 확보
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 12,
    color: '#333',
  },
  section: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
  },
  button: {
    marginTop: 30,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ConsentScreen;
