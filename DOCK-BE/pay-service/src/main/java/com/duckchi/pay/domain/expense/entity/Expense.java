package com.duckchi.pay.domain.expense.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 결제안 엔티티.
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
    private Long roomId;             // 대상 모임방 식별자임.

    @Column(nullable = false)
    private Long roomSessionId;      // 모임 회차 식별자임.

    @Column(nullable = false)
    private Long payerUserId;        // 결제 주체인 총무의 ID임.

    @Column(nullable = false, length = 50)
    private String payerUserName;    // 조회 시 성능을 위해 결제자 이름을 상호 저장함.

    @Column(nullable = false, length = 20)
    private String inputType;        // 결제 수단 (MANUAL, ACCOUNT_HISTORY, OCR) 구분용임.

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "PENDING"; // 결제안 상태 (PENDING, REQUESTED, SETTLED)임.

    @Column(length = 512)
    private String receiptImageUrl;  // OCR 영수증 원본 이미지 URL임.

    @Column(nullable = false, length = 200)
    private String title;            // 지출 항목명(예: OO식당)임.

    @Column(nullable = false)
    private Integer totalAmount;     // 결제 총액임.

    @Column
    private LocalDateTime paidAt;    // 실제 결제 일시 (미확정 시 NULL 가능)임.

    /**
     * JPA Auditing을 사용하여 생성 시간을 자동으로 관리함.
     */
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 한 결제 건에 속한 참여자 목록임 (1:N).
     * cascade = ALL: 결제 저장 시 참여자 정보도 함께 저장/삭제함.
     * orphanRemoval = true: 참여자 리스트에서 제거된 객체는 DB에서도 삭제함.
     */
    @Builder.Default
    @OneToMany(mappedBy = "expense", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExpenseParticipant> participants = new ArrayList<>();

    /**
     * 결제 상세 품목 리스트임 (1:N).
     * OCR 기반 정밀 정산 시 데이터가 생성됨.
     */
    @Builder.Default
    @OneToMany(mappedBy = "expense", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExpenseItem> items = new ArrayList<>();

    /**
     * 결제 원장의 기본 정보를 업데이트함.
     */
    public void updateBasicInfo(String title, Integer totalAmount, LocalDateTime paidAt, String receiptImageUrl) {
        this.title = title;
        this.totalAmount = totalAmount;
        this.paidAt = paidAt;
        this.receiptImageUrl = receiptImageUrl;
    }
}
