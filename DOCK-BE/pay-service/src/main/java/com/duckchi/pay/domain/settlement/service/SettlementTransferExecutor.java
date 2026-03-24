package com.duckchi.pay.domain.settlement.service;

import com.duckchi.pay.domain.badge.service.BadgeTriggerService;
import com.duckchi.pay.domain.expense.dto.external.UserFinanceProfileResponse;
import com.duckchi.pay.domain.expense.entity.Expense;
import com.duckchi.pay.domain.expense.repository.ExpenseRepository;
import com.duckchi.pay.domain.settlement.entity.Settlement;
import com.duckchi.pay.domain.settlement.repository.SettlementRepository;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import com.duckchi.pay.global.response.ApiResponseDto;
import com.duckchi.pay.infra.client.CoreClient;
import com.duckchi.pay.infra.finance.FinanceClient;
import com.duckchi.pay.infra.finance.dto.request.FinanceRequestHeader;
import com.duckchi.pay.infra.finance.dto.request.TransferRequest;
import com.duckchi.pay.infra.finance.dto.response.FinanceResponseHeader;
import com.duckchi.pay.infra.finance.dto.response.TransferResponse;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class SettlementTransferExecutor {

    private static final String FINANCE_TRANSFER_API = "updateDemandDepositAccountTransfer";
    private static final String FINANCE_SUCCESS_CODE = "H0000";
    private static final String SETTLEMENT_PENDING_STATUS = "PENDING";

    private final SettlementRepository settlementRepository;
    private final ExpenseRepository expenseRepository;
    private final CoreClient coreClient;
    private final FinanceClient financeClient;
    private final SettlementTransferIdempotencyService settlementTransferIdempotencyService;
    private final BadgeTriggerService badgeTriggerService;

    @Value("${finance.api.key:test-key}")
    private String financeApiKey;
    /**
     * 외부 금융 송금과 DB 상태 전이를 한 건 단위로 확정하기 위해 REQUIRES_NEW로 분리한다.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void transferOne(Long currentUserId, Long settlementId) {
        String financeRequestUniqueNo = settlementTransferIdempotencyService.ensureFinanceRequestUniqueNo(settlementId);

        Settlement settlement = settlementRepository.findByIdForUpdate(settlementId)
                .orElseThrow(() -> new CustomException(ErrorCode.SETTLEMENT_NOT_FOUND));

        validatePayerAuthorization(currentUserId, settlement);
        validatePendingStatus(settlement);

        UserFinanceProfileResponse payerProfile = getUserFinanceProfile(currentUserId);
        UserFinanceProfileResponse requesterProfile = getUserFinanceProfile(settlement.getRequesterUserId());

        FinanceRequestHeader header = FinanceRequestHeader.createHeader(
                FINANCE_TRANSFER_API,
                FINANCE_TRANSFER_API,
                financeApiKey,
                payerProfile.getSsafyUserKey(),
                financeRequestUniqueNo
        );

        TransferRequest transferRequest = TransferRequest.builder()
                .header(header)
                .withdrawalAccountNo(payerProfile.getAccountNo())
                .depositAccountNo(requesterProfile.getAccountNo())
                .transactionBalance(String.valueOf(settlement.getPayableAmount()))
                .withdrawalTransactionSummary(buildTransferSummary(settlement))
                .depositTransactionSummary(buildTransferSummary(settlement))
                .build();

        TransferResponse transferResponse = callFinanceTransfer(transferRequest);
        String bankTransactionId = resolveBankTransactionId(transferResponse, header);

        settlement.markCompleted(bankTransactionId, LocalDateTime.now());
        tryMarkExpenseSettled(settlement.getExpenseId());

        // [BADGE 트리거] 정산 송금 완료 시 뱃지 진행도 갱신
        // NOBLE_DUCK(금액), ASSASSIN_DUCK(1시간 이내), TURTLE_DUCK(48시간 초과), NIGHTOWL_DUCK(새벽 시간대)
        badgeTriggerService.triggerSettlementCompleted(
                settlement.getPayerUserId(),
                settlement.getPayableAmount(),
                settlement.getCreatedAt(),
                LocalDateTime.now()
        );
    }

    private void validatePayerAuthorization(Long currentUserId, Settlement settlement) {
        if (!currentUserId.equals(settlement.getPayerUserId())) {
            throw new CustomException(ErrorCode.SETTLEMENT_FORBIDDEN_PAYER);
        }
    }

    private void validatePendingStatus(Settlement settlement) {
        if (!SETTLEMENT_PENDING_STATUS.equals(settlement.getStatus())) {
            throw new CustomException(ErrorCode.SETTLEMENT_ALREADY_COMPLETED);
        }
    }

    private String buildTransferSummary(Settlement settlement) {
        return String.format("덕치 정산(%s)", settlement.getRoomName());
    }

    private TransferResponse callFinanceTransfer(TransferRequest transferRequest) {
        try {
            TransferResponse response = financeClient.transfer(transferRequest);
            validateFinanceResponse(response);
            return response;
        } catch (CustomException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("SSAFY 송금 API 호출 실패. settlement transfer request={}", transferRequest, ex);
            throw new CustomException(ErrorCode.FINANCE_API_ERROR);
        }
    }

    private void validateFinanceResponse(TransferResponse response) {
        if (response == null || response.header() == null) {
            throw new CustomException(ErrorCode.FINANCE_API_ERROR);
        }

        FinanceResponseHeader header = response.header();
        if (!FINANCE_SUCCESS_CODE.equals(header.getResponseCode())) {
            String message = StringUtils.hasText(header.getResponseMessage())
                    ? header.getResponseMessage()
                    : ErrorCode.FINANCE_API_ERROR.getMsg();
            throw new CustomException(message, ErrorCode.FINANCE_API_ERROR);
        }
    }

    private String resolveBankTransactionId(TransferResponse response, FinanceRequestHeader requestHeader) {
        String responseTransactionUniqueNo = response.extractTransactionUniqueNo();
        if (StringUtils.hasText(responseTransactionUniqueNo)) {
            return responseTransactionUniqueNo;
        }

        // REC에서 거래고유번호를 못 받는 경우에도 요청 전문 고유번호를 증빙값으로 저장해 추적성을 확보한다.
        if (StringUtils.hasText(requestHeader.getInstitutionTransactionUniqueNo())) {
            return requestHeader.getInstitutionTransactionUniqueNo();
        }

        throw new CustomException(ErrorCode.FINANCE_API_ERROR);
    }

    private UserFinanceProfileResponse getUserFinanceProfile(Long userId) {
        try {
            ApiResponseDto<UserFinanceProfileResponse> response = coreClient.getUserFinanceProfile(userId);
            if (response == null || response.getData() == null) {
                throw new CustomException(ErrorCode.FINANCE_INVALID_ACCOUNT);
            }

            UserFinanceProfileResponse financeProfile = response.getData();
            if (!StringUtils.hasText(financeProfile.getSsafyUserKey())
                    || !StringUtils.hasText(financeProfile.getAccountNo())) {
                throw new CustomException(ErrorCode.FINANCE_INVALID_ACCOUNT);
            }

            return financeProfile;
        } catch (CustomException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("core-service 금융 프로필 조회 실패. userId={}", userId, ex);
            throw new CustomException(ErrorCode.FINANCE_API_ERROR);
        }
    }

    private void tryMarkExpenseSettled(Long expenseId) {
        if (settlementRepository.existsByExpenseIdAndStatus(expenseId, SETTLEMENT_PENDING_STATUS)) {
            return;
        }

        Expense expense = expenseRepository.findByIdForUpdate(expenseId)
                .orElseThrow(() -> new CustomException(ErrorCode.SETTLEMENT_EXPENSE_NOT_FOUND));
        expense.markSettled();
    }
}

