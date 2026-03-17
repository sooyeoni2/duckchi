package com.duckchi.core.infra.client;

import java.util.Map;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "pay-service", url = "${services.pay-service.url:}")
public interface PayClient {

    @GetMapping("/api/v1/rooms/invites/{inviteToken}")
    ResponseEntity<Map<String, Object>> validateInviteLink(
            @PathVariable("inviteToken") String inviteToken,
            @RequestHeader(value = "Authorization", required = false) String authorization
    );
}