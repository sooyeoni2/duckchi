import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ProfileStackParamList } from '../../../core/navigation/types';
import { AppColorStyles } from '../../../core/theme/colors';
import { KBODiaGothicTextStyle } from '../../../core/theme/typography';
import { CustomAppBar } from '../../../shared/components/app_bar/CustomAppBar';
import { usePopOnTabBlur } from '../../../shared/hooks/usePopOnTabBlur';

type Nav = NativeStackNavigationProp<ProfileStackParamList>;

function SectionLabel({ title }: { title: string }) {
  return <Text style={styles.sectionLabel}>{title}</Text>;
}

function SettingsRow({
  label,
  onPress,
  right,
}: {
  label: string;
  onPress?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress} activeOpacity={0.6}>
      <Text style={styles.rowLabel}>{label}</Text>
      {right ?? (
        onPress && <MaterialDesignIcons name="chevron-right" size={20} color={AppColorStyles.black} />
      )}
    </TouchableOpacity>
  );
}

function RowDivider() {
  return <View style={styles.divider} />;
}

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const [notificationEnabled, setNotificationEnabled] = useState(true);

  usePopOnTabBlur();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <CustomAppBar
        title="설정"
        centerTitle={false}
        showBackButton
        backgroundColor={AppColorStyles.background}
        onBackPress={() => navigation.goBack()}
        showDivider
      />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 계정 */}
        <SectionLabel title="계정" />
        <View style={styles.card}>
          <SettingsRow label="대표 계좌 설정" onPress={() => navigation.navigate('BankAccountRegister')} />
          <RowDivider />
          <SettingsRow label="자동이체 한도 변경" onPress={() => {}} />
        </View>

        {/* 알림 */}
        <SectionLabel title="알림" />
        <View style={styles.card}>
          <SettingsRow
            label="알림 설정"
            right={
              <Switch
                value={notificationEnabled}
                onValueChange={setNotificationEnabled}
                trackColor={{ false: AppColorStyles.gray3, true: AppColorStyles.gray1 }}
                thumbColor={AppColorStyles.white}
                style={{ alignSelf: 'center' }}
              />
            }
          />
        </View>

        {/* 앱 정보 */}
        <SectionLabel title="앱 정보" />
        <View style={styles.card}>
          <SettingsRow
            label="버전 정보"
            right={<Text style={styles.versionText}>v1.0.0</Text>}
          />
          <RowDivider />
          <SettingsRow label="서비스 이용약관" onPress={() => {}} />
          <RowDivider />
          <SettingsRow label="개인정보 처리방침" onPress={() => {}} />
          <RowDivider />
          <SettingsRow label="오픈소스 라이선스" onPress={() => {}} />
        </View>

        {/* 로그아웃 */}
        <View style={[styles.card, { marginTop: 12 }]}>
          <TouchableOpacity style={styles.row} onPress={() => {}} activeOpacity={0.6}>
            <Text style={styles.logoutLabel}>로그아웃</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColorStyles.background,
  },
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 19,
    paddingBottom: 32,
  },
  sectionLabel: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 16, color: AppColorStyles.gray2 }),
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 10,
  },
  card: {
    backgroundColor: AppColorStyles.surface,
    borderRadius: 10,
    shadowColor: AppColorStyles.gray2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
  },
  rowLabel: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 15, color: AppColorStyles.black }),
  },
  divider: {
    height: 1,
    backgroundColor: AppColorStyles.divider,
    marginHorizontal: 16,
  },
  versionText: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 15, color: AppColorStyles.textDisabled }),
  },
  logoutLabel: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 15, color: AppColorStyles.danger }),
  },
});
