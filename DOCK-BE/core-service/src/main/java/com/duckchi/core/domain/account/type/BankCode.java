package com.duckchi.core.domain.account.type;

import com.duckchi.core.global.error.CustomException;
import com.duckchi.core.global.error.ErrorCode;
import java.util.Arrays;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BankCode {

    BANK_OF_KOREA("001", "한국은행"),
    KDB_BANK("002", "산업은행"),
    IBK_BANK("003", "기업은행"),
    KOOKMIN_BANK("004", "국민은행"),
    NONGHYUP_BANK("011", "농협은행"),
    WOORI_BANK("020", "우리은행"),
    SC_BANK("023", "SC제일은행"),
    CITI_BANK("027", "시티은행"),
    DAEGU_BANK("032", "대구은행"),
    GWANGJU_BANK("034", "광주은행"),
    JEJU_BANK("035", "제주은행"),
    JEONBUK_BANK("037", "전북은행"),
    KYONGNAM_BANK("039", "경남은행"),
    MG_BANK("045", "새마을금고"),
    HANA_BANK("081", "KEB하나은행"),
    SHINHAN_BANK("088", "신한은행"),
    KAKAO_BANK("090", "카카오뱅크"),
    SSAFY_BANK("999", "싸피은행");

    private final String code;
    private final String bankName;

    public static BankCode from(String code) {
        return Arrays.stream(values())
                .filter(bankCode -> bankCode.code.equals(code))
                .findFirst()
                .orElseThrow(() -> new CustomException(ErrorCode.ACCOUNT_INVALID_INPUT));
    }
}
