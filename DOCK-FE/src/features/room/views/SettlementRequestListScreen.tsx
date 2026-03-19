import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RoomStackParamList } from '@core/navigation/types';
import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle, PretendardTextStyle } from '@core/theme/typography';
import { CustomAppBar } from '@shared/components/app_bar/CustomAppBar';
import { FilledButton } from '@shared/components/buttons/FilledButton';
import { OutlineButton } from '@shared/components/buttons/OutlineButton';

import { useSettlementRequestListViewModel } from '../viewmodels/useSettlementRequestListViewModel';

const BASE_WIDTH = 412;

type Nav = NativeStackNavigationProp<RoomStackParamList, 'SettlementRequestList'>;
type ScreenRoute = RouteProp<RoomStackParamList, 'SettlementRequestList'>;

const toWon = (value: number) => `${value.toLocaleString('ko-KR')}원`;

export function SettlementRequestListScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, 430);
  const s = contentWidth / BASE_WIDTH;

  const {
    data,
    participants,
    isTreasurer,
    selectedPendingId,
    canDirectComplete,
    togglePendingParticipant,
  } = useSettlementRequestListViewModel(route.params.roomId);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.inner, { paddingHorizontal: 21 * s }]}> 
        <CustomAppBar
          title=""
          centerTitle={false}
          showDivider
          backgroundColor={AppColorStyles.background}
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: isTreasurer ? 24 * s : 40 * s },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.summaryCard,
              {
                borderRadius: 10 * s,
                padding: 14 * s,
                marginTop: 18 * s,
              },
            ]}
          >
            <Text
              style={[
                styles.requesterText,
                { fontSize: 16 * s, lineHeight: 16 * s },
              ]}
            >
              {data.requesterName}님 정산 요청
            </Text>
            <View style={styles.summaryMainRow}>
              <Text
                style={[
                  styles.storeText,
                  { fontSize: 24 * s, lineHeight: 24 * s },
                ]}
              >
                {data.storeName}
              </Text>
              <Text
                style={[
                  styles.totalAmountText,
                  { fontSize: 24 * s, lineHeight: 24 * s },
                ]}
              >
                {toWon(data.totalAmount)}
              </Text>
            </View>
            <Text
              style={[
                styles.summarySubText,
                { fontSize: 12 * s, lineHeight: 12 * s },
              ]}
            >
              {data.joinedSummary}
            </Text>
          </View>

          <View style={[styles.participantsHeaderRow, { marginTop: 28 * s }]}> 
            <Text
              style={[
                styles.sectionTitle,
                { fontSize: 16 * s, lineHeight: 16 * s },
              ]}
            >
              참여 인원
            </Text>
            {isTreasurer && (
              <Pressable
                style={[
                  styles.quickCompleteButton,
                  {
                    borderRadius: 6 * s,
                    height: 24 * s,
                    paddingHorizontal: 16 * s,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.quickCompleteText,
                    { fontSize: 13 * s, lineHeight: 16 * s },
                  ]}
                >
                  직접 완료하기
                </Text>
              </Pressable>
            )}
          </View>

          <View style={{ marginTop: 12 * s }}>
            {participants.map((participant) => {
              const isPending = participant.status === 'PENDING';
              const isSelectedPending =
                isPending && selectedPendingId === participant.id;
              const displayName = participant.isMe
                ? `${participant.name} (나)`
                : participant.name;

              return (
                <View
                  key={participant.id}
                  style={[styles.participantRow, { paddingVertical: 7 * s }]}
                >
                  <View
                    style={[
                      styles.avatarWrap,
                      {
                        width: 34 * s,
                        height: 34 * s,
                        borderRadius: 17 * s,
                      },
                    ]}
                  >
                    <MaterialDesignIcons
                      name="account-outline"
                      size={24 * s}
                      color={AppColorStyles.gray2}
                    />
                  </View>

                  <View style={styles.participantTextWrap}>
                    <Text
                      style={[
                        styles.participantName,
                        { fontSize: 16 * s, lineHeight: 16 * s },
                        !isTreasurer && participant.isMe
                          ? { color: AppColorStyles.gray2 }
                          : null,
                      ]}
                    >
                      {displayName}
                    </Text>
                    <Text
                      style={[
                        styles.participantAmount,
                        { fontSize: 16 * s, lineHeight: 16 * s },
                      ]}
                    >
                      {toWon(participant.amount)}
                    </Text>
                  </View>

                  <View style={styles.participantStatusWrap}>
                    {isPending ? (
                      isTreasurer ? (
                        <Pressable
                          onPress={() => togglePendingParticipant(participant.id)}
                          style={[
                            styles.checkBox,
                            {
                              width: 17 * s,
                              height: 17 * s,
                              borderRadius: 4 * s,
                            },
                            isSelectedPending
                              ? styles.checkBoxChecked
                              : styles.checkBoxUnchecked,
                          ]}
                        >
                          {isSelectedPending && (
                            <MaterialDesignIcons
                              name="check"
                              size={12 * s}
                              color={AppColorStyles.white}
                            />
                          )}
                        </Pressable>
                      ) : (
                        <Text
                          style={[
                            styles.pendingText,
                            { fontSize: 12 * s, lineHeight: 12 * s },
                          ]}
                        >
                          미완료
                        </Text>
                      )
                    ) : (
                      <Text
                        style={[
                          styles.completedText,
                          { fontSize: 12 * s, lineHeight: 12 * s },
                        ]}
                      >
                        완료
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          <View
            style={[
              styles.myAmountCard,
              {
                marginTop: 20 * s,
                height: 44 * s,
                borderRadius: 10 * s,
                paddingHorizontal: 14 * s,
              },
            ]}
          >
            <Text
              style={[
                styles.myAmountLabel,
                { fontSize: 16 * s, lineHeight: 16 * s },
              ]}
            >
              내 부담금
            </Text>
            <Text
              style={[
                styles.myAmountValue,
                { fontSize: 16 * s, lineHeight: 16 * s },
              ]}
            >
              {toWon(data.myAmount)}
            </Text>
          </View>

          {isTreasurer ? (
            <View style={[styles.ctaRow, { marginTop: 46 * s, gap: 20 * s }]}> 
              <FilledButton
                text="취소하기"
                onPress={() => navigation.goBack()}
                isFullWidth={false}
                width={175 * s}
                height={60 * s}
                textStyle={PretendardTextStyle.bold({
                  fontSize: 20 * s,
                  lineHeight: 28 * s,
                  color: AppColorStyles.black,
                })}
              />
              <OutlineButton
                text="직접 완료하기"
                onPress={canDirectComplete ? () => {} : undefined}
                isFullWidth={false}
                width={175 * s}
                height={60 * s}
                borderColor={AppColorStyles.yellow}
                textStyle={PretendardTextStyle.bold({
                  fontSize: 20 * s,
                  lineHeight: 28 * s,
                  color: AppColorStyles.black,
                })}
              />
            </View>
          ) : (
            <Text
              style={[
                styles.memberGuideText,
                { marginTop: 24 * s, fontSize: 16 * s, lineHeight: 20 * s },
              ]}
            >
              정산이 완료되지 않았습니다!{`\n`}정산을 진행해 주세요
            </Text>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColorStyles.background,
  },
  inner: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 430,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
  },
  summaryCard: {
    backgroundColor: AppColorStyles.surface,
    shadowColor: '#676767',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  requesterText: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 14, color: AppColorStyles.gray2 }),
  },
  summaryMainRow: {
    marginTop: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storeText: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 14, color: AppColorStyles.black }),
  },
  totalAmountText: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 14, color: AppColorStyles.black }),
  },
  summarySubText: {
    marginTop: 13,
    ...KBODiaGothicTextStyle.medium({ fontSize: 14, color: AppColorStyles.gray3 }),
  },
  participantsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 14, color: AppColorStyles.black }),
  },
  quickCompleteButton: {
    backgroundColor: AppColorStyles.yellow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickCompleteText: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 14,
      color: AppColorStyles.black,
      letterSpacing: 0.5,
    }),
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    backgroundColor: '#F9F9F9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#676767',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  participantTextWrap: {
    marginLeft: 14,
    flex: 1,
  },
  participantName: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 14, color: AppColorStyles.black }),
  },
  participantAmount: {
    marginTop: 4,
    ...KBODiaGothicTextStyle.medium({ fontSize: 14, color: AppColorStyles.gray2 }),
  },
  participantStatusWrap: {
    minWidth: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  completedText: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 14, color: '#383838' }),
  },
  pendingText: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 14, color: AppColorStyles.gray3 }),
  },
  checkBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxChecked: {
    backgroundColor: AppColorStyles.gray1,
  },
  checkBoxUnchecked: {
    backgroundColor: AppColorStyles.white,
    borderWidth: 1,
    borderColor: AppColorStyles.gray2,
  },
  myAmountCard: {
    backgroundColor: AppColorStyles.yellowLight,
    shadowColor: '#676767',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  myAmountLabel: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 14, color: AppColorStyles.gray3 }),
  },
  myAmountValue: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 14, color: AppColorStyles.black }),
  },
  ctaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  memberGuideText: {
    textAlign: 'center',
    ...KBODiaGothicTextStyle.medium({ fontSize: 14, color: AppColorStyles.gray1 }),
  },
});