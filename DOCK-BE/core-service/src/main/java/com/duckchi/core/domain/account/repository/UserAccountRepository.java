package com.duckchi.core.domain.account.repository;

import com.duckchi.core.domain.account.entity.UserAccount;
import com.duckchi.core.domain.account.type.AccountStatus;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
    //UserId로 찾고, 인자로 들어온 status이고, 삭제되지 않은 계좌가 있는지 조회
    boolean existsByUserIdAndStatusAndDeletedAtIsNull(Long userId, AccountStatus status);

    //UserId로 찾고, 인자로 들어온 status이고, 삭제되지않은 계좌를 조회
    Optional<UserAccount> findByUserIdAndStatusAndDeletedAtIsNull(Long userId, AccountStatus status);

    //AccountId로 삭제되지않고,status인 계좌 조회
    Optional<UserAccount> findByIdAndStatusAndDeletedAtIsNull(Long AccountId, AccountStatus status);

}
