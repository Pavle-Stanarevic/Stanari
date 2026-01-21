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

    @GetMapping("/pricing")
    public ResponseEntity<?> getPricing() {
        System.out.println("[DEBUG_LOG] SubscriptionController.getPricing called");
        BigDecimal monthly = clanarinaRepository.findByTipClanarine("monthly")
                .map(Clanarina::getIznosEUR)
                .orElse(new BigDecimal("5.00"));
        BigDecimal yearly = clanarinaRepository.findByTipClanarine("yearly")
                .map(Clanarina::getIznosEUR)
                .orElse(new BigDecimal("50.00"));

        System.out.println("[DEBUG_LOG] getPricing returning: monthly=" + monthly + ", yearly=" + yearly);
        Map<String, Object> resp = new HashMap<>();
        resp.put("monthly", monthly);
        resp.put("yearly", yearly);
        resp.put("currency", "EUR");
        return ResponseEntity.ok(resp);
    }

    @PostMapping
    public ResponseEntity<?> createSubscription(@RequestBody Map<String, Object> data) {
        String billing = (String) data.get("billing");
        Map<String, Object> response = new HashMap<>(data);
        response.put("subscriptionId", UUID.randomUUID().toString());
        
        String title = "monthly".equalsIgnoreCase(billing) ? "Basic mjesečni plan" : "Basic godišnji plan";
        response.put("title", title);
        
        BigDecimal amount = clanarinaRepository.findByTipClanarine(billing)
                .map(Clanarina::getIznosEUR)
                .orElse("monthly".equals(billing) ? new BigDecimal("5.00") : new BigDecimal("50.00"));
        
        System.out.println("[DEBUG_LOG] createSubscription: billing=" + billing + ", amount=" + amount);
        response.put("amount", amount);
        response.put("billing", billing);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSubscription(@PathVariable String id, @RequestParam(value = "billing", defaultValue = "monthly") String billing) {
        Map<String, Object> response = new HashMap<>();
        response.put("subscriptionId", id);
        
        String title = "monthly".equalsIgnoreCase(billing) ? "Basic mjesečni plan" : "Basic godišnji plan";
        response.put("title", title);
        
        BigDecimal amount = clanarinaRepository.findByTipClanarine(billing)
                .map(Clanarina::getIznosEUR)
                .orElse("monthly".equals(billing) ? new BigDecimal("5.00") : new BigDecimal("50.00"));
                
        response.put("amount", amount);
        response.put("billing", billing);
        return ResponseEntity.ok(response);
    }
}
