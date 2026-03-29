package com.duckchi.insight.domain.spending.service;

import com.duckchi.insight.domain.spending.dto.event.SettlementFinishedEvent;
import com.duckchi.insight.domain.spending.dto.response.CategorySpendResponse;
import com.duckchi.insight.domain.spending.dto.response.MonthlySummaryResponse;
import com.duckchi.insight.domain.spending.dto.response.MonthlyTrendResponse;
import com.duckchi.insight.domain.spending.dto.response.RoomFrequencyResponse;
import com.duckchi.insight.domain.spending.dto.response.RoomSpendResponse;
import com.duckchi.insight.domain.spending.entity.SpendingLog;
import com.duckchi.insight.domain.spending.entity.UserMonthlySpend;
import com.duckchi.insight.domain.spending.repository.SpendingLogRepository;
import com.duckchi.insight.domain.spending.repository.UserMonthlySpendRepository;
import com.duckchi.insight.domain.spending.type.StatType;
import com.duckchi.insight.global.error.CustomException;
import com.duckchi.insight.global.error.ErrorCode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
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
public class SpendingInsightServiceImpl implements SpendingInsightService {

    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");

    private final SpendingLogRepository spendingLogRepository;
    private final UserMonthlySpendRepository userMonthlySpendRepository;

    /**
     * 최근 3개월 소비 트렌드 조회 (AN-04)
     */
    @Override
    @Transactional(readOnly = true)
    public List<MonthlyTrendResponse> getSpendingTrends(Long userId) {
        // 1. 최근 3개월(현재 포함) 목록 생성
        List<String> months = new ArrayList<>();
        LocalDate now = LocalDate.now();
        for (int i = 2; i >= 0; i--) {
            months.add(now.minusMonths(i).format(MONTH_FORMATTER));
        }

        // 2. DB에서 존재하는 데이터 조회 (stat_type=TOTAL, stat_value=ALL)
        List<UserMonthlySpend> spends = userMonthlySpendRepository
                .findByUserIdAndStatTypeAndStatValueAndSpendMonthInOrderBySpendMonthAsc(
                        userId, StatType.TOTAL.name(), StatType.ALL, months);

        // 3. 0원 보정 (데이터가 없는 달은 0원으로 리턴)
        Map<String, Integer> spendMap = spends.stream()
                .collect(Collectors.toMap(UserMonthlySpend::getSpendMonth, UserMonthlySpend::getTotalAmount));

        return months.stream()
                .map(m -> new MonthlyTrendResponse(m, spendMap.getOrDefault(m, 0)))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getAvailableMonths(Long userId) {
        return userMonthlySpendRepository.findDistinctSpendMonthByUserIdOrderBySpendMonthAsc(userId);
    }

    /**
     * 월간 지출 요약 조회 로직 (AN-02).
     * 이번 달 총 지출액과 이전 달 총 지출액을 비교함.
     */
    @Override
    @Transactional(readOnly = true)
    public MonthlySummaryResponse getMonthlySummary(Long userId, String targetMonth) {
        validateMonthFormat(targetMonth);

        // 이번 달 총액
        int currentTotal = getAmountOrDefault(userId, targetMonth, StatType.TOTAL.name(), StatType.ALL);

        // 이전 달 계산
        String previousMonth = YearMonth.parse(targetMonth, MONTH_FORMATTER).minusMonths(1).format(MONTH_FORMATTER);
        int previousTotal = getAmountOrDefault(userId, previousMonth, StatType.TOTAL.name(), StatType.ALL);

        return new MonthlySummaryResponse(targetMonth, currentTotal, previousTotal, currentTotal - previousTotal);
    }

    /**
     * 카테고리별 지출 통계 조회 로직 (AN-01).
     * 각 카테고리가 해당 월 총 지출에서 차지하는 비중을 계산함.
     */
    @Override
    @Transactional(readOnly = true)
    public List<CategorySpendResponse> getCategoryStatistics(Long userId, String targetMonth) {
        validateMonthFormat(targetMonth);

        int totalAmount = getAmountOrDefault(userId, targetMonth, StatType.TOTAL.name(), StatType.ALL);
        if (totalAmount == 0) return List.of();

        List<UserMonthlySpend> categorySpends = userMonthlySpendRepository
                .findAllByUserIdAndSpendMonthAndStatTypeOrderByTotalAmountDesc(
                        userId, targetMonth, StatType.CATEGORY.name());

        return categorySpends.stream()
                .map(s -> new CategorySpendResponse(
                        s.getStatValue(),
                        s.getTotalAmount(),
                        Math.round((s.getTotalAmount() / (double) totalAmount) * 1000.0) / 10.0, // 소수점 한자리
                        s.getSessionCount()
                ))
                .toList();
    }

    /**
     * 방별 지출 통계 조회 로직 (AN-03).
     * 방 ID로 통계 조회 후, Batch Fetching(IN Query)을 통해
     * N+1 문제 없이 가장 최근 방 이름을 한 번에 매핑함.
     */
    @Override
    @Transactional(readOnly = true)
    public List<RoomSpendResponse> getRoomStatistics(Long userId, String targetMonth) {
        validateMonthFormat(targetMonth);

        List<UserMonthlySpend> roomSpends = userMonthlySpendRepository
                .findAllByUserIdAndSpendMonthAndStatTypeOrderByTotalAmountDesc(
                        userId, targetMonth, StatType.ROOM.name());

        if (roomSpends.isEmpty()) {
            return List.of();
        }

        // 1. 통계에서 대상 roomId 목록 추출
        List<Long> roomIds = roomSpends.stream()
                .map(s -> Long.parseLong(s.getStatValue()))
                .toList();

        // 2. GROUP BY 기반 Native Query로 각 방의 최신 이름을 단 1번의 쿼리로 일괄 조회
        List<Object[]> latestRoomNames = spendingLogRepository.findLatestRoomNamesByRoomIds(userId, roomIds);

        // 3. (roomId -> roomName) 구조로 메모리에 Map 생성
        Map<Long, String> roomNameMap = latestRoomNames.stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (String) row[1],
                        (existing, replacement) -> existing // 동시간대 중복 데이터 발생 시 기존 값 유지
                ));

