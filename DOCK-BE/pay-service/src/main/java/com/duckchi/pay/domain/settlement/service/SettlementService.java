package com.duckchi.pay.domain.settlement.service;

import com.duckchi.pay.domain.settlement.dto.request.SettlementRequestCreateRequest;

public interface SettlementService {

    void requestSettlements(Long currentUserId, SettlementRequestCreateRequest request);
}
