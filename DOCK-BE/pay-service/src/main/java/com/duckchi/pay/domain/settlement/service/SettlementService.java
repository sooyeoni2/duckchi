package com.duckchi.pay.domain.settlement.service;

import com.duckchi.pay.domain.settlement.dto.request.SettlementManualTransferRequest;
import com.duckchi.pay.domain.settlement.dto.request.SettlementRequestCreateRequest;
import com.duckchi.pay.domain.settlement.dto.request.SettlementTransferRequest;
import com.duckchi.pay.domain.settlement.dto.response.SettlementManualTransferResponse;

public interface SettlementService {

    void requestSettlements(Long currentUserId, SettlementRequestCreateRequest request);

    void transferSettlements(Long currentUserId, SettlementTransferRequest request);

    SettlementManualTransferResponse manualTransferSettlement(
            Long currentUserId,
            SettlementManualTransferRequest request
    );
}
