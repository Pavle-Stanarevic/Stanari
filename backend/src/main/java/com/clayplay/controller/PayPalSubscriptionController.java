package com.clayplay.controller;

import com.clayplay.model.Placa;
import com.clayplay.service.PayPalService;
import com.clayplay.service.SubscriptionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/subscriptions")
public class PayPalSubscriptionController {

    private final SubscriptionService subscriptionService;
    private final PayPalService payPalService;

    public PayPalSubscriptionController(SubscriptionService subscriptionService, PayPalService payPalService) {
        this.subscriptionService = subscriptionService;
        this.payPalService = payPalService;
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<?> activate(@PathVariable("id") String subscriptionId, @RequestBody Map<String, Object> data) {
        try {
            String method = data.get("method") == null ? null : String.valueOf(data.get("method"));
            String transactionId = data.get("transactionId") == null ? null : String.valueOf(data.get("transactionId"));
            String billing = data.get("billing") == null ? null : String.valueOf(data.get("billing"));

            Object userIdObj = data.get("userId");
            Long userId = null;
            if (userIdObj instanceof Number) userId = ((Number) userIdObj).longValue();
            else if (userIdObj != null) {
                try { userId = Long.valueOf(String.valueOf(userIdObj)); } catch (Exception ignored) {}
            }

            if (userId == null) return ResponseEntity.status(400).body(Map.of("message", "Missing userId"));
            if (billing == null || billing.isBlank()) billing = "monthly";

            if ("paypal".equalsIgnoreCase(method)) {
                if (transactionId == null || transactionId.isBlank()) {
                    return ResponseEntity.status(400).body(Map.of("message", "Missing transactionId"));
                }
                if (!payPalService.isConfigured()) {
                    return ResponseEntity.status(503).body(Map.of("message", "PayPal is not configured"));
                }

                payPalService.verifyCaptureCompleted(transactionId);

                Optional<Placa> p = subscriptionService.activateSubscriptionPayPal(userId, billing, transactionId);
                if (p.isEmpty()) return ResponseEntity.status(400).body(Map.of("message", "Could not activate subscription"));

                return ResponseEntity.ok(Map.of(
                        "status", "active",
                        "startAt", p.get().getDatvrPocetakClanarine(),
                        "endAt", p.get().getDatvrKrajClanarine()
                ));
            }

            return ResponseEntity.status(400).body(Map.of("message", "Unsupported method"));

        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Server error"));
        }
    }
}
