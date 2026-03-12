package com.duckchi.core.domain.account.repository;

import com.duckchi.core.domain.account.entity.UserAccount;
import com.duckchi.core.domain.account.type.AccountStatus;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {

    boolean existsByUserIdAndStatusAndDeletedAtIsNull(Long userId, AccountStatus status);

    Optional<UserAccount> findByUserIdAndStatusAndDeletedAtIsNull(Long userId, AccountStatus status);
}
