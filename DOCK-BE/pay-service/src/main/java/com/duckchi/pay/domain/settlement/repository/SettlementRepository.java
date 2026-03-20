package com.duckchi.pay.domain.settlement.repository;

import com.duckchi.pay.domain.settlement.entity.Settlement;
import java.util.Collection;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SettlementRepository extends JpaRepository<Settlement, Long> {

    boolean existsByExpenseIdIn(Collection<Long> expenseIds);
}
