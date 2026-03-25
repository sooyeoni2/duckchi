package com.duckchi.core.domain.user.service;

import com.duckchi.core.domain.user.dto.request.UserProfileEditRequest;
import com.duckchi.core.domain.user.dto.request.UserProfileImageEditRequest;
import com.duckchi.core.domain.user.dto.response.UserProfileDetailResponse;
import com.duckchi.core.domain.user.dto.response.UserProfileEditResponse;

public interface UserProfileService {

    UserProfileDetailResponse getProfileDetail(Long userId);

    void editTransferLimit(Long userId, UserProfileEditRequest request);

    UserProfileEditResponse editProfileImage(Long userId, UserProfileImageEditRequest request);

}
