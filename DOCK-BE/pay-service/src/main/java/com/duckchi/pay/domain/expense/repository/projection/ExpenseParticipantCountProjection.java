package com.duckchi.pay.domain.expense.repository.projection;

/**
 * expense ID별 참여자 수 집계 Projection이다.
 */
public interface ExpenseParticipantCountProjection {
    Long getExpenseId();

    Long getParticipantCount();
}
