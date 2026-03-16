package com.duckchi.pay.domain.expenses.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 결제 통합 등록 요청 정보.
 * OCR 수정 및 메뉴별 정밀 정산을 모두 지원함.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "결제 통합 등록 요청")
public class ExpenseRegistrationRequest {

    @Schema(description = "기존 결제 수정 시 ID (신규 등록 시 null)", example = "null")
    private Long expenseId;

    @NotNull(message = "모임방 ID는 필수임.")
    private Long roomId;

    @NotNull(message = "모임 회차 ID는 필수임.")
    private Long roomSessionId;

    @NotBlank(message = "결제 제목은 필수임.")
    private String title;

    @NotNull(message = "결제 총액은 필수임.")
    private Integer totalAmount;

    @Schema(description = "결제 일시 (미확정 시 null 가능)")
    private LocalDateTime paidAt;

    @NotBlank(message = "입력 방식은 필수임 (MANUAL, ACCOUNT_HISTORY, OCR).")
    private String inputType;

    @NotEmpty(message = "최소 한 명 이상의 정산 참여자가 필요함.")
    private List<ParticipantRequest> participants;

    @Schema(description = "메뉴별 상세 내역 (OCR 정산 및 메뉴별 나누기 시 사용)")
    private List<ItemRequest> items;

    /**
     * 전체 정산 참여자 및 최종 분담 금액.
     */
    @Getter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ParticipantRequest {
        private Long userId;
        private String userName;
        private String userTag;
        private String profileImageUrl;
        private Integer splitAmount; // 이 유저가 결제 건 전체에서 내야 할 최종 합계
    }

    /**
     * 개별 메뉴(품목) 정보.
     */
    @Getter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ItemRequest {
        private String name;
        private Integer totalAmount; // 품목 총액 (단가 * 수량)
        private Integer quantity;    // 품목 수량
        
        @Schema(description = "메뉴별 참여자 분담 상세 리스트")
        private List<ItemSplitRequest> splits;
    }

    /**
     * 메뉴별 개별 분담 정보.
     */
    @Getter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ItemSplitRequest {
        private Long userId;
        private Integer splitAmount; // 이 메뉴에서 이 유저가 분담한 금액
        
        @Schema(description = "해당 품목 취득 수량. N빵 시 0으로 저장함.", example = "1")
        private Integer quantity; 
    }
}
