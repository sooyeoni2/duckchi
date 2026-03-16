package com.duckchi.core.domain.auth.service;

import com.duckchi.core.domain.auth.dto.request.KakaoLoginRequest;
import com.duckchi.core.domain.auth.dto.response.LoginResponse;
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

import java.util.Map;
import java.util.Random;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final KakaoClient kakaoClient;
    private final JwtProvider jwtProvider;
    private final MemberClient memberClient;

    @Value("${finance.api.key}")
    private String financeApiKey;

    public LoginResponse login(KakaoLoginRequest request) {
        try {
            // 1. 카카오 액세스 토큰 획득
            String kakaoAccessToken = kakaoClient.getAccessToken(request.getAuthorizationCode(), request.getRedirectUri());

            // 2. 카카오 유저 정보 획득
            Map<String, Object> userInfo = kakaoClient.getUserInfo(kakaoAccessToken);
            String socialId = String.valueOf(userInfo.get("id"));

            // 카카오 API 응답에서 닉네임 추출 (비즈앱 권한 부재로 실명 대신 닉네임 사용)
            Map<String, Object> properties = (Map<String, Object>) userInfo.get("properties");
            String nickname = (properties != null) ? (String) properties.get("nickname") : "NoName";

            Map<String, Object> kakaoAccount = (Map<String, Object>) userInfo.get("kakao_account");
            String email = (kakaoAccount != null) ? (String) kakaoAccount.get("email") : request.getEmail();

            // 3. 회원 여부 확인
            User user = userRepository.findBySocialId(socialId).orElse(null);
            boolean isNewUser = (user == null);

            if (isNewUser) {
                // 4. 신규 유저 등록 (닉네임을 실명 필드에 저장)
                user = registerUser(socialId, email, nickname);
            }

            // 5. 서비스 자체 JWT 발급
            String accessToken = jwtProvider.createAccessToken(user.getId());
            String refreshToken = jwtProvider.createRefreshToken(user.getId());

            return LoginResponse.builder()
                    .newUser(isNewUser)
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .user(LoginResponse.UserResponse.builder()
                            .userId(user.getId())
                            .name(user.getName())
                            .tag(user.getTag())
                            .build())
                    .build();
        } catch (Exception e) {
            log.error("Kakao login error: ", e);
            throw new CustomException(ErrorCode.AUTH_LOGIN_FAILED);
        }
    }

    private User registerUser(String socialId, String email, String name) {
        // 랜덤 태그 생성 (예: #1A3)
        String tag = generateRandomTag();
        String userEmail = (email != null) ? email : socialId + "@kakao.com";

        // 금융망 API 연동하여 실제 유저 키 발급
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
            // 1. 유저 조회 시도
            MemberResponse response = memberClient.searchMember(request);
            if (response != null && response.userKey() != null) {
                return response.userKey();
            }
        } catch (Exception e) {
            log.info("금융망 유저 조회 실패, 신규 생성을 시도합니다: {}", email);
        }

        try {
            // 2. 유저 생성 시도
            MemberResponse response = memberClient.createMember(request);
            if (response != null && response.userKey() != null) {
                return response.userKey();
            }
        } catch (Exception e) {
            log.error("금융망 유저 키 발급 최종 실패: {}", email);
            throw new RuntimeException("금융망 연동에 실패했습니다.");
        }
        throw new RuntimeException("금융망 연동 결과가 올바르지 않습니다.");
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
