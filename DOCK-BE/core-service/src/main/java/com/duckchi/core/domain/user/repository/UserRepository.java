package com.duckchi.core.domain.user.repository;

import com.duckchi.core.domain.user.entity.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findBySocialId(String socialId);

    List<User> findAllByIdInAndDeletedAtIsNull(List<Long> userIds);
}
