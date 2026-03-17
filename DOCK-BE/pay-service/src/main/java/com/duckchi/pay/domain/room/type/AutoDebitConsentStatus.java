package com.duckchi.pay.domain.room.type;

public enum AutoDebitConsentStatus {
    AGREED,
    DECLINED;

    public boolean toAgreement() {
        return this == AGREED;
    }
}