        // 4. 통계 데이터와 방 이름 매핑하여 응답 조합
        return roomSpends.stream()
                .map(s -> {
                    Long roomId = Long.parseLong(s.getStatValue());
                    String roomName = roomNameMap.getOrDefault(roomId, "알 수 없는 방");
                    return new RoomSpendResponse(roomId, roomName, s.getTotalAmount());
                })
                .toList();
    }

    /**
     * 정산 완료 이벤트를 처리하여 로그를 남기고 월간 통계를 업데이트함.
     */
    @Override
    @Transactional
    public void processSettlementEvent(SettlementFinishedEvent event) {
        // 1. 지출 로그 기록 (기초 데이터 저장)
        saveSpendingLog(event);

        // 2. 월간 통계 업데이트 (누적 집계)
        String spendMonth = event.getEndedAt().format(MONTH_FORMATTER);

        // (1) 전체 지출 누적
        updateMonthlySpend(event.getUserId(), spendMonth, StatType.TOTAL.name(), StatType.ALL, event.getAmount());

        // (2) 카테고리별 지출 누적
        updateMonthlySpend(event.getUserId(), spendMonth, StatType.CATEGORY.name(), event.getCategory(), event.getAmount());

        // (3) 방별 지출 누적 (stat_value에 ID 저장)
        updateMonthlySpend(event.getUserId(), spendMonth, StatType.ROOM.name(), String.valueOf(event.getRoomId()), event.getAmount());

        log.info("지출 분석 처리 완료 - 사용자: {}, 금액: {}", event.getUserId(), event.getAmount());
    }

    // =========================================================
    // Private Helper Methods
    // =========================================================

    /**
     * targetMonth가 yyyy-MM 형식인지 검증함.
     * 형식이 올바르지 않으면 CustomException을 던져 400 Bad Request로 응답함.
     */
    /**
     * 방별 정산 빈도 랭킹 조회 로직 (AN-05).
     * session_count를 기반으로 정산 횟수가 많은 방 순서로 랭킹을 매겨 반환함.
     */
    @Override
    @Transactional(readOnly = true)
    public List<RoomFrequencyResponse> getRoomFrequencyRanking(Long userId, String targetMonth) {
        validateMonthFormat(targetMonth);

        List<UserMonthlySpend> roomSpends = userMonthlySpendRepository
                .findAllByUserIdAndSpendMonthAndStatTypeOrderBySessionCountDesc(
                        userId, targetMonth, StatType.ROOM.name());

        if (roomSpends.isEmpty()) {
            return List.of();
        }

        // 1. 통계에서 대상 roomId 목록 추출
        List<Long> roomIds = roomSpends.stream()
                .map(s -> Long.parseLong(s.getStatValue()))
                .toList();

        // 2. GROUP BY 기반 Native Query로 각 방의 최신 이름을 단 1번의 쿼리로 일괄 조회
        List<Object[]> latestRoomNames = spendingLogRepository.findLatestRoomNamesByRoomIds(userId, roomIds);

        // 3. (roomId -> roomName) Map 생성
        Map<Long, String> roomNameMap = latestRoomNames.stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (String) row[1],
                        (existing, replacement) -> existing
                ));

        // 4. 빈도(횟수) 기준 응답 조합
        return roomSpends.stream()
                .map(s -> {
                    Long roomId = Long.parseLong(s.getStatValue());
                    String roomName = roomNameMap.getOrDefault(roomId, "알 수 없는 방");
                    return new RoomFrequencyResponse(roomId, roomName, s.getSessionCount());
                })
                .toList();
    }

    private void validateMonthFormat(String targetMonth) {
        try {
            YearMonth.parse(targetMonth, MONTH_FORMATTER);
        } catch (DateTimeParseException e) {
            throw new CustomException(ErrorCode.INSIGHT_INVALID_MONTH_FORMAT);
        }
    }

    private int getAmountOrDefault(Long userId, String month, String type, String value) {
        return userMonthlySpendRepository
                .findByUserIdAndSpendMonthAndStatTypeAndStatValue(userId, month, type, value)
                .map(UserMonthlySpend::getTotalAmount)
                .orElse(0);
    }

    private void saveSpendingLog(SettlementFinishedEvent event) {
        SpendingLog spendingLog = SpendingLog.builder()
                .userId(event.getUserId())
                .roomId(event.getRoomId())
                .roomSessionId(event.getRoomSessionId())
                .roomName(event.getRoomName())
                .category(event.getCategory())
                .amount(event.getAmount())
                .build();
        spendingLogRepository.save(spendingLog);
    }

    /**
     * 기존 통계가 있으면 원자적 업데이트를 수행하고, 없으면 새로 생성함 (Upsert 로직).
     * Native Query를 통해 갱신 분실(Lost Update) 문제를 원천 차단함.
     */
    private void updateMonthlySpend(Long userId, String spendMonth, String type, String value, Integer amount) {
        // 1. 먼저 원자적 업데이트 시도 (이미 레코드가 존재하는 경우)
        int updatedCount = userMonthlySpendRepository.updateAmountAtomic(userId, spendMonth, type, value, amount);

        // 2. 업데이트된 행이 0개라면 레코드가 없다는 의미이므로 새로 생성
        if (updatedCount == 0) {
            try {
                UserMonthlySpend newSpend = UserMonthlySpend.builder()
                        .userId(userId)
                        .spendMonth(spendMonth)
                        .statType(type)
                        .statValue(value)
                        .totalAmount(amount)
                        .build();
                userMonthlySpendRepository.save(newSpend);
            } catch (Exception e) {
                // 동시에 생성 시도가 발생해 UNIQUE 제약 조건 위반이 날 수 있음
                // 이 경우 다시 한번 원자적 업데이트 시도
                userMonthlySpendRepository.updateAmountAtomic(userId, spendMonth, type, value, amount);
            }
        }
    }
}
