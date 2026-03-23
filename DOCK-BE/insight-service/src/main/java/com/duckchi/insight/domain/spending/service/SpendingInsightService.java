package com.duckchi.insight.domain.spending.service;

import com.duckchi.insight.domain.spending.dto.event.SettlementFinishedEvent;
import com.duckchi.insight.domain.spending.dto.response.CategorySpendResponse;
import com.duckchi.insight.domain.spending.dto.response.MonthlySummaryResponse;
import com.duckchi.insight.domain.spending.dto.response.MonthlyTrendResponse;
import com.duckchi.insight.domain.spending.dto.response.RoomSpendResponse;
import com.duckchi.insight.domain.spending.entity.SpendingLog;
import com.duckchi.insight.domain.spending.entity.UserMonthlySpend;
import com.duckchi.insight.domain.spending.repository.SpendingLogRepository;
import com.duckchi.insight.domain.spending.repository.UserMonthlySpendRepository;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SpendingInsightService {

    private final SpendingLogRepository spendingLogRepository;
    private final UserMonthlySpendRepository userMonthlySpendRepository;

    /**
     * 최근 6개월 소비 트렌드 조회 (AN-04)
     */
    @Transactional(readOnly = true)
    public List<MonthlyTrendResponse> getSpendingTrends(Long userId) {
        // 1. 최근 6개월(현재 포함) 목록 생성
        List<String> months = new ArrayList<>();
        LocalDate now = LocalDate.now();
        for (int i = 5; i >= 0; i--) {
            months.add(now.minusMonths(i).format(DateTimeFormatter.ofPattern("yyyy-MM")));
        }

        // 2. DB에서 존재하는 데이터 조회 (stat_type=TOTAL, stat_value=ALL)
        List<UserMonthlySpend> spends = userMonthlySpendRepository
                .findByUserIdAndStatTypeAndStatValueAndSpendMonthInOrderBySpendMonthAsc(
                        userId, "TOTAL", "ALL", months);

        // 3. 0원 보정 (데이터가 없는 달은 0원으로 리턴)
        Map<String, Integer> spendMap = spends.stream()
                .collect(Collectors.toMap(UserMonthlySpend::getSpendMonth, UserMonthlySpend::getTotalAmount));

        return months.stream()
                .map(m -> new MonthlyTrendResponse(m, spendMap.getOrDefault(m, 0)))
                .toList();
    }

    /**
     * 월간 지출 요약 조회 로직.
     * 이번 달 총 지출액과 이전 달 총 지출액을 비교함.
     */
    @Transactional(readOnly = true)
    public MonthlySummaryResponse getMonthlySummary(Long userId, String targetMonth) {
        // 이번 달 총액
        int currentTotal = getAmountOrDefault(userId, targetMonth, "TOTAL", "ALL");

        // 이전 달 계산 (yyyy-MM -> YearMonth 활용)
        String previousMonth = YearMonth.parse(targetMonth).minusMonths(1).toString();
        int previousTotal = getAmountOrDefault(userId, previousMonth, "TOTAL", "ALL");

        return new MonthlySummaryResponse(targetMonth, currentTotal, previousTotal, currentTotal - previousTotal);
    }

    /**
     * 카테고리별 지출 통계 조회 로직.
     * 각 카테고리가 해당 월 총 지출에서 차지하는 비중을 계산함.
     */
    @Transactional(readOnly = true)
    public List<CategorySpendResponse> getCategoryStatistics(Long userId, String targetMonth) {
        int totalAmount = getAmountOrDefault(userId, targetMonth, "TOTAL", "ALL");
        if (totalAmount == 0) return List.of();

        List<UserMonthlySpend> categorySpends = userMonthlySpendRepository
                .findAllByUserIdAndSpendMonthAndStatTypeOrderByTotalAmountDesc(userId, targetMonth, "CATEGORY");

        return categorySpends.stream()
                .map(s -> new CategorySpendResponse(
                        s.getStatValue(),
                        s.getTotalAmount(),
                        Math.round((s.getTotalAmount() / (double) totalAmount) * 1000.0) / 10.0 // 소수점 한자리
                ))
                .toList();
    }

    /**
     * 방별 지출 통계 조회 로직.
     * 방 ID로 통계 조회 후, 로그에서 가장 최근 방 이름을 찾아 매핑함.
     */
    @Transactional(readOnly = true)
    public List<RoomSpendResponse> getRoomStatistics(Long userId, String targetMonth) {
        List<UserMonthlySpend> roomSpends = userMonthlySpendRepository
                .findAllByUserIdAndSpendMonthAndStatTypeOrderByTotalAmountDesc(userId, targetMonth, "ROOM");

        return roomSpends.stream()
                .map(s -> {
                    Long roomId = Long.parseLong(s.getStatValue());
                    String roomName = spendingLogRepository
                            .findFirstByUserIdAndRoomIdOrderByRecordedAtDesc(userId, roomId)
                            .map(SpendingLog::getRoomName)
                            .orElse("알 수 없는 방");
                    return new RoomSpendResponse(roomId, roomName, s.getTotalAmount());
                })
                .toList();
    }

    private int getAmountOrDefault(Long userId, String month, String type, String value) {
        return userMonthlySpendRepository
                .findByUserIdAndSpendMonthAndStatTypeAndStatValue(userId, month, type, value)
                .map(UserMonthlySpend::getTotalAmount)
                .orElse(0);
    }

    /**
     * 정산 완료 이벤트를 처리하여 로그를 남기고 월간 통계를 업데이트함.
     */
    @Transactional
    public void processSettlementEvent(SettlementFinishedEvent event) {
        // 1. 지출 로그 기록 (기초 데이터 저장)
        saveSpendingLog(event);

        // 2. 월간 통계 업데이트 (누적 집계)
        String spendMonth = event.getEndedAt().format(DateTimeFormatter.ofPattern("yyyy-MM"));

        // (1) 전체 지출 누적
        updateMonthlySpend(event.getUserId(), spendMonth, "TOTAL", "ALL", event.getAmount());

        // (2) 카테고리별 지출 누적
        updateMonthlySpend(event.getUserId(), spendMonth, "CATEGORY", event.getCategory(), event.getAmount());

        // (3) 방별 지출 누적 (stat_value에 ID 저장)
        updateMonthlySpend(event.getUserId(), spendMonth, "ROOM", String.valueOf(event.getRoomId()), event.getAmount());

        log.info("지출 분석 처리 완료 - 사용자: {}, 금액: {}", event.getUserId(), event.getAmount());
    }

    private void saveSpendingLog(SettlementFinishedEvent event) {
        SpendingLog log = SpendingLog.builder()
                .userId(event.getUserId())
                .roomId(event.getRoomId())
                .roomSessionId(event.getRoomSessionId())
                .roomName(event.getRoomName())
                .category(event.getCategory())
                .amount(event.getAmount())
                .build();
        spendingLogRepository.save(log);
    }

    /**
     * 기존 통계가 있으면 더하고, 없으면 새로 생성함 (Upsert 로직)
     */
    private void updateMonthlySpend(Long userId, String spendMonth, String type, String value, Integer amount) {
        UserMonthlySpend spend = userMonthlySpendRepository
                .findByUserIdAndSpendMonthAndStatTypeAndStatValue(userId, spendMonth, type, value)
                .orElseGet(() -> UserMonthlySpend.builder()
                        .userId(userId)
                        .spendMonth(spendMonth)
                        .statType(type)
                        .statValue(value)
                        .totalAmount(0)
                        .build());

        spend.addAmount(amount);
        userMonthlySpendRepository.save(spend);
    }
}
