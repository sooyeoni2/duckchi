package com.duckchi.pay.domain.expenses.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

import static jakarta.persistence.FetchType.LAZY;

/**
 * 결제 품목 엔티티 (OCR 상세 내역).
 */
@Entity
@Table(name = "expense_items")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class ExpenseItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "expense_id", nullable = false)
    private Expense expense;

    @Column(length = 100)
    private String name;

    @Column(nullable = false)
    private Integer totalAmount;

    @Column(nullable = false)
    private Integer quantity;

    @Builder.Default
    @OneToMany(mappedBy = "expenseItem", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExpenseItemParticipant> itemParticipants = new ArrayList<>();
}
