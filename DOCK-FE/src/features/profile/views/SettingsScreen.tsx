import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ProfileStackParamList, RootStackParamList } from '../../../core/navigation/types';
import { AppColorStyles } from '../../../core/theme/colors';
import { KBODiaGothicTextStyle } from '../../../core/theme/typography';
import { CustomAppBar } from '../../../shared/components/app_bar/CustomAppBar';
import { usePopOnTabBlur } from '../../../shared/hooks/usePopOnTabBlur';
import { useProfileViewModel } from '../viewmodels/useProfileViewModel';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

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
    <View style={styles.rowWrapper}>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && onPress && styles.rowPressed]}
        onPress={onPress}
        disabled={!onPress}
      >
        <Text style={styles.rowLabel}>{label}</Text>
        {right ?? (
          onPress && <MaterialDesignIcons name="chevron-right" size={20} color={AppColorStyles.black} />
        )}
      </Pressable>
    </View>
  );
}

function RowDivider() {
  return <View style={styles.divider} />;
}

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const { state } = useProfileViewModel();
  const hasAccount = state.status === 'loaded' && state.profile.accounts.length > 0;

  const handleAccountSetupPress = () => {
    if (hasAccount) {
      navigation.navigate('BankAccountRegister');
    } else {
      navigation.navigate('BankAccountSetup', { returnTo: 'Settings' });
    }
  };

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
          <SettingsRow label="대표 계좌 설정" onPress={handleAccountSetupPress} />
          <RowDivider />
          <SettingsRow label="자동이체 한도 변경" onPress={() => navigation.navigate('TransferLimit')} />
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
          <View style={styles.rowWrapper}>
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => {}}
            >
              <Text style={styles.logoutLabel}>로그아웃</Text>
            </Pressable>
          </View>
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
    marginTop: 14,
    marginBottom: 6,
    marginLeft: 10,
  },
  card: {
    backgroundColor: AppColorStyles.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rowWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 52,
    borderRadius: 12,
  },
  rowPressed: {
    backgroundColor: AppColorStyles.gray5,
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
