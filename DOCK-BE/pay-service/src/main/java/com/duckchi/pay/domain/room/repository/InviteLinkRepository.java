package com.duckchi.pay.domain.room.repository;

import com.duckchi.pay.domain.room.entity.InviteLink;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InviteLinkRepository extends JpaRepository<InviteLink, Long> {

    Optional<InviteLink> findTopByRoom_IdOrderByCreatedAtDesc(Long roomId);

    Optional<InviteLink> findByToken(String token);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from InviteLink i where i.token = :token")
    Optional<InviteLink> findByTokenForUpdate(@Param("token") String token);

    boolean existsByToken(String token);
}