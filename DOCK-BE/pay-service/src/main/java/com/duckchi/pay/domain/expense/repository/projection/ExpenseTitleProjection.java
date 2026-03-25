package com.duckchi.pay.domain.expense.repository.projection;

/**
 * expense ID별 제목 조회 Projection이다.
 */
public interface ExpenseTitleProjection {
    Long getExpenseId();

    String getTitle();
}
