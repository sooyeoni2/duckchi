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

type Props = NativeStackScreenProps<ProfileStackParamList, 'TermsView'>;

const { width: W } = Dimensions.get('window');
const s = W / 412;

const TERMS_CONTENT = `제1조 (목적)
본 약관은 덕치(duckchi, 이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리·의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.

제2조 (정의)
"서비스"란 덕치 앱을 통해 제공되는 모든 기능 및 콘텐츠를 말합니다.
"이용자"란 본 약관에 동의하고 서비스를 이용하는 모든 사람을 말합니다.
"계정"이란 이용자가 서비스 이용을 위해 등록한 정보의 집합을 말합니다.

제3조 (약관의 효력 및 변경)
본 약관은 서비스 화면에 게시하거나 이메일 등을 통해 공지함으로써 효력이 발생합니다.
회사는 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있으며, 변경 시 7일 전 공지합니다.

제4조 (서비스 제공)
덕치는 다음의 서비스를 제공합니다.
- 아이돌 덕질 일정 및 활동 기록 관리
- 팬 커뮤니티 정보 연동 기능
- 콘텐츠 저장 및 앨범 관리 기능
- 기타 회사가 추가 개발하거나 제휴를 통해 제공하는 서비스
서비스는 연중무휴 24시간 제공을 원칙으로 하나, 시스템 점검 시 일시 중단될 수 있습니다.

제5조 (이용자의 의무)
이용자는 다음 행위를 해서는 안 됩니다.
- 타인의 정보 도용 및 허위 정보 등록
- 서비스의 정상적인 운영을 방해하는 행위
- 타인의 명예를 손상시키거나 불이익을 주는 행위
- 저작권 등 지식재산권을 침해하는 행위
- 관련 법령 또는 약관에 위반되는 행위

제6조 (서비스 이용 제한)
회사는 이용자가 본 약관을 위반하는 경우 서비스 이용을 제한하거나 계정을 정지·해지할 수 있습니다.

제7조 (면책조항)
회사는 천재지변, 서비스 장애 등 불가항력적인 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.
이용자 귀책사유로 인한 서비스 이용 장애에 대해서도 책임을 지지 않습니다.

제8조 (분쟁 해결)
서비스 이용과 관련하여 분쟁이 발생한 경우, 회사와 이용자는 상호 협의하여 해결하며, 협의가 이루어지지 않을 경우 관할 법원에 소를 제기할 수 있습니다.`;

const PRIVACY_CONTENT = `개인정보 처리방침

덕치(duckchi)는 이용자의 개인정보를 중요하게 생각하며, 관련 법령을 준수합니다.

제1조 (수집하는 개인정보)
이메일, 이름 등 서비스 이용에 필요한 최소한의 정보를 수집합니다.

제2조 (개인정보의 이용 목적)
수집한 개인정보는 서비스 제공 및 개선 목적으로만 사용됩니다.

제3조 (개인정보의 보유 및 파기)
서비스 탈퇴 시 개인정보는 즉시 파기됩니다.`;

export function TermsViewScreen({ route, navigation }: Props) {
  const isTerms = route.params.type === 'terms';
  const title = isTerms ? '서비스 이용약관' : '개인정보 처리방침';
  const content = isTerms ? TERMS_CONTENT : PRIVACY_CONTENT;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <CustomAppBar
        title={title}
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
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{content}</Text>
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
    ...KBODiaGothicTextStyle.medium({ fontSize: 14 * s, color: '#000000' }),
    lineHeight: 22 * s,
  },
});
