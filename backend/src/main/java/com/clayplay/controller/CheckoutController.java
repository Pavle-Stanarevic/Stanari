package com.clayplay.controller;

import com.clayplay.model.CartItem;
import com.clayplay.service.CartService;
import com.clayplay.service.CheckoutStore;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

    private final CartService cartService;
    private final CheckoutStore checkoutStore;

    public CheckoutController(CartService cartService, CheckoutStore checkoutStore) {
        this.cartService = cartService;
        this.checkoutStore = checkoutStore;
    }

    @PostMapping("/from-cart")
    public ResponseEntity<?> fromCart(@RequestBody(required = false) Map<String,Object> body) {
        Long userId = null;
        if (body != null) {
            Object v = body.get("userId");
            if (v instanceof Number) userId = ((Number) v).longValue();
            else try { userId = v == null ? null : Long.valueOf(String.valueOf(v)); } catch (Exception ignored) {}
        }
        if (userId == null) return ResponseEntity.status(400).body(Map.of("message", "Missing userId"));
        try {
            Map<String,Object> payload = cartService.prepareCheckout(userId);
            String id = checkoutStore.save(payload);
            return ResponseEntity.ok(Map.of(
                "checkoutId", id,
                "total", payload.get("total"),
                "items", payload.get("items")
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        } catch (Throwable e) {
            e.printStackTrace();
            String msg = e.getMessage() == null ? e.toString() : e.getMessage();
            return ResponseEntity.status(500).body(Map.of("message", msg));
        }
    }

    @GetMapping("/{checkoutId}")
    public ResponseEntity<?> getCheckout(@PathVariable String checkoutId) {
        Map<String, Object> p = checkoutStore.get(checkoutId);
        if (p == null) return ResponseEntity.status(404).body(Map.of("message", "Not found"));
        return ResponseEntity.ok(p);
    }

    @PostMapping("/finalize")
    public ResponseEntity<?> finalizeCheckout(@RequestBody Map<String,Object> body) {
        if (body == null) return ResponseEntity.status(400).body(Map.of("message", "Missing body"));
        String checkoutId = body.get("checkoutId") == null ? null : String.valueOf(body.get("checkoutId"));
        Map<String,Object> payload = null;
        if (body.get("payload") instanceof Map) {
            payload = (Map<String,Object>) body.get("payload");
        } else if (checkoutId != null) {
            payload = checkoutStore.remove(checkoutId);
        }
        if (payload == null) return ResponseEntity.status(400).body(Map.of("message", "Missing checkout payload"));
        try {
            cartService.finalizeCheckout(checkoutId, payload);
            return ResponseEntity.ok(Map.of("status", "ok"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        } catch (Throwable e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", e.getMessage() == null ? e.toString() : e.getMessage()));
        }
    }
}
