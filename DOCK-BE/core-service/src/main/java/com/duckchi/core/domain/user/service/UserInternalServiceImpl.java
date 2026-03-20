package com.duckchi.core.domain.user.service;

import com.duckchi.core.domain.account.entity.UserAccount;
import com.duckchi.core.domain.account.repository.UserAccountRepository;
import com.duckchi.core.domain.account.type.AccountStatus;
import com.duckchi.core.domain.user.dto.response.UserFinanceProfileResponse;
import com.duckchi.core.domain.user.dto.response.UserProfileSnapshotResponse;
import com.duckchi.core.domain.user.entity.User;
import com.duckchi.core.domain.user.repository.UserRepository;
import com.duckchi.core.global.error.CustomException;
import com.duckchi.core.global.error.ErrorCode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserInternalServiceImpl implements UserInternalService {

    private final UserRepository userRepository;
    private final UserAccountRepository userAccountRepository;

    @Override
    public UserFinanceProfileResponse getUserFinanceProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        UserAccount account = userAccountRepository.findByUserIdAndStatusAndDeletedAtIsNull(userId, AccountStatus.VERIFIED)
                .orElseThrow(() -> new CustomException(ErrorCode.ACCOUNT_INVALID));

        return UserFinanceProfileResponse.builder()
                .ssafyUserKey(user.getSsafyUserKey())
                .accountNo(account.getAccountNumber())
                .build();
    }

    @Override
    public List<UserProfileSnapshotResponse> getUserProfiles(List<Long> userIds) {
        List<Long> distinctUserIds = userIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        List<User> users = userRepository.findAllByIdInAndDeletedAtIsNull(distinctUserIds);
        Map<Long, User> userMap = new LinkedHashMap<>();
        users.forEach(user -> userMap.put(user.getId(), user));

        if (userMap.size() != distinctUserIds.size()) {
            throw new CustomException(ErrorCode.USER_NOT_FOUND);
        }

        return distinctUserIds.stream()
                .map(userMap::get)
                .map(user -> UserProfileSnapshotResponse.builder()
                        .userId(user.getId())
                        .userName(user.getName())
                        .userTag(user.getTag())
                        .profileImageUrl(user.getProfileImageUrl())
                        .build())
                .toList();
    }
}
