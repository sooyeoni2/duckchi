import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomAppBar } from '@shared/components/app_bar/CustomAppBar';
import { FilledButton } from '@shared/components/buttons/FilledButton';
import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle, PretendardTextStyle } from '@core/theme/typography';
import type { RootStackParamList } from '@core/navigation/types';

type PlaceholderRoute = RouteProp<RootStackParamList, 'NotificationPlaceholder'>;

export function NotificationPlaceholderScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<PlaceholderRoute>();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <CustomAppBar
        title="알림 안내"
        centerTitle={false}
        showDivider
        backgroundColor={AppColorStyles.background}
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>{route.params.title}</Text>
          <Text style={styles.description}>{route.params.description}</Text>
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <FilledButton text="확인" onPress={() => navigation.goBack()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColorStyles.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  card: {
    borderRadius: 20,
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    padding: 24,
    gap: 14,
  },
  title: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 22 }),
    color: AppColorStyles.black,
  },
  description: {
    ...PretendardTextStyle.medium({
      fontSize: 15,
      lineHeight: 23,
      color: AppColorStyles.textSecondary,
    }),
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 8,
  },
});
