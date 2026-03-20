package com.duckchi.pay.domain.settlement.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "settlements",
        uniqueConstraints = {
                @UniqueConstraint(name = "UK_SETTLEMENTS_EXPENSE_PAYER", columnNames = {"expense_id", "payer_user_id"}),
                @UniqueConstraint(name = "UK_SETTLEMENTS_BANK_TRANSACTION_ID", columnNames = {"bank_transaction_id"})
        }
)
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class Settlement {

    private static final String STATUS_PENDING = "PENDING";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long roomId;

    @Column(nullable = false)
    private Long roomSessionId;

    @Column(nullable = false)
    private Long expenseId;

    @Column(nullable = false, length = 100)
    private String roomName;

    @Column(nullable = false)
    private Long requesterUserId;

    @Column(nullable = false, length = 50)
    private String requesterUserName;

    @Column(nullable = false)
    private Long payerUserId;

    @Column(nullable = false, length = 50)
    private String payerUserName;

    @Column(nullable = false)
    private Integer payableAmount;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(length = 100)
    private String bankTransactionId;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime completedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public static Settlement createPending(
            Long roomId,
            Long roomSessionId,
            Long expenseId,
            String roomName,
            Long requesterUserId,
            String requesterUserName,
            Long payerUserId,
            String payerUserName,
            Integer payableAmount
    ) {
        return Settlement.builder()
                .roomId(roomId)
                .roomSessionId(roomSessionId)
                .expenseId(expenseId)
                .roomName(roomName)
                .requesterUserId(requesterUserId)
                .requesterUserName(requesterUserName)
                .payerUserId(payerUserId)
                .payerUserName(payerUserName)
                .payableAmount(payableAmount)
                .status(STATUS_PENDING)
                .build();
    }
}
