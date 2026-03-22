package com.duckchi.core.domain.auth.service;

import com.duckchi.core.domain.auth.dto.request.KakaoLoginRequest;
import com.duckchi.core.domain.auth.dto.response.LoginResponse;
import com.duckchi.core.domain.account.repository.UserAccountRepository;
import com.duckchi.core.domain.account.type.AccountStatus;
import com.duckchi.core.domain.user.entity.User;
import com.duckchi.core.domain.user.repository.UserRepository;
import com.duckchi.core.global.error.CustomException;
import com.duckchi.core.global.error.ErrorCode;
import com.duckchi.core.infra.client.KakaoClient;
import com.duckchi.core.infra.finance.MemberClient;
import com.duckchi.core.infra.finance.dto.request.MemberRequest;
import com.duckchi.core.infra.finance.dto.response.MemberResponse;
import com.duckchi.core.infra.security.jwt.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Map;
import java.util.Random;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final UserAccountRepository userAccountRepository;
    private final KakaoClient kakaoClient;
    private final JwtProvider jwtProvider;
    private final MemberClient memberClient;

    @Value("${finance.api.key}")
    private String financeApiKey;

    @Value("${kakao.redirect-uri}")
    private String configuredRedirectUri;

    public LoginResponse login(KakaoLoginRequest request) {
        try {
            // 1. 카카오 액세스 토큰 획득
            String kakaoAccessToken = kakaoClient.getAccessToken(request.getAuthorizationCode(), request.getRedirectUri());

            Map<String, Object> userInfo = kakaoClient.getUserInfo(kakaoAccessToken);
            String socialId = String.valueOf(userInfo.get("id"));

            Map<String, Object> properties = (Map<String, Object>) userInfo.get("properties");
            String nickname = properties != null ? (String) properties.get("nickname") : "NoName";

            Map<String, Object> kakaoAccount = (Map<String, Object>) userInfo.get("kakao_account");
            String email = kakaoAccount != null ? (String) kakaoAccount.get("email") : request.getEmail();

            User user = userRepository.findBySocialId(socialId).orElse(null);
            boolean isNewUser = user == null;

            if (isNewUser) {
                user = registerUser(socialId, email, nickname);
            }

            String accessToken = jwtProvider.createAccessToken(user.getId());
            String refreshToken = jwtProvider.createRefreshToken(user.getId());
            boolean hasBankAccount = userAccountRepository.existsByUserIdAndStatusAndDeletedAtIsNull(
                    user.getId(),
                    AccountStatus.VERIFIED
            );
            boolean hasPayPassword = StringUtils.hasText(user.getPayPassword());

            return LoginResponse.builder()
                    .newUser(isNewUser)
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .user(LoginResponse.UserResponse.builder()
                            .userId(user.getId())
                            .email(user.getEmail())
                            .name(user.getName())
                            .tag(user.getTag())
                            .hasBankAccount(hasBankAccount)
                            .hasPayPassword(hasPayPassword)
                            .build())
                    .build();
        } catch (Exception e) {
            log.error("Kakao login error", e);
            throw new CustomException(ErrorCode.AUTH_LOGIN_FAILED);
        }
    }

    private String resolveRedirectUri(KakaoLoginRequest request) {
        if (!StringUtils.hasText(request.getRedirectUri())) {
            return configuredRedirectUri;
        }

        if (!configuredRedirectUri.equals(request.getRedirectUri())) {
            log.warn("Ignoring mismatched Kakao redirect URI. request={}, configured={}",
                    request.getRedirectUri(), configuredRedirectUri);
        }

        return configuredRedirectUri;
    }

    private User registerUser(String socialId, String email, String name) {
        String tag = generateRandomTag();
        String userEmail = email != null ? email : socialId + "@kakao.com";
        String ssafyUserKey = getOrCreateUserKey(userEmail);

        User newUser = User.builder()
                .socialId(socialId)
                .email(userEmail)
                .name(name)
                .tag(tag)
                .ssafyUserKey(ssafyUserKey)
                .transferLimit(0)
                .build();

        return userRepository.save(newUser);
    }

    private String getOrCreateUserKey(String email) {
        MemberRequest request = new MemberRequest(financeApiKey, email);
        try {
            MemberResponse response = memberClient.searchMember(request);
            if (response != null && response.userKey() != null) {
                return response.userKey();
            }
        } catch (Exception e) {
            log.info("Finance member lookup failed. Falling back to create member for {}", email);
        }

        try {
            MemberResponse response = memberClient.createMember(request);
            if (response != null && response.userKey() != null) {
                return response.userKey();
            }
        } catch (Exception e) {
            log.error("Finance member provisioning failed for {}", email, e);
            throw new RuntimeException("Finance member provisioning failed.");
        }

        throw new RuntimeException("Finance member provisioning returned an empty user key.");
    }

    private String generateRandomTag() {
        Random random = new Random();
        String chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        StringBuilder sb = new StringBuilder("#");
        for (int i = 0; i < 3; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
