import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle, PretendardTextStyle } from '@core/theme/typography';

import type { ReportCategoryData } from '../models/reportTypes';
import { useReportViewModel } from '../viewmodels/useReportViewModel';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const s = SCREEN_WIDTH / 412;

const PIE_SIZE = 108 * s;
const PIE_RADIUS = PIE_SIZE / 2;
const PIE_SEGMENTS = 180;
const PIE_SEGMENT_WIDTH = Math.max(2 * s, 1.5);

const formatCurrency = (value: number) => `${value.toLocaleString('ko-KR')}원`;

const buildPieSegments = (categories: ReportCategoryData[]) => {
  const total = categories.reduce((sum, category) => sum + category.amount, 0);
  if (total <= 0) {
    return [] as Array<{ color: string; angle: number }>;
  }

  const rawCounts = categories.map((category) => (category.amount / total) * PIE_SEGMENTS);
  const floored = rawCounts.map((value) => Math.floor(value));
  let remaining = PIE_SEGMENTS - floored.reduce((sum, value) => sum + value, 0);

  const indexedRemainders = rawCounts
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder);

  const segmentCounts = [...floored];
  for (let i = 0; i < indexedRemainders.length && remaining > 0; i += 1) {
    segmentCounts[indexedRemainders[i].index] += 1;
    remaining -= 1;
  }

  const segmentColors = segmentCounts.flatMap((count, index) =>
    Array.from({ length: count }, () => categories[index].color),
  );

  return segmentColors.map((color, index) => ({
    color,
    angle: (360 / PIE_SEGMENTS) * index - 90,
  }));
};

const formatDiffLabel = (value: number) =>
  `▲ 전월 대비 ${value >= 0 ? '+' : ''}${value.toLocaleString('ko-KR')}`;

const EmptyCard = ({ message }: { message: string }) => (
  <View style={styles.emptyCard}>
    <Text style={styles.emptyText}>{message}</Text>
  </View>
);

