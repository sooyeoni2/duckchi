package com.duckchi.pay.domain.expenses.entity;

import jakarta.persistence.*;
import lombok.*;

import static jakarta.persistence.FetchType.LAZY;

/**
 * 결제 참여자 엔티티.
 * 특정 결제 건에 대해 개별 유저가 분담해야 할 금액을 저장함.
 */
@Entity
@Table(name = "expense_participants")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class ExpenseParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "expense_id", nullable = false)
    private Expense expense; // 연관된 결제 원장 정보임.

    @Column(nullable = false)
    private Long userId;             // 참여 유저 식별자임.

    @Column(nullable = false, length = 50)
    private String userName;         // 참여자 이름 스냅샷임.

    @Column(nullable = false, length = 20)
    private String userTag;          // 참여자 태그 스냅샷임.

    @Column(length = 512)
    private String profileImageUrl;  // 참여자 프로필 이미지 스냅샷임.

    @Column(nullable = false)
    private Integer splitAmount;     // 유저별 실제 분담 금액임.
}

