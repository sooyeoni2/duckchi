package com.duckchi.pay.infra.finance.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransferRequest {

    @JsonProperty("Header")
    private FinanceRequestHeader header;

    private String withdrawalAccountNo;
    private String depositAccountNo;
    private String transactionBalance;
    private String withdrawalTransactionSummary;
    private String depositTransactionSummary;
}