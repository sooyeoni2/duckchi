package com.duckchi.core.domain.user.repository;

import com.duckchi.core.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findBySocialId(String socialId);
    //결제 비밀번호가 이미 설정된 유저인지 확인
    boolean existsByIdAndPayPasswordIsNotNull(Long Id);
}
