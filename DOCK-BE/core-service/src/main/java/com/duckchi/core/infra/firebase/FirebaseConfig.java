package com.duckchi.core.infra.firebase;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    //서비스 계정 JSON 파일 경로 주입
    @Value("${firebase.admin-sdk-path}")
    private String adminSdkPath;

    //FirebaseApp 초기화 (한 번)
    @Bean
    public FirebaseApp firebaseApp() throws IOException {
        if (!FirebaseApp.getApps().isEmpty()) { //중복 초기화 막기 위한 코드
            return FirebaseApp.getInstance();
        }
        //Firebase 서비스 계정 자격 정보로 Google 인증 정보 변환하기
        try (InputStream inputStream = new FileInputStream(adminSdkPath)) {
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(inputStream))
                    .build();
            return FirebaseApp.initializeApp(options);
        }
    }

    //FirebaseMessaging 빈 생성
    @Bean
    public FirebaseMessaging firebaseMessaging(FirebaseApp firebaseApp) {
        return FirebaseMessaging.getInstance(firebaseApp);
    }
}
