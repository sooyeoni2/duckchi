import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KBODiaGothicTextStyle } from '@core/theme/typography';
import type { AuthStackParamList } from '@core/navigation/types';
import { useAuthStore } from '../models/authStore';
import { setTermsAgreed } from '@core/utils/termsStorage';

type Props = NativeStackScreenProps<AuthStackParamList, 'Terms'>;

const { width: W, height: H } = Dimensions.get('window');
const s = W / 412;

const Checkbox = ({ checked }: { checked: boolean }) => (
  <View style={[cb.box, checked && cb.checked]}>
    {checked && <Text style={cb.mark}>✓</Text>}
  </View>
);

const cb = StyleSheet.create({
  box: {
    width: 28 * s,
    height: 28 * s,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CECECE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: { backgroundColor: '#333333', borderColor: '#333333' },
  mark: { color: '#FFFFFF', fontSize: 14 * s, fontWeight: '700' },
});

const TermsScreen: React.FC<Props> = ({ navigation }) => {
  const user = useAuthStore((st) => st.user);
  const [all, setAll] = useState(false);
  const [t1, setT1] = useState(false);
  const [t2, setT2] = useState(false);

  const toggleAll = () => { const n = !all; setAll(n); setT1(n); setT2(n); };
  const toggleT1  = () => { const n = !t1;  setT1(n);  setAll(n && t2); };
  const toggleT2  = () => { const n = !t2;  setT2(n);  setAll(t1 && n); };
  const canConfirm = t1 && t2;

  return (
    <View style={styles.container}>
      {/* ── 상단 영역 (제목) ── */}
      <View style={styles.topSection}>
        <Text style={styles.title}>이용 약관</Text>
      </View>

      {/* ── 중단 영역 (문구 + 카드) ── */}
      <View style={styles.middleSection}>
        <Text style={styles.subtitle}>{'덕치와 함께 빠른 정산,\n기록은 착착!'}</Text>
        <Text style={styles.desc}>시작하기 전에 약관에 동의해 주세요</Text>

        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={toggleAll} activeOpacity={0.7}>
            <Text style={styles.rowText}>전체 동의</Text>
            <Checkbox checked={all} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.row} onPress={toggleT1} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowText}>[필수] 이용약관 동의</Text>
              <Text style={styles.viewLink}>보기</Text>
            </View>
            <Checkbox checked={t1} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.row} onPress={toggleT2} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowText}>[필수] 개인정보 처리방침</Text>
              <Text style={styles.viewLink}>보기</Text>
            </View>
            <Checkbox checked={t2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 하단 영역 (버튼) ── */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[styles.confirmBtn, !canConfirm && { opacity: 0.4 }]}
          onPress={async () => {
            if (!canConfirm || !user) return;
            await setTermsAgreed(user.userId);
            navigation.getParent()?.navigate('App');
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmText}>확인</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F3F5',
  },

  // 화면 위쪽 ~22% → 제목
  topSection: {
    height: H * 0.22,
    justifyContent: 'flex-end',
    paddingBottom: H * 0.01,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    ...KBODiaGothicTextStyle.bold({ fontSize: 40 * s, color: '#000000' }),
  },

  // 중간 영역: 문구 + 카드
  middleSection: {
    flex: 1,
    paddingHorizontal: 42 * s,
  },
  subtitle: {
    marginTop: H * 0.06,
    ...KBODiaGothicTextStyle.medium({ fontSize: 26 * s, color: '#000000' }),
    lineHeight: 32 * s,
  },
  desc: {
    marginTop: H * 0.025,
    ...KBODiaGothicTextStyle.medium({ fontSize: 15 * s, color: '#C2C2C2' }),
  },
  card: {
    marginTop: H * 0.03,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12 * s,
    paddingVertical: 4 * s,
    shadowColor: '#676767',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16 * s,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6 * s,
  },
  rowText: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 15 * s, color: '#000000' }),
  },
  viewLink: {
    ...KBODiaGothicTextStyle.light({ fontSize: 10 * s, color: '#C2C2C2' }),
    textDecorationLine: 'underline',
  },
  divider: {
    height: 1,
    backgroundColor: '#CECECE',
    opacity: 0.5,
  },

  // 하단 버튼 영역
  bottomSection: {
    paddingHorizontal: 42 * s,
    paddingBottom: H * 0.05,
    paddingTop: H * 0.02,
  },
  confirmBtn: {
    width: '100%',
    height: 60,
    backgroundColor: '#FEEC7E',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 20 * s,
    fontWeight: '700',
    color: '#000000',
  },
});

export default TermsScreen;
