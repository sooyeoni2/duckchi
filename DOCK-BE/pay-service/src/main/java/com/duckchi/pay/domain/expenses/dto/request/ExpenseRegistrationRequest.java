package com.duckchi.pay.domain.expenses.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 결제 통합 등록 및 수정을 위한 요청 DTO.
 * 수동 입력(MANUAL), 계좌 내역 기반(ACCOUNT_HISTORY), OCR 인식 결과(OCR)를 모두 수용하는 유니버셜 설계.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "결제 통합 등록/수정 요청")
public class ExpenseRegistrationRequest {

    @Schema(description = "결제 내역 ID (기존 내역 수정 시 필수, 신규 등록 시 null). 향후 업데이트 기능 확장을 위한 필드.", example = "101")
    private Long expenseId;

    @NotNull(message = "모임방 ID는 필수임.")
    @Schema(description = "모임방 식별자", example = "1")
    private Long roomId;

    @NotNull(message = "모임 회차 ID는 필수임.")
    @Schema(description = "모임 내 특정 회차(세션) 식별자", example = "1")
    private Long roomSessionId;

    @NotBlank(message = "결제 제목은 필수임.")
    @Schema(description = "결제 건에 대한 명칭/제목", example = "삼겹살 회식")
    private String title;

    @NotNull(message = "결제 총액은 필수임.")
    @Schema(description = "영수증 상의 전체 결제 금액", example = "50000")
    private Integer totalAmount;

    @Schema(description = "실제 결제가 이루어진 일시 (미확정 시 null 가능)")
    private LocalDateTime paidAt;

    @Schema(description = "영수증 이미지의 클라우드 스토리지 URL (OCR 기반 등록 시 필수)", example = "https://cdn.example.com/receipts/1.jpg")
    private String receiptImageUrl;

    @NotBlank(message = "입력 방식은 필수임 (MANUAL, ACCOUNT_HISTORY, OCR).")
    @Schema(description = "데이터 입력 출처 (MANUAL: 수동, ACCOUNT_HISTORY: 계좌 연동, OCR: 영수증 인식)", example = "OCR")
    private String inputType;

    @NotEmpty(message = "최소 한 명 이상의 정산 참여자가 필요함.")
    @Schema(description = "전체 정산 참여자 목록 및 인당 최종 분담 합계 정보")
    private List<ParticipantRequest> participants;

    @Schema(description = "메뉴(품목)별 상세 내역. 정밀 정산 및 동적 분담 로직 구현을 위한 데이터 구조.")
    private List<ItemRequest> items;

    /**
     * 전체 정산 참여자 정보.
     */
    @Getter @Builder @NoArgsConstructor @AllArgsConstructor
    @Schema(description = "정산 참여자 개별 정보")
    public static class ParticipantRequest {
        @Schema(description = "사용자 식별자")
        private Long userId;
        @Schema(description = "사용자 이름")
        private String userName;
        @Schema(description = "사용자 고유 태그")
        private String userTag;
        @Schema(description = "프로필 이미지 경로")
        private String profileImageUrl;
        @Schema(description = "해당 결제 건에서 이 사용자가 부담해야 할 최종 총액", example = "15000")
        private Integer splitAmount;
    }

    /**
     * 동적 정산을 위한 개별 메뉴(품목) 정보.
     * 품목 단위로 참여자를 지정하여 유연한 정산 로직(예: 술 안 마신 사람 제외 등) 지원.
     */
    @Getter @Builder @NoArgsConstructor @AllArgsConstructor
    @Schema(description = "품목별 정산 상세 정보")
    public static class ItemRequest {
        @Schema(description = "메뉴 또는 품목명", example = "삼겹살 3인분")
        private String name;
        @Schema(description = "해당 품목의 총액 (단가 * 수량)", example = "36000")
        private Integer totalAmount;
        @Schema(description = "품목 전체 수량", example = "3")
        private Integer quantity;
        
        @Schema(description = "품목 내부의 사용자별 세부 분담(Split) 리스트. 특정 품목을 누가 얼마나 소비했는지 정의함.")
        private List<ItemSplitRequest> splits;
    }

    /**
     * 특정 품목에 대한 개별 사용자 분담 정보.
     */
    @Getter @Builder @NoArgsConstructor @AllArgsConstructor
    @Schema(description = "품목별 개인 분담 상세")
    public static class ItemSplitRequest {
        @Schema(description = "분담 참여 사용자 식별자")
        private Long userId;
        @Schema(description = "이 품목에서 해당 사용자가 부담하는 금액", example = "12000")
        private Integer splitAmount;
        
        @Schema(description = "해당 품목의 개인별 취득 수량. 금액 기반의 단순 N분의 1 정산(N-way split) 시에는 논리적 수량이 모호하므로 0으로 기록함.", example = "1")
        private Integer quantity; 
    }
}
