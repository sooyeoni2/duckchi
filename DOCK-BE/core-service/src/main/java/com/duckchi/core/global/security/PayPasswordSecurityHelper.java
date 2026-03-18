package com.duckchi.core.global.security;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class PayPasswordSecurityHelper {

    private final PasswordEncoder payPasswordEncoder;
    private final String pepper;


    public PayPasswordSecurityHelper(
            PasswordEncoder payPasswordEncoder,
            @Value("${security.pay-password.pepper}") String pepper
    ) {
        this.payPasswordEncoder = payPasswordEncoder;
        this.pepper = pepper;
    }

    public String encode(String rawPin) {
        return payPasswordEncoder.encode(withPepper(rawPin));
    }

    public boolean matches(String rawPin, String encodedPin) {
        return payPasswordEncoder.matches(withPepper(rawPin), encodedPin);
    }

    private String withPepper(String rawPin) {
        return rawPin + pepper;
    }
}
