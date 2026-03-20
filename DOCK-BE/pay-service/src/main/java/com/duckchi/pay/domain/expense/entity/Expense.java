package com.duckchi.pay.domain.expense.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * 결제안 엔티티.
 * 결제 기본 정보와 참여자 분담, 품목 분담을 묶는 최상위 집계 역할.
 */
@Entity
@Table(name = "expenses")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long roomId; // 소속 모임방 식별자 보관 목적.

    @Column(nullable = false)
    private Long roomSessionId; // 소속 회차 식별자 보관 목적.

    @Column(nullable = false)
    private Long payerUserId; // 결제자 식별자 보관 목적.

    @Column(nullable = false, length = 50)
    private String payerUserName; // 목록/상세 조회용 결제자 이름 보관 목적.

    @Column(nullable = false, length = 20)
    private String inputType; // 입력 방식 구분 목적.

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "PENDING"; // 결제안 진행 상태 보관 목적.

    @Column(length = 512)
    private String receiptImageUrl; // 영수증 이미지 경로 보관 목적.

    @Column(nullable = false, length = 200)
    private String title; // 결제 제목 보관 목적.

    @Column(nullable = false)
    private Integer totalAmount; // 총 결제 금액 보관 목적.

    @Column
    private LocalDateTime paidAt; // 실제 결제 일시 보관 목적.

    /**
     * 생성 시각 자동 기록 필드.
     */
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 전체 참여자 분담 목록.
     * 결제안 삭제 시 하위 분담 정보 함께 정리 목적.
     */
    @Builder.Default
    @OneToMany(mappedBy = "expense", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExpenseParticipant> participants = new ArrayList<>();

    /**
     * 품목별 분담 목록.
     * OCR 또는 상세 분담 계산 결과 보관 목적.
     */
    @Builder.Default
    @OneToMany(mappedBy = "expense", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExpenseItem> items = new ArrayList<>();

    /**
     * 결제 기본 정보 갱신 메서드.
     */
    public void updateBasicInfo(String title, Integer totalAmount, LocalDateTime paidAt, String receiptImageUrl) {
        this.title = title;
        this.totalAmount = totalAmount;
        this.paidAt = paidAt;
        this.receiptImageUrl = receiptImageUrl;
    }
}
