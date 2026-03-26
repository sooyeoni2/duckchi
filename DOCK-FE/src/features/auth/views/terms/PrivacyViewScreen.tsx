import React from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '@core/navigation/types';
import { KBODiaGothicTextStyle } from '@core/theme/typography';
import { CustomAppBar } from '@shared/components/app_bar/CustomAppBar';
import { AppColorStyles } from '@core/theme/colors';

type Props = NativeStackScreenProps<ProfileStackParamList, 'PrivacyView'>;

const { width: W } = Dimensions.get('window');
const s = W / 412;

const PRIVACY_CONTENT = `덕치는 이용자의 개인정보를 소중히 여기며, 개인정보보호법 등 관련 법령을 준수합니다.

제1조 (수집하는 개인정보 항목)
필수 수집 항목
이메일 주소, 비밀번호 (회원가입 시)
닉네임, 프로필 사진 (선택적 설정)
서비스 이용 기록, 접속 로그, 기기 정보

자동 수집 항목
IP 주소, 쿠키, 서비스 이용 일시
앱 버전, OS 종류 및 버전

제2조 (개인정보 수집 및 이용 목적)
- 회원 식별 및 서비스 제공
- 서비스 개선 및 신규 기능 개발
- 부정 이용 방지 및 서비스 보안 유지
- 법령 및 서비스 이용약관 위반 행위 제재

제3조 (개인정보 보유 및 파기)
회원 탈퇴 즉시 개인정보를 파기합니다. 단, 관련 법령에 따라 일정 기간 보관이 필요한 경우 아래와 같이 처리합니다.
- 전자상거래 계약 기록: 5년 (전자상거래법)
- 소비자 불만 및 분쟁 기록: 3년 (전자상거래법)
- 접속 로그 기록: 3개월 (통신비밀보호법)

제4조 (개인정보의 제3자 제공)
덕치는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 이용자의 사전 동의가 있거나 법령에 의한 경우 예외적으로 제공할 수 있습니다.

제5조 (개인정보 처리 위탁)
원활한 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 위탁할 수 있습니다.
- 클라우드 서버 운영 (AWS, Google Cloud 등)
- 푸시 알림 서비스 (Firebase Cloud Messaging)

제6조 (이용자의 권리)
이용자는 언제든지 다음의 권리를 행사할 수 있습니다.
- 개인정보 조회·수정·삭제 요청
- 개인정보 처리 정지 요청
- 회원 탈퇴를 통한 개인정보 파기 요청

제7조 (개인정보 보호책임자)
개인정보 관련 문의는 아래로 연락해 주세요.
📧 duckduck@duckchi.app
⏰ 운영시간: 평일 10:00 ~ 18:00`;

export function PrivacyViewScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <CustomAppBar
        title="개인정보 처리방침"
        centerTitle={false}
        showBackButton
        backgroundColor={AppColorStyles.background}
        onBackPress={() => navigation.goBack()}
        showDivider
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.title}>개인정보 처리방침</Text>
          <Text style={styles.body}>{PRIVACY_CONTENT}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F3F5',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 42 * s,
    paddingTop: 24 * s,
    paddingBottom: 16 * s,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20 * s,
    shadowColor: '#676767',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 16 * s, color: '#000000' }),
    marginBottom: 20 * s,
  },
  body: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 15 * s, color: '#000000' }),
    lineHeight: 22 * s,
  },
});
