package com.duckchi.core.infra.s3;

import com.duckchi.core.domain.auth.dto.response.ProfileImageUploadUrlResponse;
import com.duckchi.core.global.error.CustomException;
import com.duckchi.core.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class S3StorageService {

    private static final List<String> ALLOWED_CONTENT_TYPES = List.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/heic",
            "image/heif"
    );

    private final S3Presigner s3Presigner;

    @Value("${aws.s3.bucket}")
    private String bucket;

    @Value("${aws.s3.region}")
    private String region;

    @Value("${aws.s3.public-base-url:}")
    private String publicBaseUrl;

    @Value("${aws.s3.profile-prefix:profiles}")
    private String profilePrefix;

    @Value("${aws.s3.presigned-url-expiration-minutes:10}")
    private long presignedUrlExpirationMinutes;

    public ProfileImageUploadUrlResponse createProfileImageUploadUrl(
            Long userId,
            String fileName,
            String contentType
    ) {
        validateS3Configuration();
        validateContentType(contentType);

        String normalizedFileName = sanitizeFileName(fileName);
        String key = "%s/%d/%s-%s".formatted(
                normalizePrefix(profilePrefix),
                userId,
                UUID.randomUUID(),
                normalizedFileName
        );

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(contentType)
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(presignedUrlExpirationMinutes))
                .putObjectRequest(putObjectRequest)
                .build();

        try {
            PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(presignRequest);
            return new ProfileImageUploadUrlResponse(
                    presignedRequest.url().toString(),
                    key,
                    toPublicUrl(key)
            );
        } catch (Exception e) {
            log.error("Failed to create S3 profile upload URL.", e);
            throw new CustomException("Failed to create upload URL.", ErrorCode.COMMON_INTERNAL_ERROR);
        }
    }

    public String toPublicUrl(String key) {
        validateS3Configuration();

        String baseUrl = StringUtils.hasText(publicBaseUrl)
                ? trimTrailingSlash(publicBaseUrl)
                : "https://%s.s3.%s.amazonaws.com".formatted(bucket, region);

        return "%s/%s".formatted(baseUrl, key);
    }

    private void validateS3Configuration() {
        if (!StringUtils.hasText(bucket)) {
            throw new CustomException("S3 bucket is not configured.", ErrorCode.COMMON_INTERNAL_ERROR);
        }
    }

    private void validateContentType(String contentType) {
        if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new CustomException("Only image files can be uploaded.", ErrorCode.COMMON_INVALID_INPUT);
        }
    }

    private String sanitizeFileName(String fileName) {
        String fallbackName = "profile-image.jpg";
        if (!StringUtils.hasText(fileName)) {
            return fallbackName;
        }

        String normalized = fileName.replace("\\", "/");
        String baseName = normalized.substring(normalized.lastIndexOf('/') + 1).trim();
        if (!StringUtils.hasText(baseName)) {
            return fallbackName;
        }

        return baseName.replaceAll("[^A-Za-z0-9._-]", "-");
    }

    private String normalizePrefix(String prefix) {
        String normalized = StringUtils.hasText(prefix) ? prefix.trim() : "profiles";
        return normalized.replaceAll("^/+", "").replaceAll("/+$", "");
    }

    private String trimTrailingSlash(String value) {
        return value.replaceAll("/+$", "");
    }
}
