package com.duckchi.pay.domain.expense.entity;

import jakarta.persistence.*;
import lombok.*;

import static jakarta.persistence.FetchType.LAZY;

/**
 * 품목별 참여자 엔티티.
 */
@Entity
@Table(name = "expense_item_participants")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class ExpenseItemParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "expense_item_id", nullable = false)
    private ExpenseItem expenseItem;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, length = 50)
    private String userName;

    @Column(nullable = false, length = 20)
    private String userTag;

    @Column(length = 512)
    private String profileImageUrl;

    @Column(nullable = false)
    private Integer quantity; // N빵 시 0 저장함.

    @Column(nullable = false)
    private Integer splitAmount;
}
