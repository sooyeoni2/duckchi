package com.duckchi.pay.domain.settlement.repository;

import com.duckchi.pay.domain.settlement.entity.Settlement;
import jakarta.persistence.LockModeType;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SettlementRepository extends JpaRepository<Settlement, Long> {

    boolean existsByExpenseIdIn(Collection<Long> expenseIds);

    /**
     * SET-02 사전 검증 및 정렬 처리를 위해 대상 정산을 다건 조회한다.
     */
    List<Settlement> findAllByIdIn(List<Long> settlementIds);

    /**
     * ROOM-12에서 현재 사용자 기준 정산 목록을 최신순으로 조회한다.
     */
    List<Settlement> findByRoomIdAndRoomSessionIdAndPayerUserIdOrderByCreatedAtDescIdDesc(
            Long roomId,
            Long roomSessionId,
            Long payerUserId
    );

    /**
     * ROOM-12에서 내 미완료 정산 합계를 계산한다.
     */
    @Query("""
            select coalesce(sum(s.payableAmount), 0)
            from Settlement s
            where s.roomId = :roomId
              and s.roomSessionId = :roomSessionId
              and s.payerUserId = :payerUserId
              and s.status = 'PENDING'
            """)
    Long sumPendingPayableAmountByRoomSessionAndPayer(
            @Param("roomId") Long roomId,
            @Param("roomSessionId") Long roomSessionId,
            @Param("payerUserId") Long payerUserId
    );

    /**
     * SET-02 송금 처리 시 동시 완료 경쟁을 막기 위해 정산 행을 비관적 락으로 단건 조회한다.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Settlement s where s.id = :settlementId")
    Optional<Settlement> findByIdForUpdate(@Param("settlementId") Long settlementId);

    boolean existsByExpenseIdAndStatus(Long expenseId, String status);

    /**
     * SET-04 조회 시 UI 표시에 필요한 안정적인 정렬 순서(createdAt -> id)를 보장한다.
     */
    List<Settlement> findByExpenseIdOrderByCreatedAtAscIdAsc(Long expenseId);
}

