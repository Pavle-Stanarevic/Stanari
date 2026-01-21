package com.clayplay.controller;

import com.clayplay.model.Clanarina;
import com.clayplay.repository.ClanarinaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    private final ClanarinaRepository clanarinaRepository;

    public SubscriptionController(ClanarinaRepository clanarinaRepository) {
        this.clanarinaRepository = clanarinaRepository;
    }

    @PostMapping
    public ResponseEntity<?> createSubscription(@RequestBody Map<String, Object> data) {
        Map<String, Object> response = new HashMap<>(data);
        response.put("subscriptionId", UUID.randomUUID().toString());
        
        if (!response.containsKey("title")) {
            response.put("title", "Basic Plan");
        }
        
        String billing = (String) data.get("billing");
        BigDecimal amount = clanarinaRepository.findByTipClanarine(billing)
                .map(Clanarina::getIznosEUR)
                .orElse("monthly".equals(billing) ? new BigDecimal("5.00") : new BigDecimal("50.00"));
        
        response.put("amount", amount);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSubscription(@PathVariable String id) {
        Map<String, Object> response = new HashMap<>();
        response.put("subscriptionId", id);
        response.put("title", "Basic Plan");
        
        BigDecimal amount = clanarinaRepository.findByTipClanarine("monthly")
                .map(Clanarina::getIznosEUR)
                .orElse(new BigDecimal("5.00"));
                
        response.put("amount", amount);
        response.put("billing", "monthly");
        return ResponseEntity.ok(response);
    }
}
