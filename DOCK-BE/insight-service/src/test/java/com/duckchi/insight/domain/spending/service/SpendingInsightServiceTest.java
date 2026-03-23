package com.duckchi.insight.domain.spending.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.duckchi.insight.domain.spending.dto.event.SettlementFinishedEvent;
import com.duckchi.insight.domain.spending.entity.SpendingLog;
import com.duckchi.insight.domain.spending.entity.UserMonthlySpend;
import com.duckchi.insight.domain.spending.repository.SpendingLogRepository;
import com.duckchi.insight.domain.spending.repository.UserMonthlySpendRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class SpendingInsightServiceTest {

    @Autowired
    private SpendingInsightService spendingInsightService;

    @Autowired
    private SpendingLogRepository spendingLogRepository;

    @Autowired
    private UserMonthlySpendRepository userMonthlySpendRepository;

    @Test
    @DisplayName("정산 완료 이벤트 수신 시 로그 저장 및 통계 누적이 정상적으로 이루어져야 한다")
    void processSettlementEventTest() {
        // given: 첫 번째 결제 이벤트 (식비 30,000원)
        Long userId = 1L;
        LocalDateTime now = LocalDateTime.of(2026, 3, 20, 19, 0);
        SettlementFinishedEvent event1 = SettlementFinishedEvent.builder()
                .userId(userId)
                .roomId(10L)
                .roomSessionId(101L)
                .roomName("강남 삼겹살")
                .category("DINING")
                .amount(30000)
                .endedAt(now)
                .build();

        // when: 이벤트 처리
        spendingInsightService.processSettlementEvent(event1);

        // then: 로그 및 통계 검증
        List<SpendingLog> logs = spendingLogRepository.findAll();
        assertThat(logs).hasSize(1);
        assertThat(logs.get(0).getAmount()).isEqualTo(30000);

        // 전체(TOTAL) 통계 확인
        UserMonthlySpend totalSpend = userMonthlySpendRepository
                .findByUserIdAndSpendMonthAndStatTypeAndStatValue(userId, "2026-03", "TOTAL", "ALL")
                .orElseThrow();
        assertThat(totalSpend.getTotalAmount()).isEqualTo(30000);

        // 카테고리(CATEGORY) 통계 확인
        UserMonthlySpend categorySpend = userMonthlySpendRepository
                .findByUserIdAndSpendMonthAndStatTypeAndStatValue(userId, "2026-03", "CATEGORY", "DINING")
                .orElseThrow();
        assertThat(categorySpend.getTotalAmount()).isEqualTo(30000);

        // ------------------------------------------------------------
        // given: 두 번째 결제 이벤트 (같은 달, 같은 카테고리 20,000원 추가)
        SettlementFinishedEvent event2 = SettlementFinishedEvent.builder()
                .userId(userId)
                .roomId(11L)
                .roomSessionId(102L)
                .roomName("스타벅스")
                .category("DINING")
                .amount(20000)
                .endedAt(now)
                .build();

        // when: 이벤트 처리
        spendingInsightService.processSettlementEvent(event2);

        // then: 합산 결과 검증
        UserMonthlySpend updatedTotal = userMonthlySpendRepository
                .findByUserIdAndSpendMonthAndStatTypeAndStatValue(userId, "2026-03", "TOTAL", "ALL")
                .orElseThrow();
        assertThat(updatedTotal.getTotalAmount()).isEqualTo(50000); // 30,000 + 20,000

        UserMonthlySpend updatedCategory = userMonthlySpendRepository
                .findByUserIdAndSpendMonthAndStatTypeAndStatValue(userId, "2026-03", "CATEGORY", "DINING")
                .orElseThrow();
        assertThat(updatedCategory.getTotalAmount()).isEqualTo(50000);

        // ------------------------------------------------------------
        // given: 세 번째 결제 이벤트 (다른 카테고리 15,000원)
        SettlementFinishedEvent event3 = SettlementFinishedEvent.builder()
                .userId(userId)
                .roomId(12L)
                .roomSessionId(103L)
                .roomName("택시비")
                .category("TRANSPORT")
                .amount(15000)
                .endedAt(now)
                .build();

        // when: 이벤트 처리
        spendingInsightService.processSettlementEvent(event3);

        // then: 개별 카테고리 합산 검증
        UserMonthlySpend transportSpend = userMonthlySpendRepository
                .findByUserIdAndSpendMonthAndStatTypeAndStatValue(userId, "2026-03", "CATEGORY", "TRANSPORT")
                .orElseThrow();
        assertThat(transportSpend.getTotalAmount()).isEqualTo(15000);

        UserMonthlySpend finalTotal = userMonthlySpendRepository
                .findByUserIdAndSpendMonthAndStatTypeAndStatValue(userId, "2026-03", "TOTAL", "ALL")
                .orElseThrow();
        assertThat(finalTotal.getTotalAmount()).isEqualTo(65000); // 50,000 + 15,000
    }
}