export function ReportScreen() {
  const {
    status,
    errorMessage,
    reportData,
    canGoPrev,
    canGoNext,
    reload,
    goPrevMonth,
    goNextMonth,
  } = useReportViewModel();

  useEffect(() => {
    void reload();
  }, [reload]);

  const categories = reportData?.categories ?? [];
  const pieSegments = React.useMemo(() => buildPieSegments(categories), [categories]);
  const monthLabel = reportData?.month.label ?? '----년 --월';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>소비 리포트</Text>
      </View>
      <View style={styles.headerDivider} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.monthSelectorRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={!canGoPrev}
            onPress={() => {
              void goPrevMonth();
            }}
            style={styles.monthArrowButton}
          >
            <MaterialDesignIcons
              name="chevron-left"
              size={24 * s}
              color={canGoPrev ? AppColorStyles.black : AppColorStyles.gray2}
            />
          </TouchableOpacity>

          <Text style={styles.monthLabel}>{monthLabel}</Text>

          <TouchableOpacity
            activeOpacity={0.8}
            disabled={!canGoNext}
            onPress={() => {
              void goNextMonth();
            }}
            style={styles.monthArrowButton}
          >
            <MaterialDesignIcons
              name="chevron-right"
              size={24 * s}
              color={canGoNext ? AppColorStyles.black : AppColorStyles.gray2}
            />
          </TouchableOpacity>
        </View>

        {status === 'error' && errorMessage != null ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>조회 실패</Text>
            <Text style={styles.noticeMessage}>{errorMessage}</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                void reload();
              }}
              style={styles.noticeRetryButton}
            >
              <Text style={styles.noticeRetryText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {status === 'loading' && reportData == null ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeMessage}>리포트를 불러오는 중입니다.</Text>
          </View>
        ) : null}

        {reportData != null ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardSubLabel}>이달 총 지출</Text>
              <Text style={styles.totalSpendText}>{formatCurrency(reportData.totalSpend)}</Text>
              <View style={styles.compareChip}>
                <Text style={styles.compareChipText}>
                  {formatDiffLabel(reportData.monthlyDiff)}
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>지출 비율</Text>
              <View style={styles.categoryChartRow}>
                <View style={styles.pieBox}>
                  <View style={styles.pieBase}>
                    {pieSegments.map((segment, index) => (
                      <View
                        key={`${segment.color}-${index}`}
                        style={[
                          styles.pieSegmentWrap,
                          {
                            left: PIE_RADIUS,
                            top: PIE_RADIUS,
                            transform: [{ rotate: `${segment.angle}deg` }],
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.pieSegmentBar,
                            {
                              backgroundColor: segment.color,
                              left: -PIE_SEGMENT_WIDTH / 2,
                              top: -PIE_RADIUS,
                            },
                          ]}
                        />
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.legendColumn}>
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <View key={category.name} style={styles.legendRow}>
                        <View
                          style={[styles.legendDot, { backgroundColor: category.color }]}
                        />
                        <Text style={styles.legendLabel}>{category.name}</Text>
                        <Text style={styles.legendValue}>{`${category.percentage}%`}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyInlineText}>카테고리 데이터가 없습니다.</Text>
                  )}
                </View>
              </View>

              <Text style={styles.topTagCaption}>이달 가장 많이 쓴 모임 태그</Text>
              <Text style={styles.topTagValue}>{reportData.topCategoryName}</Text>
              <View style={styles.compareChip}>
                <Text style={styles.compareChipText}>
                  {formatDiffLabel(reportData.topCategoryDiff)}
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>지출 상세내역</Text>
              <View style={styles.listGroup}>
                {categories.length > 0 ? (
                  categories.map((category) => {
                    const ratio = category.percentage / 100;

                    return (
                      <View key={`detail-${category.name}`} style={styles.detailRowCard}>
                        <View style={styles.detailRowTop}>
                          <Text style={styles.detailName}>{category.name}</Text>
                          <Text style={styles.detailAmount}>
                            {formatCurrency(category.amount)}
                          </Text>
                        </View>
                        <View style={styles.detailBarTrack}>
                          <View
                            style={[
                              styles.detailBarFill,
                              {
                                width: `${Math.max(ratio * 100, 8)}%`,
                                backgroundColor: category.color,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.detailCountText}>{`${category.count}건`}</Text>
                      </View>
                    );
                  })
                ) : (
                  <EmptyCard message="지출 상세내역이 없습니다." />
                )}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>모임별 소비 랭킹</Text>
              <View style={styles.listGroup}>
                {reportData.amountRanking.length > 0 ? (
                  reportData.amountRanking.map((item, index) => (
                    <View
                      key={`amount-rank-${item.roomName}-${index}`}
                      style={styles.rankRow}
                    >
                      <View style={styles.rankLeft}>
                        <MaterialDesignIcons
                          name="medal"
                          size={22 * s}
                          color={index === 0 ? '#F4B63E' : index === 1 ? '#7FB7DE' : '#F08A35'}
                        />
                        <Text style={styles.rankOrder}>{index + 1}</Text>
                        <Text style={styles.rankRoomName}>{item.roomName}</Text>
                      </View>
                      <Text style={styles.rankValue}>{formatCurrency(item.amount)}</Text>
                    </View>
                  ))
                ) : (
                  <EmptyCard message="소비 랭킹 데이터가 없습니다." />
                )}
              </View>
            </View>

            <View style={[styles.card, styles.lastCard]}>
              <Text style={styles.sectionTitle}>모임별 빈도 랭킹</Text>
              <View style={styles.listGroup}>
                {reportData.frequencyRanking.length > 0 ? (
                  reportData.frequencyRanking.map((item, index) => (
                    <View key={`freq-rank-${item.roomName}-${index}`} style={styles.rankRow}>
                      <View style={styles.rankLeft}>
                        <MaterialDesignIcons
                          name="medal"
                          size={22 * s}
                          color={index === 0 ? '#F4B63E' : index === 1 ? '#7FB7DE' : '#F08A35'}
                        />
                        <Text style={styles.rankOrder}>{index + 1}</Text>
                        <View>
                          <Text style={styles.rankRoomName}>{item.roomName}</Text>
                          {item.tag.length > 0 ? (
                            <Text style={styles.rankTag}>{item.tag}</Text>
                          ) : null}
                        </View>
                      </View>
                      <Text style={styles.rankValue}>{`${item.count}회`}</Text>
                    </View>
                  ))
                ) : (
                  <EmptyCard message="빈도 랭킹 데이터가 없습니다." />
                )}
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColorStyles.background,
  },
  header: {
    paddingHorizontal: 20 * s,
    paddingTop: 12 * s,
    paddingBottom: 10 * s,
  },
  headerTitle: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 30 * s,
      lineHeight: 36 * s,
      color: AppColorStyles.black,
    }),
  },
  headerDivider: {
    borderBottomWidth: 1,
    borderBottomColor: AppColorStyles.gray3,
    borderStyle: 'dashed',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20 * s,
    paddingVertical: 14 * s,
    paddingBottom: 112 * s,
    gap: 12 * s,
  },
  monthSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6 * s,
  },
  monthArrowButton: {
    width: 34 * s,
    height: 34 * s,
    borderRadius: 17 * s,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 30 * s,
      lineHeight: 34 * s,
      color: AppColorStyles.black,
    }),
  },
  noticeCard: {
    backgroundColor: AppColorStyles.surface,
    borderRadius: 12 * s,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    paddingHorizontal: 14 * s,
    paddingVertical: 12 * s,
  },
  noticeTitle: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 16 * s,
      lineHeight: 20 * s,
      color: AppColorStyles.black,
    }),
  },
  noticeMessage: {
    marginTop: 4 * s,
    ...PretendardTextStyle.medium({
      fontSize: 13 * s,
      lineHeight: 18 * s,
      color: AppColorStyles.textSecondary,
    }),
  },
  noticeRetryButton: {
    marginTop: 10 * s,
    alignSelf: 'flex-start',
    backgroundColor: AppColorStyles.yellow,
    borderRadius: 8 * s,
    paddingHorizontal: 12 * s,
    paddingVertical: 6 * s,
  },
  noticeRetryText: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 13 * s,
      lineHeight: 16 * s,
      color: AppColorStyles.black,
    }),
  },
  card: {
    backgroundColor: AppColorStyles.surface,
    borderRadius: 14 * s,
    paddingHorizontal: 14 * s,
    paddingVertical: 14 * s,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
  },
  lastCard: {
    marginBottom: 8 * s,
  },
  cardSubLabel: {
    ...PretendardTextStyle.medium({
      fontSize: 13 * s,
      lineHeight: 18 * s,
      color: AppColorStyles.textHint,
    }),
  },
  totalSpendText: {
    marginTop: 6 * s,
    ...KBODiaGothicTextStyle.bold({
      fontSize: 35 * s,
      lineHeight: 40 * s,
      color: AppColorStyles.black,
    }),
  },
  compareChip: {
    alignSelf: 'flex-start',
    marginTop: 10 * s,
    backgroundColor: '#F5F1DE',
    borderRadius: 10 * s,
    paddingHorizontal: 10 * s,
    paddingVertical: 4 * s,
  },
  compareChipText: {
    ...PretendardTextStyle.medium({
      fontSize: 12 * s,
      lineHeight: 16 * s,
      color: '#FF2E2E',
    }),
  },
  sectionTitle: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 20 * s,
      lineHeight: 24 * s,
      color: AppColorStyles.black,
    }),
  },
  categoryChartRow: {
    marginTop: 10 * s,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pieBox: {
    width: PIE_SIZE,
    height: PIE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieBase: {
    width: PIE_SIZE,
    height: PIE_SIZE,
    borderRadius: PIE_RADIUS,
    backgroundColor: '#EFEFEF',
    position: 'relative',
    overflow: 'hidden',
  },
  pieSegmentWrap: {
    position: 'absolute',
    width: 0,
    height: 0,
  },
  pieSegmentBar: {
    position: 'absolute',
    width: PIE_SEGMENT_WIDTH,
    height: PIE_RADIUS,
    borderRadius: 999,
  },
  legendColumn: {
    flex: 1,
    marginLeft: 16 * s,
    gap: 10 * s,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8 * s,
    height: 8 * s,
    borderRadius: 4 * s,
    marginRight: 8 * s,
  },
  legendLabel: {
    width: 50 * s,
    ...PretendardTextStyle.medium({
      fontSize: 13 * s,
      lineHeight: 18 * s,
      color: AppColorStyles.textSecondary,
    }),
  },
  legendValue: {
    marginLeft: 4 * s,
    ...KBODiaGothicTextStyle.medium({
      fontSize: 17 * s,
      lineHeight: 20 * s,
      color: AppColorStyles.black,
    }),
  },
  topTagCaption: {
    marginTop: 14 * s,
    ...PretendardTextStyle.medium({
      fontSize: 12 * s,
      lineHeight: 16 * s,
      color: AppColorStyles.textHint,
    }),
  },
  topTagValue: {
    marginTop: 4 * s,
    ...KBODiaGothicTextStyle.bold({
      fontSize: 26 * s,
      lineHeight: 30 * s,
      color: AppColorStyles.black,
    }),
  },
  listGroup: {
    marginTop: 10 * s,
    gap: 8 * s,
  },
  detailRowCard: {
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    borderRadius: 10 * s,
    paddingHorizontal: 10 * s,
    paddingVertical: 10 * s,
  },
  detailRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailName: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 18 * s,
      lineHeight: 20 * s,
      color: AppColorStyles.black,
    }),
  },
  detailAmount: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 20 * s,
      lineHeight: 24 * s,
      color: AppColorStyles.black,
    }),
  },
  detailBarTrack: {
    marginTop: 8 * s,
    height: 6 * s,
    backgroundColor: '#EFEFEF',
    borderRadius: 999,
    overflow: 'hidden',
  },
  detailBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  detailCountText: {
    marginTop: 4 * s,
    ...PretendardTextStyle.medium({
      fontSize: 10 * s,
      lineHeight: 14 * s,
      color: AppColorStyles.textHint,
    }),
  },
  rankRow: {
    minHeight: 54 * s,
    borderRadius: 10 * s,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    backgroundColor: AppColorStyles.surface,
    paddingHorizontal: 10 * s,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6 * s,
    flex: 1,
    marginRight: 10 * s,
  },
  rankOrder: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 13 * s,
      lineHeight: 16 * s,
      color: AppColorStyles.gray1,
    }),
  },
  rankRoomName: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 19 * s,
      lineHeight: 22 * s,
      color: AppColorStyles.black,
    }),
  },
  rankTag: {
    ...PretendardTextStyle.medium({
      fontSize: 11 * s,
      lineHeight: 14 * s,
      color: AppColorStyles.textHint,
    }),
  },
  rankValue: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 24 * s,
      lineHeight: 28 * s,
      color: AppColorStyles.black,
    }),
  },
  emptyCard: {
    borderRadius: 10 * s,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    backgroundColor: AppColorStyles.surface,
    paddingVertical: 16 * s,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...PretendardTextStyle.medium({
      fontSize: 13 * s,
      lineHeight: 18 * s,
      color: AppColorStyles.textHint,
    }),
  },
  emptyInlineText: {
    ...PretendardTextStyle.medium({
      fontSize: 13 * s,
      lineHeight: 18 * s,
      color: AppColorStyles.textHint,
    }),
  },
});
