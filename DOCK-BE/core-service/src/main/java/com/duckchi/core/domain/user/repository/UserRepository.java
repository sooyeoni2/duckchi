package com.duckchi.core.domain.user.repository;

import com.duckchi.core.domain.user.entity.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findBySocialId(String socialId);
    Optional<User> findByIdAndDeletedAtIsNull(Long id);

    List<User> findAllByIdInAndDeletedAtIsNull(List<Long> userIds);
    //결제 비밀번호가 이미 설정된 유저인지 확인
    boolean existsByIdAndPayPasswordIsNotNull(Long Id);
}
