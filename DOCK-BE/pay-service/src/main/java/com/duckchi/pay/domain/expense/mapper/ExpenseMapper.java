package com.duckchi.pay.domain.expense.mapper;

import com.duckchi.pay.domain.expense.dto.response.ExpenseDetailResponse;
import com.duckchi.pay.domain.expense.dto.response.ExpenseResponse;
import com.duckchi.pay.domain.expense.entity.Expense;
import org.springframework.stereotype.Component;

/**
 * 결제안 엔티티와 DTO 간의 변환을 담당하는 컴포넌트.
 */
@Component
public class ExpenseMapper {

    /**
     * 목록 조회용 간략 응답 변환.
     */
    public ExpenseResponse toExpenseResponse(Expense expense) {
        return ExpenseResponse.builder()
                .expenseId(expense.getId())
                .roomSessionId(expense.getRoomSessionId())
                .title(expense.getTitle())
                .totalAmount(expense.getTotalAmount())
                .payerUserName(expense.getPayerUserName())
                .inputType(expense.getInputType())
                .status(expense.getStatus())
                .paidAt(expense.getPaidAt())
                .createdAt(expense.getCreatedAt())
                .build();
    }

    /**
     * 상세 조회용 상세 응답 변환.
     */
    public ExpenseDetailResponse toDetailResponse(Expense expense) {
        return ExpenseDetailResponse.builder()
                .expenseId(expense.getId())
                .title(expense.getTitle())
                .totalAmount(expense.getTotalAmount())
                .paidAt(expense.getPaidAt())
                .payerUserName(expense.getPayerUserName())
                .payerUserId(expense.getPayerUserId())
                .inputType(expense.getInputType())
                .participants(expense.getParticipants().stream()
                        .map(participant -> ExpenseDetailResponse.ParticipantDetail.builder()
                                .userId(participant.getUserId())
                                .userName(participant.getUserName())
                                .userTag(participant.getUserTag())
                                .profileImageUrl(participant.getProfileImageUrl())
                                .splitAmount(participant.getSplitAmount())
                                .build())
                        .toList())
                .items(expense.getItems().stream()
                        .map(item -> ExpenseDetailResponse.ItemDetail.builder()
                                .name(item.getName())
                                .totalAmount(item.getTotalAmount())
                                .quantity(item.getQuantity())
                                .itemParticipants(item.getItemParticipants().stream()
                                        .map(itemParticipant -> ExpenseDetailResponse.ItemParticipantDetail.builder()
                                                .userId(itemParticipant.getUserId())
                                                .userName(itemParticipant.getUserName())
                                                .userTag(itemParticipant.getUserTag())
                                                .profileImageUrl(itemParticipant.getProfileImageUrl())
                                                .splitAmount(itemParticipant.getSplitAmount())
                                                .quantity(itemParticipant.getQuantity())
                                                .build())
                                        .toList())
                                .build())
                        .toList())
                .build();
    }
}
