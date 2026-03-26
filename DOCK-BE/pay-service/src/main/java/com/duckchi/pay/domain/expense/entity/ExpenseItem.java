package com.duckchi.pay.domain.expense.entity;

import static jakarta.persistence.FetchType.LAZY;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.BatchSize;

/**
 * 결제 품목 엔티티.
 * 품목 이름, 총액, 수량과 품목 참여자 분담 목록 보관 역할.
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
    @BatchSize(size = 100)
    @OneToMany(mappedBy = "expenseItem", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExpenseItemParticipant> itemParticipants = new ArrayList<>();
}
