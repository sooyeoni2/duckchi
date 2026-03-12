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

import { AppColorStyles } from '../../../core/theme/colors';
import { KBODiaGothicTextStyle } from '../../../core/theme/typography';
import { useProfileViewModel } from '../viewmodels/useProfileViewModel';
import { ProfileHeader } from './components/ProfileHeader';
import { AccountCard } from './components/AccountCard';
import { TransferLimitCard } from './components/TransferLimitCard';
import { BadgePreviewCard } from './components/BadgePreviewCard';

export function ProfileScreen() {
  const { state, refresh } = useProfileViewModel();

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
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.appBar}>
          <Text style={styles.appBarTitle}>프로필</Text>
          <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialDesignIcons name="cog-outline" size={24} color={AppColorStyles.black} />
          </TouchableOpacity>
        </View>
        <View style={styles.divider} />

        <ProfileHeader profile={profile} />
        {representativeAccount && <AccountCard account={representativeAccount} />}
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
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  appBarTitle: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 20, color: AppColorStyles.black }),
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: AppColorStyles.gray3,
    borderStyle: 'dashed',
    marginHorizontal: 2,
  },
});
