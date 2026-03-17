package com.duckchi.core.domain.account.scheduler;

import com.duckchi.core.domain.account.entity.UserAccount;
import com.duckchi.core.domain.account.repository.UserAccountRepository;
import com.duckchi.core.domain.account.type.AccountStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class AccountVerificationScheduler {

    private final UserAccountRepository userAccountRepository;

    @Scheduled(fixedDelay = 600000)
    @Transactional
    public void expirePendingAccounts() {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(5);

        List<UserAccount> expiredAccounts =
                userAccountRepository.findAllByStatusAndAuthRequestedAtBeforeAndDeletedAtIsNull(
                        AccountStatus.PENDING,
                        threshold
                );

        expiredAccounts.forEach(UserAccount::expire);
        log.info("AccountVerificationScheduler executed");
    }
}
