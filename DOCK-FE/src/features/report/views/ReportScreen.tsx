import React, { useEffect, useState, useMemo } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle, PretendardTextStyle } from '@core/theme/typography';
import { CustomAppBar } from '@shared/components/app_bar/CustomAppBar';
import { useReportViewModel } from '../viewmodels/useReportViewModel';
import { SpendingDonutChart } from './components/SpendingDonutChart';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const s = SCREEN_WIDTH / 412;

// 차트 크기 조정
const PIE_SIZE = 180 * s;
const STROKE_WIDTH = 28 * s;

const formatCurrency = (value: number | undefined | null) => `${(value ?? 0).toLocaleString('ko-KR')}원`;

const EmptyCard = ({ message }: { message: string }) => (
  <View style={styles.noticeCard}>
    <Text style={styles.noticeMessage}>{message}</Text>
  </View>
);

export function ReportScreen() {
  const {
    status,
    errorMessage,
    reportData,
    reload,
    canGoPrev,
    canGoNext,
    goPrevMonth,
    goNextMonth,
  } = useReportViewModel();

  const [popupVisible, setPopupVisible] = useState(false);
  const [popupContent] = useState('');
  const [rankingMode, setRankingMode] = useState<'amount' | 'frequency'>('amount');

  useEffect(() => {
    void reload();
  }, [reload]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const categories = reportData?.categories ?? [];
  const sortedCategories = useMemo(() => [...categories].sort((a, b) => b.amount - a.amount), [categories]);
  const monthLabel = reportData?.month.label ?? '----년 --월';

  const currentRankList = useMemo(() => {
    if (!reportData) return [];
    return rankingMode === 'amount' ? reportData.amountRanking : reportData.frequencyRanking;
  }, [rankingMode, reportData]);

  const top3 = currentRankList.slice(0, 3);
  const others = currentRankList.slice(3);
  const maxVal = currentRankList.length > 0
    ? (rankingMode === 'amount' ? ((currentRankList[0] as any).amount ?? (currentRankList[0] as any).totalAmount) : (currentRankList[0] as any).count)
    : 1;
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <CustomAppBar
        title="소비 리포트"
        centerTitle={false}
        showBackButton={false}
        showDivider
        backgroundColor={AppColorStyles.background}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.monthSelector}>
          <TouchableOpacity style={styles.monthNavBtn} onPress={goPrevMonth} disabled={!canGoPrev}>
            <Text style={{ fontSize: 24 * s, color: canGoPrev ? '#333' : '#CCC' }}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <TouchableOpacity style={styles.monthNavBtn} onPress={goNextMonth} disabled={!canGoNext}>
            <Text style={{ fontSize: 24 * s, color: canGoNext ? '#333' : '#CCC' }}>{'>'}</Text>
          </TouchableOpacity>
        </View>

        {status === 'loading' ? (
          <EmptyCard message="데이터를 불러오는 중입니다..." />
        ) : status === 'error' ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>오류가 발생했습니다</Text>
            <Text style={styles.noticeMessage}>{errorMessage}</Text>
            <TouchableOpacity style={styles.noticeRetryButton} onPress={reload}>
              <Text style={styles.noticeRetryText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        ) : reportData ? (
          <View style={{ gap: 16 * s }}>

            {/* 총 지출 요약 */}
            <View style={styles.mainCard}>
              <Text style={styles.cardSubLabel}>이번 달 총 지출</Text>
              <Text style={styles.totalSpendText}>{formatCurrency(reportData.totalSpend)}</Text>
              <View style={[styles.compareChip, { backgroundColor: (reportData.monthlyDiff ?? 0) >= 0 ? '#FFFBEA' : '#F5F9FF' }]}>
                <Text style={[styles.compareChipText, { color: (reportData.monthlyDiff ?? 0) >= 0 ? '#F8312F' : '#4D8FFF' }]}>
                  전월 대비 {(reportData.monthlyDiff ?? 0) >= 0 ? '+' : ''} {(reportData.monthlyDiff ?? 0).toLocaleString()}원
                </Text>
              </View>
            </View>

            {/* 이번 달 주요 인사이트 (NEW) */}
            {reportData.topCategoryName !== '-' && (
              <View style={styles.insightCard}>
                <View style={[styles.insightIcon, { backgroundColor: sortedCategories[0]?.color ?? AppColorStyles.yellow }]}>
                  <Text style={styles.insightIconText}>💡</Text>
                </View>
                <View style={styles.insightTextContainer}>
                  <Text style={styles.insightTitle}>가장 많이 소비한 카테고리</Text>
                  <Text style={styles.insightTopCategory}>이번 달은 <Text style={{ color: sortedCategories[0]?.color ?? AppColorStyles.black }}>{reportData.topCategoryName}</Text>에 가장 많은 진심을 쏟으셨네요!</Text>
                </View>
              </View>
            )}

            {/* 비율 분석: 시각적 계층 구조 재배치 적용 */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>카테고리별 분석</Text>

              <View style={styles.analysisContainer}>
                {/* 커스텀 애니메이션 도넛 차트 적용 */}
                <View style={styles.pieWrapper}>
                  <SpendingDonutChart
                    size={PIE_SIZE}
                    strokeWidth={STROKE_WIDTH}
                    categories={categories}
                    totalAmount={reportData.totalSpend}
                  />
                </View>

                {/* 우측 범례 (간소화) */}
                <View style={styles.rightLegend}>
                  {categories.slice(0, 5).map((cat, idx) => (
                    <View key={`legend-${idx}`} style={styles.legendRow}>
                      <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.legendLabel} numberOfLines={1}>{cat.name}</Text>
                        <Text style={styles.legendPercText}>{cat.percentage}%</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* 지출 상세내역 리스트 (금액/횟수는 하단에서 충분한 공간 확보) */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>지출 상세내역</Text>
              <View style={styles.detailList}>
                {sortedCategories.map((cat, idx) => (
                  <View key={`detail-${idx}`} style={styles.detailItem}>
                    <View style={styles.detailNameRow}>
                      <View style={[styles.detailDot, { backgroundColor: cat.color }]} />
                      <Text style={styles.detailName}>{cat.name}</Text>
                    </View>
                    <View style={styles.detailRight}>
                      <View style={styles.detailStats}>
                        <Text style={styles.detailAmount}>{formatCurrency(cat.amount)}</Text>
                        <Text style={styles.detailCount}>({cat.count}회)</Text>
                      </View>
                      {cat.monthlyDiff !== undefined && (
                        <View style={[styles.miniCompareChip, { backgroundColor: cat.monthlyDiff >= 0 ? '#FFF1F1' : '#F1F7FF' }]}>
                          <Text style={[styles.miniCompareChipText, { color: cat.monthlyDiff >= 0 ? '#F8312F' : '#4D8FFF' }]}>
                            {cat.monthlyDiff >= 0 ? '▲' : '▼'} {Math.abs(cat.monthlyDiff).toLocaleString()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* 모임방 랭킹 (포디움 + 게이지 리스트) */}
            <View style={[styles.card, { marginBottom: 40 * s }]}>
              <View style={styles.rankingHeader}>
                <Text style={styles.sectionTitle}>모임방 랭킹</Text>
                <View style={styles.rankingTabBox}>
                  <TouchableOpacity
                    style={[styles.rankingTab, rankingMode === 'amount' && styles.rankingTabActive]}
                    onPress={() => setRankingMode('amount')}
                  >
                    <Text style={[styles.rankingTabText, rankingMode === 'amount' && styles.rankingTabTextActive]}>지출액</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rankingTab, rankingMode === 'frequency' && styles.rankingTabActive]}
                    onPress={() => setRankingMode('frequency')}
                  >
                    <Text style={[styles.rankingTabText, rankingMode === 'frequency' && styles.rankingTabTextActive]}>빈도</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {currentRankList.length > 0 ? (
                <>
                  {/* 포디움 섹션 (Top 3) */}
                  <View style={styles.podiumContainer}>
                    {/* 2위 (왼쪽) */}
                    {top3[1] && (
                      <View style={styles.podiumColumn}>
                        <Text style={styles.podiumRoomName} numberOfLines={1}>{top3[1].roomName}</Text>
                        <View style={[styles.podiumBar, { height: 60 * s, backgroundColor: '#E5E7EB' }]}>
                          <Text style={styles.podiumRankText}>2</Text>
                        </View>
                        <Text style={styles.podiumValueText}>
                          {rankingMode === 'amount' ? formatCurrency((top3[1] as any).amount) : `${(top3[1] as any).count}회`}
                        </Text>
                      </View>
                    )}
                    {/* 1위 (중앙) */}
                    {top3[0] && (
                      <View style={styles.podiumColumn}>
                        <Text style={styles.podiumIcon}>👑</Text>
                        <Text style={[styles.podiumRoomName, { fontWeight: 'bold' }]} numberOfLines={1}>{top3[0].roomName}</Text>
                        <View style={[styles.podiumBar, { height: 90 * s, backgroundColor: AppColorStyles.yellow }]}>
                          <Text style={styles.podiumRankText}>1</Text>
                        </View>
                        <Text style={[styles.podiumValueText, { color: AppColorStyles.black, fontWeight: 'bold' }]}>
                          {rankingMode === 'amount' ? formatCurrency((top3[0] as any).amount) : `${(top3[0] as any).count}회`}
                        </Text>
                      </View>
                    )}
                    {/* 3위 (오른쪽) */}
                    {top3[2] && (
                      <View style={styles.podiumColumn}>
                        <Text style={styles.podiumRoomName} numberOfLines={1}>{top3[2].roomName}</Text>
                        <View style={[styles.podiumBar, { height: 45 * s, backgroundColor: '#F3F4F6' }]}>
                          <Text style={styles.podiumRankText}>3</Text>
                        </View>
                        <Text style={styles.podiumValueText}>
                          {rankingMode === 'amount' ? formatCurrency((top3[2] as any).amount) : `${(top3[2] as any).count}회`}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* 4위 이하 리스트 (게이지 추가) */}
                  <View style={styles.rankList}>
                    {others.map((room: any, idx: number) => {
                      const val = rankingMode === 'amount' ? room.amount : room.count;
                      const ratio = val / maxVal;
                      return (
                        <View key={`rank-${idx + 3}`} style={styles.rankRow}>
                          <Text style={styles.rankOrderTextSmall}>{idx + 4}</Text>
                          <View style={styles.rankInfoBox}>
                            <View style={styles.rankNameRow}>
                              <Text style={styles.rankNameText} numberOfLines={1}>{room.roomName}</Text>
                              <Text style={styles.rankValueText}>
                                {rankingMode === 'amount' ? formatCurrency(room.amount) : `${room.count}회`}
                              </Text>
                            </View>
                            {/* 게이지 바 */}
                            <View style={styles.gaugeTrack}>
                              <View style={[styles.gaugeFill, { width: `${ratio * 100}%` }]} />
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </>
              ) : (
                <EmptyCard message="랭킹 데이터가 없습니다." />
              )}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* 모달 유지 */}
      <Modal animationType="fade" transparent visible={popupVisible} onRequestClose={() => setPopupVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setPopupVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>상세 명칭</Text>
            <Text style={styles.modalText}>{popupContent}</Text>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setPopupVisible(false)}>
              <Text style={styles.modalCloseText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColorStyles.background },
  scrollContainer: { paddingHorizontal: 16 * s, paddingBottom: 40 * s },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12 * s },
  monthNavBtn: { padding: 10 * s },
  monthLabel: { marginHorizontal: 20 * s, ...KBODiaGothicTextStyle.medium({ fontSize: 22 * s, color: AppColorStyles.black }) },

  mainCard: { backgroundColor: AppColorStyles.surface, borderRadius: 12 * s, padding: 20 * s, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardSubLabel: { ...PretendardTextStyle.medium({ fontSize: 13 * s, color: AppColorStyles.textHint }) },
  totalSpendText: { marginTop: 6 * s, ...KBODiaGothicTextStyle.bold({ fontSize: 28 * s, color: AppColorStyles.black }) },
  compareChip: { alignSelf: 'flex-start', marginTop: 10 * s, borderRadius: 8 * s, paddingHorizontal: 10 * s, paddingVertical: 4 * s },
  compareChipText: { ...PretendardTextStyle.medium({ fontSize: 13 * s }) },

  card: { backgroundColor: AppColorStyles.surface, borderRadius: 12 * s, padding: 20 * s, marginTop: 16 * s },
  sectionTitle: { ...KBODiaGothicTextStyle.medium({ fontSize: 18 * s, color: AppColorStyles.black }), marginBottom: 16 * s },

  analysisContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 * s },
  pieWrapper: { width: PIE_SIZE, height: PIE_SIZE, alignItems: 'center', justifyContent: 'center' },

  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16 * s,
    padding: 16 * s,
    marginTop: 8 * s,
    borderWidth: 1,
    borderColor: '#F1F3F5',
  },
  insightIcon: {
    width: 44 * s,
    height: 44 * s,
    borderRadius: 22 * s,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12 * s,
  },
  insightIconText: { fontSize: 20 * s },
  insightTextContainer: { flex: 1 },
  insightTitle: { ...PretendardTextStyle.medium({ fontSize: 13 * s, color: AppColorStyles.textHint }) },
  insightTopCategory: { ...KBODiaGothicTextStyle.medium({ fontSize: 15 * s, color: AppColorStyles.black }), marginTop: 2 * s },

  rightLegend: { flex: 1, marginLeft: 20 * s, gap: 10 * s },
  legendRow: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 8 * s, height: 8 * s, borderRadius: 4 * s, marginRight: 10 * s },
  legendLabel: { ...PretendardTextStyle.medium({ fontSize: 13 * s, color: AppColorStyles.textSecondary }) },
  legendPercText: { ...KBODiaGothicTextStyle.bold({ fontSize: 13 * s, color: AppColorStyles.black }) },

  detailList: { gap: 14 * s },
  detailItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12 * s, borderBottomWidth: 1, borderBottomColor: AppColorStyles.divider },
  detailNameRow: { flexDirection: 'row', alignItems: 'center' },
  detailDot: { width: 8 * s, height: 10 * s, borderRadius: 2 * s, marginRight: 8 * s },
  detailName: { ...PretendardTextStyle.medium({ fontSize: 15 * s, color: AppColorStyles.black }) },
  detailRight: { alignItems: 'flex-end', gap: 4 * s },
  detailStats: { flexDirection: 'row', alignItems: 'center', gap: 4 * s },
  detailAmount: { ...KBODiaGothicTextStyle.bold({ fontSize: 16 * s, color: AppColorStyles.black }) },
  detailCount: { ...PretendardTextStyle.medium({ fontSize: 12 * s, color: AppColorStyles.textSecondary }) },
  miniCompareChip: { borderRadius: 5 * s, paddingHorizontal: 6 * s, paddingVertical: 2 * s },
  miniCompareChipText: { ...PretendardTextStyle.medium({ fontSize: 11 * s }) },

  rankingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 * s },
  rankingTabBox: { flexDirection: 'row', backgroundColor: '#F1F3F5', borderRadius: 8 * s, padding: 2 * s },
  rankingTab: { paddingHorizontal: 10 * s, paddingVertical: 4 * s, borderRadius: 6 * s },
  rankingTabActive: { backgroundColor: '#FFF', elevation: 1 },
  rankingTabText: { ...PretendardTextStyle.medium({ fontSize: 12 * s, color: AppColorStyles.textHint }) },
  rankingTabTextActive: { color: AppColorStyles.black },

  rankList: { gap: 18 * s, marginTop: 10 * s },
  rankRow: { flexDirection: 'row', alignItems: 'center' },
  rankOrderTextSmall: {
    width: 24 * s,
    ...PretendardTextStyle.medium({ fontSize: 13 * s, color: AppColorStyles.textHint }),
  },
  rankInfoBox: { flex: 1, marginLeft: 8 * s },
  rankNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 * s },
  rankNameText: { ...PretendardTextStyle.medium({ fontSize: 14 * s, color: AppColorStyles.textPrimary }), flex: 1, marginRight: 8 * s },
  rankValueText: { ...KBODiaGothicTextStyle.bold({ fontSize: 14 * s, color: AppColorStyles.black }) },

  gaugeTrack: { height: 4 * s, backgroundColor: '#F3F4F6', borderRadius: 2 * s, overflow: 'hidden' },
  gaugeFill: { height: '100%', backgroundColor: AppColorStyles.yellow, borderRadius: 2 * s },

  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingVertical: 20 * s,
    marginBottom: 10 * s,
    gap: 12 * s,
  },
  podiumColumn: { flex: 1, alignItems: 'center' },
  podiumBar: {
    width: '100%',
    borderRadius: 8 * s,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8 * s,
    marginBottom: 8 * s,
  },
  podiumRankText: { ...KBODiaGothicTextStyle.bold({ fontSize: 18 * s, color: '#9CA3AF' }) },
  podiumIcon: { fontSize: 24 * s, marginBottom: 4 * s },
  podiumRoomName: { ...PretendardTextStyle.medium({ fontSize: 12 * s, color: AppColorStyles.textSecondary }), marginBottom: 4 * s, textAlign: 'center' },
  podiumValueText: { ...KBODiaGothicTextStyle.bold({ fontSize: 13 * s, color: AppColorStyles.textHint }), textAlign: 'center' },

  noticeCard: { backgroundColor: AppColorStyles.surface, borderRadius: 12 * s, padding: 20 * s, alignItems: 'center' },
  noticeTitle: { ...KBODiaGothicTextStyle.bold({ fontSize: 16 * s, color: AppColorStyles.black }) },
  noticeMessage: { marginTop: 4 * s, ...PretendardTextStyle.medium({ fontSize: 14 * s, color: AppColorStyles.textSecondary }) },
  noticeRetryButton: { marginTop: 12 * s, backgroundColor: AppColorStyles.yellow, paddingHorizontal: 16 * s, paddingVertical: 8 * s, borderRadius: 8 * s },
  noticeRetryText: { ...KBODiaGothicTextStyle.bold({ fontSize: 14 * s, color: AppColorStyles.black }) },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: SCREEN_WIDTH * 0.8, backgroundColor: AppColorStyles.surface, borderRadius: 20 * s, padding: 24 * s, alignItems: 'center' },
  modalTitle: { ...KBODiaGothicTextStyle.bold({ fontSize: 18 * s, color: AppColorStyles.black }), marginBottom: 12 * s },
  modalText: { ...PretendardTextStyle.medium({ fontSize: 16 * s, color: AppColorStyles.textPrimary }), textAlign: 'center' as const, marginBottom: 20 * s },
  modalCloseButton: { backgroundColor: AppColorStyles.yellow, paddingHorizontal: 24 * s, paddingVertical: 10 * s, borderRadius: 10 * s },
  modalCloseText: { ...KBODiaGothicTextStyle.bold({ fontSize: 14 * s, color: AppColorStyles.black }) },
});
