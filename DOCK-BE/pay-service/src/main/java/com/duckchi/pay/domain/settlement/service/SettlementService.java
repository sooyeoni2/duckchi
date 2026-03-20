package com.duckchi.pay.domain.settlement.service;

import com.duckchi.pay.domain.settlement.dto.request.SettlementRequestCreateRequest;
import com.duckchi.pay.domain.settlement.dto.request.SettlementTransferRequest;

public interface SettlementService {

    void requestSettlements(Long currentUserId, SettlementRequestCreateRequest request);

    void transferSettlements(Long currentUserId, SettlementTransferRequest request);
}
