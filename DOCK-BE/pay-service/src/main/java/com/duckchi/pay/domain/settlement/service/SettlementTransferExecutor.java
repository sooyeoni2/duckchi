package com.duckchi.pay.domain.settlement.service;

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

    @Value("${finance.api.key:test-key}")
    private String financeApiKey;
    /**
     * 정산 1건의 금융 송금과 상태 전이를 처리한다.
     * 건별 트랜잭션으로 분리해 배치 처리 중 부분 성공 정책을 보장한다.
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
    }

    /**
     * 현재 사용자가 해당 settlement의 납부자와 일치하는지 검증한다.
     */
    private void validatePayerAuthorization(Long currentUserId, Settlement settlement) {
        if (!currentUserId.equals(settlement.getPayerUserId())) {
            throw new CustomException(ErrorCode.SETTLEMENT_FORBIDDEN_PAYER);
        }
    }

    /**
     * 송금 대상 settlement가 PENDING 상태인지 검증한다.
     */
    private void validatePendingStatus(Settlement settlement) {
        if (!SETTLEMENT_PENDING_STATUS.equals(settlement.getStatus())) {
            throw new CustomException(ErrorCode.SETTLEMENT_ALREADY_COMPLETED);
        }
    }

    /**
     * 금융망 이체 내역에 기록할 송금 요약 문구를 생성한다.
     */
    private String buildTransferSummary(Settlement settlement) {
        return String.format("덕치 정산(%s)", settlement.getRoomName());
    }

    /**
     * SSAFY 금융 송금 API를 호출하고 비즈니스 성공 코드(H0000)를 검증한다.
     */
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

    /**
     * 금융 API 응답 헤더의 responseCode가 H0000인지 검증한다.
     */
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

    /**
     * 송금 성공 후 settlement에 저장할 은행 거래 식별값을 결정한다.
     * 응답 거래번호가 없으면 요청 고유번호를 대체값으로 사용한다.
     */
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

    /**
     * core-service에서 사용자 금융 프로필(SSAFY userKey, 계좌번호)을 조회한다.
     */
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

    /**
     * 해당 expense의 모든 settlement가 완료되었는지 확인하고 필요 시 SETTLED로 전이한다.
     */
    private void tryMarkExpenseSettled(Long expenseId) {
        if (settlementRepository.existsByExpenseIdAndStatus(expenseId, SETTLEMENT_PENDING_STATUS)) {
            return;
        }

        Expense expense = expenseRepository.findByIdForUpdate(expenseId)
                .orElseThrow(() -> new CustomException(ErrorCode.SETTLEMENT_EXPENSE_NOT_FOUND));
        expense.markSettled();
    }
}
