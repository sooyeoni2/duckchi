package com.duckchi.pay.domain.room.repository;

import com.duckchi.pay.domain.room.entity.InviteLink;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InviteLinkRepository extends JpaRepository<InviteLink, Long> {

    Optional<InviteLink> findTopByRoom_IdOrderByCreatedAtDesc(Long roomId);

    Optional<InviteLink> findByToken(String token);

    boolean existsByToken(String token);
}