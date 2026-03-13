import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { ProfileStackParamList } from '../../../core/navigation/types';
import { AppColorStyles } from '../../../core/theme/colors';
import { KBODiaGothicTextStyle } from '../../../core/theme/typography';
import { CustomAppBar } from '../../../shared/components/app_bar/CustomAppBar';
import { useProfileViewModel } from '../viewmodels/useProfileViewModel';
import { ProfileHeader } from './components/ProfileHeader';
import { AccountCard } from './components/AccountCard';
import { TransferLimitCard } from './components/TransferLimitCard';
import { BadgePreviewCard } from './components/BadgePreviewCard';

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { state, refresh, deleteAccount } = useProfileViewModel();

  if (state.status === 'idle' || state.status === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={AppColorStyles.yellow} />
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{state.message}</Text>
        <TouchableOpacity onPress={refresh} style={styles.retryButton}>
          <Text style={styles.retryText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { profile } = state;
  const representativeAccount = profile.accounts[0];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <CustomAppBar
        title="프로필"
        centerTitle={false}
        showBackButton={false}
        showDivider
        backgroundColor={AppColorStyles.background}
        actions={[
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => navigation.navigate('Settings')}
          >
            <MaterialDesignIcons name="cog-outline" size={24} color={AppColorStyles.black} />
          </TouchableOpacity>,
        ]}
      />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader profile={profile} />
        {representativeAccount && <AccountCard account={representativeAccount} onDelete={deleteAccount} />}
        <TransferLimitCard transferLimit={profile.transferLimit} />
        <BadgePreviewCard badges={profile.badges} />
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
    backgroundColor: AppColorStyles.background,
  },
  content: {
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColorStyles.background,
  },
  errorText: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 14, color: AppColorStyles.textHint }),
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: AppColorStyles.yellow,
    borderRadius: 8,
  },
  retryText: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 14, color: AppColorStyles.black }),
  },
});
