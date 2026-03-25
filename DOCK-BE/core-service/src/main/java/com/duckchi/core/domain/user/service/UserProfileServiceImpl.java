package com.duckchi.core.domain.user.service;

import com.duckchi.core.domain.account.entity.UserAccount;
import com.duckchi.core.domain.account.repository.UserAccountRepository;
import com.duckchi.core.domain.account.type.AccountStatus;
import com.duckchi.core.domain.user.dto.request.NotificationSettingRequest;
import com.duckchi.core.domain.user.dto.request.UserProfileEditRequest;
import com.duckchi.core.domain.user.dto.request.UserProfileImageEditRequest;
import com.duckchi.core.domain.user.dto.response.UserProfileDetailResponse;
import com.duckchi.core.domain.user.dto.response.UserProfileEditResponse;
import com.duckchi.core.domain.user.entity.User;
import com.duckchi.core.domain.user.repository.UserRepository;
import com.duckchi.core.global.error.CustomException;
import com.duckchi.core.global.error.ErrorCode;
import com.duckchi.core.infra.s3.S3StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserProfileServiceImpl implements UserProfileService {

    private final UserRepository userRepository;
    private final UserAccountRepository userAccountRepository;
    private final S3StorageService s3StorageService;

    @Override
    public UserProfileDetailResponse getProfileDetail(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        List<UserAccount> accounts = userAccountRepository.findAllByUserIdAndStatusAndDeletedAtIsNull(userId, AccountStatus.VERIFIED);

        List<UserProfileDetailResponse.AccountSummary> accountSummaries = accounts.stream()
                .map(account -> UserProfileDetailResponse.AccountSummary.builder()
                        .accountId(account.getId())
                        .bankCode(account.getBankCode())
                        .bankName(account.getBankName())
                        .accountNumber(account.getAccountNumber())
                        .registeredAt(account.getRegisteredAt())
                        .build())
                .toList();

        return UserProfileDetailResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .tag(user.getTag())
                .transferLimit(user.getTransferLimit())
                .profileImageUrl(user.getProfileImageUrl())
                .notificationEnabled(user.getNotificationEnabled())
                .createdAt(user.getCreatedAt())
                .accounts(accountSummaries)
                .badges(Collections.emptyList())
                .build();
    }

    @Override
    @Transactional
    public void editTransferLimit(Long userId, UserProfileEditRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        user.updateTransferLimit(request.getTransferLimit());
    }

    @Override
    @Transactional
    public UserProfileEditResponse editProfileImage(Long userId, UserProfileImageEditRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        String profileImageUrl = null;
        if (request.getProfileImageKey() != null && !request.getProfileImageKey().isBlank()) {
            profileImageUrl = s3StorageService.toPublicUrl(request.getProfileImageKey());
        }

        user.updateProfile(user.getName(), profileImageUrl);

        return UserProfileEditResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .tag(user.getTag())
                .profileImageUrl(user.getProfileImageUrl())
                .transferLimit(user.getTransferLimit())
                .createdAt(user.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public void updateNotificationSetting(Long userId, NotificationSettingRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        user.updateNotificationEnabled(request.getNotificationEnabled());
    }
}
