package com.clayplay.controller;

import com.clayplay.model.CartItem;
import com.clayplay.service.CartService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    private Long resolveUserId(Map<String, Object> body) {
        if (body == null) return null;
        Object v = body.get("userId");
        if (v instanceof Number) return ((Number) v).longValue();
        try { return v == null ? null : Long.valueOf(String.valueOf(v)); } catch (Exception e) { return null; }
    }

    private Map<String, Object> mapItem(CartItem it) {
        Map<String, Object> m = new HashMap<>();
        if (it == null) return m;
        m.put("idCartItem", it.getIdCartItem());
        if (it.getProductId() != null) m.put("id", "product:" + it.getProductId());
        else if (it.getIdRadionica() != null) m.put("id", "workshop:" + it.getIdRadionica());
        else if (it.getIdCartItem() != null) m.put("id", "cart:" + it.getIdCartItem());

        m.put("type", it.getType());
        m.put("qty", it.getQty());
        m.put("title", it.getTitle());
        if (it.getPrice() != null) m.put("price", it.getPrice().doubleValue());
        else m.put("price", 0);

        String metaRaw = it.getMeta();
        if (metaRaw != null) {
            try {
                Object parsed = objectMapper.readValue(metaRaw, new TypeReference<Object>() {});
                m.put("meta", parsed);
            } catch (Exception e) {
                m.put("meta", metaRaw);
            }
        } else {
            m.put("meta", null);
        }

        m.put("idKorisnik", it.getIdKorisnik());
        m.put("productId", it.getProductId());
        m.put("idRadionica", it.getIdRadionica());
        m.put("createdAt", it.getCreatedAt());
        return m;
    }

    private List<Map<String,Object>> mapList(List<CartItem> items) {
        List<Map<String,Object>> out = new ArrayList<>();
        if (items == null) return out;
        for (CartItem it : items) out.add(mapItem(it));
        return out;
    }

    @GetMapping
    public ResponseEntity<?> getCart(@RequestParam(required = false) Long userId) {
        List<CartItem> items = cartService.getCartForUser(userId);
        return ResponseEntity.ok(Map.of("items", mapList(items)));
    }

    @PostMapping("/items")
    public ResponseEntity<?> addItem(@RequestBody Map<String, Object> body) {
        Long userId = resolveUserId(body);
        if (userId == null) return ResponseEntity.status(404).body(Map.of("message", "Missing userId"));

        String type = String.valueOf(body.getOrDefault("type", "product"));
        CartItem item = new CartItem();
        item.setType(type);
        if ("workshop".equalsIgnoreCase(type)) {
            Object wid = body.get("workshopId");
            if (wid != null) item.setIdRadionica(Long.valueOf(String.valueOf(wid)));
        } else {
            Object pid = body.get("productId");
            if (pid != null) item.setProductId(Long.valueOf(String.valueOf(pid)));
        }
        Object qty = body.get("qty");
        if (qty != null) item.setQty(Integer.parseInt(String.valueOf(qty)));
        Object title = body.get("title"); if (title != null) item.setTitle(String.valueOf(title));
        Object price = body.get("price"); if (price != null) item.setPrice(new java.math.BigDecimal(String.valueOf(price)));
        Object meta = body.get("meta"); if (meta != null) item.setMeta(String.valueOf(meta));

        List<CartItem> items = cartService.addItem(userId, item);
        return ResponseEntity.ok(Map.of("items", mapList(items)));
    }

    @PatchMapping("/items/{itemId}")
    public ResponseEntity<?> updateQty(@PathVariable String itemId, @RequestBody Map<String, Object> body) {
        Long userId = resolveUserId(body);
        if (userId == null) return ResponseEntity.status(404).body(Map.of("message", "Missing userId"));
        int qty = Integer.parseInt(String.valueOf(body.getOrDefault("qty", 1)));
        try {
            List<CartItem> items;
            try {
                Long numericId = Long.valueOf(itemId);
                items = cartService.updateQty(userId, numericId, qty);
            } catch (NumberFormatException nfe) {
                items = cartService.updateQtyByFriendlyId(userId, itemId, qty);
            }
            return ResponseEntity.ok(Map.of("items", mapList(items)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<?> removeItem(@PathVariable String itemId, @RequestBody(required = false) Map<String, Object> body) {
        Long userId = resolveUserId(body);
        if (userId == null) return ResponseEntity.status(404).body(Map.of("message", "Missing userId"));
        try {
            List<CartItem> items;
            try {
                Long numericId = Long.valueOf(itemId);
                items = cartService.removeItem(userId, numericId);
            } catch (NumberFormatException nfe) {
                items = cartService.removeItemByFriendlyId(userId, itemId);
            }
            return ResponseEntity.ok(Map.of("items", mapList(items)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping
    public ResponseEntity<?> clearCart(@RequestBody(required = false) Map<String, Object> body) {
        Long userId = resolveUserId(body);
        if (userId == null) return ResponseEntity.status(404).body(Map.of("message", "Missing userId"));
        List<CartItem> items = cartService.clearCart(userId);
        return ResponseEntity.ok(Map.of("items", mapList(items)));
    }

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@RequestBody Map<String, Object> body) {
        Long userId = resolveUserId(body);
        if (userId == null) return ResponseEntity.status(404).body(Map.of("message", "Missing userId"));
        try {
            cartService.checkout(userId);
            return ResponseEntity.ok(Map.of("status", "ok"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Server error"));
        }
    }

    @PostMapping("/force-clear")
    public ResponseEntity<?> forceClear(@RequestBody(required = false) Map<String, Object> body) {
        try {
            Long userId = resolveUserId(body);
            if (userId == null) return ResponseEntity.status(400).body(Map.of("message", "Missing userId"));
            cartService.clearCartForUser(userId);
            return ResponseEntity.ok(Map.of("status", "ok", "clearedForUser", userId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", e.getMessage() == null ? e.toString() : e.getMessage()));
        }
    }
}
