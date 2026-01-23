package com.clayplay.controller;

import com.clayplay.model.Clanarina;
import com.clayplay.model.Korisnik;
import com.clayplay.model.Placa;
import com.clayplay.repository.ClanarinaRepository;
import com.clayplay.repository.KorisnikRepository;
import com.clayplay.repository.PlacaRepository;
import com.clayplay.service.SubscriptionService;
import com.clayplay.service.CheckoutStore;
import com.clayplay.service.CartService;
import com.clayplay.service.PayPalService;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Value("${stripe.secret.key}")
    private String stripeSecretKey;

    private final KorisnikRepository korisnikRepository;
    private final ClanarinaRepository clanarinaRepository;
    private final PlacaRepository placaRepository;
    private final SubscriptionService subscriptionService;
    private final CheckoutStore checkoutStore;
    private final CartService cartService;
    private final PayPalService payPalService;

    public PaymentController(KorisnikRepository korisnikRepository, ClanarinaRepository clanarinaRepository, PlacaRepository placaRepository, SubscriptionService subscriptionService, CheckoutStore checkoutStore, CartService cartService, PayPalService payPalService) {
        this.korisnikRepository = korisnikRepository;
        this.clanarinaRepository = clanarinaRepository;
        this.placaRepository = placaRepository;
        this.subscriptionService = subscriptionService;
        this.checkoutStore = checkoutStore;
        this.cartService = cartService;
        this.payPalService = payPalService;
    }

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeSecretKey;
    }

    @PostMapping("/create-payment-intent")
    public ResponseEntity<?> createPaymentIntent(@RequestBody Map<String, Object> data) {
        try {
            Long userId = ((Number) data.get("userId")).longValue();

            System.out.println("[DEBUG_LOG] Creating PaymentIntent for userId: " + userId);

            Optional<Korisnik> userOpt = korisnikRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(404).body("User not found");
            }
            if ("BLOCKED".equalsIgnoreCase(userOpt.get().getStatus())) {
                return ResponseEntity.status(403).body("User is blocked");
            }

            Long amount;
            if (data.containsKey("amount")) {
                amount = ((Number) data.get("amount")).longValue();
            } else {
                BigDecimal monthlyPrice = clanarinaRepository.findByTipClanarine("monthly")
                        .map(Clanarina::getIznosEUR)
                        .orElse(new BigDecimal("5.00"));
                amount = monthlyPrice.multiply(new BigDecimal("100")).longValue();
            }
            
            PaymentIntentCreateParams.Builder paramsBuilder = PaymentIntentCreateParams.builder()
                    .setAmount(amount)
                    .setCurrency("eur")
                    .setAutomaticPaymentMethods(
                            PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                    .setEnabled(true)
                                    .build()
                    )
                    .putMetadata("userId", String.valueOf(userId))
                    .setReceiptEmail(userOpt.map(Korisnik::getEmail).orElse(null));

            if (data.containsKey("billing")) {
                paramsBuilder.putMetadata("billing", (String) data.get("billing"));
            }

            PaymentIntent intent = PaymentIntent.create(paramsBuilder.build());

            Map<String, String> responseData = new HashMap<>();
            responseData.put("clientSecret", intent.getClientSecret());
            responseData.put("id", intent.getId());

            return ResponseEntity.ok(responseData);
        } catch (StripeException e) {
            System.out.println("[DEBUG_LOG] Stripe error in createPaymentIntent: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/confirm-success")
    public ResponseEntity<?> confirmSuccess(@RequestBody Map<String, Object> data) {
        try {
            Long userId = null;
            if (data.get("userId") instanceof Number) {
                userId = ((Number) data.get("userId")).longValue();
            } else if (data.get("userId") instanceof String) {
                userId = Long.parseLong((String) data.get("userId"));
            }

            String paymentIntentId = (String) data.get("paymentIntentId");

            System.out.println("[DEBUG_LOG] Manual confirmation received for userId: " + userId + ", PI: " + paymentIntentId);

            if (userId == null) {
                return ResponseEntity.badRequest().body("Missing userId");
            }
            if (paymentIntentId == null || paymentIntentId.isBlank()) {
                return ResponseEntity.badRequest().body("Missing paymentIntentId");
            }

            try {
                PaymentIntent pi = PaymentIntent.retrieve(paymentIntentId);
                if (pi == null) return ResponseEntity.status(404).body("PaymentIntent not found");
                String st = pi.getStatus();
                if (!"succeeded".equalsIgnoreCase(st)) {
                    return ResponseEntity.status(409).body(Map.of(
                            "status", "not_paid",
                            "paymentIntentStatus", st == null ? "unknown" : st,
                            "message", "PaymentIntent is not succeeded"
                    ));
                }
            } catch (StripeException se) {
                return ResponseEntity.status(502).body(Map.of("message", "Stripe error: " + se.getMessage()));
            }

            Optional<Korisnik> userOpt = korisnikRepository.findById(userId);
            if (userOpt.isPresent()) {
                if ("BLOCKED".equalsIgnoreCase(userOpt.get().getStatus())) {
                    return ResponseEntity.status(403).body("User is blocked");
                }
                String billing = (String) data.getOrDefault("billing", "monthly");

                Optional<Placa> result = subscriptionService.activateSubscription(userId, billing, paymentIntentId);
                if (result.isPresent()) {
                    System.out.println("[DEBUG_LOG] User " + userId + " subscription confirmed via manual call.");
                    return ResponseEntity.ok(Map.of(
                            "status", "success",
                            "isSubscribed", true,
                            "subscriptionEndDate", result.get().getDatvrKrajClanarine()
                    ));
                } else {
                    return ResponseEntity.status(400).body("Could not activate subscription");
                }
            }
            return ResponseEntity.status(404).body("User not found");
        } catch (Exception e) {
            System.out.println("[DEBUG_LOG] Error in confirmSuccess: " + e.getMessage());
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }

    @PostMapping("/stripe/cart-checkout-session")
    public ResponseEntity<?> createStripeCartCheckoutSession(@RequestBody Map<String, Object> data) {
        try {
            String checkoutId = (String) data.get("checkoutId");
            Map<String, Object> prepared = checkoutStore.get(checkoutId);
            if (prepared == null) return ResponseEntity.status(404).body(Map.of("message", "Checkout not found"));
            Long userId = ((Number) prepared.get("userId")).longValue();
            Double total = (Double) prepared.get("total");
            long amount = Math.round(total * 100);

            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amount)
                    .setCurrency("eur")
                    .setAutomaticPaymentMethods(
                            PaymentIntentCreateParams.AutomaticPaymentMethods.builder().setEnabled(true).build()
                    )
                    .putMetadata("checkoutId", checkoutId)
                    .putMetadata("userId", String.valueOf(userId))
                    .build();

            PaymentIntent intent = PaymentIntent.create(params);
            return ResponseEntity.ok(Map.of("clientSecret", intent.getClientSecret(), "id", intent.getId()));
        } catch (StripeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/confirm-cart-success")
    public ResponseEntity<?> confirmCartSuccess(@RequestBody Map<String, Object> data) {
        try {
            String checkoutId = (String) data.get("checkoutId");
            String paymentIntentId = (String) data.get("paymentIntentId");
            Map<String, Object> prepared = checkoutStore.get(checkoutId);
            if (prepared == null) return ResponseEntity.status(404).body(Map.of("message", "Checkout not found"));
            cartService.finalizeCheckout(checkoutId, prepared);
            checkoutStore.remove(checkoutId);
            return ResponseEntity.ok(Map.of("status", "ok"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Server error"));
        }
    }

    @PostMapping("/finalize-by-payment-intent")
    public ResponseEntity<?> finalizeByPaymentIntent(@RequestBody Map<String, Object> data) {
        String paymentIntentId = null;
        String checkoutId = null;
        Long userId = null;
        try {
            paymentIntentId = (String) data.get("paymentIntentId");
            System.out.println("[DEBUG_LOG] finalizeByPaymentIntent called, PI=" + paymentIntentId);
            if (paymentIntentId == null || paymentIntentId.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Missing paymentIntentId"));
            }

            PaymentIntent pi = PaymentIntent.retrieve(paymentIntentId);
            if (pi == null) return ResponseEntity.status(404).body(Map.of("message", "PaymentIntent not found"));

            String piStatus = pi.getStatus();
            if (!"succeeded".equalsIgnoreCase(piStatus)) {
                return ResponseEntity.status(409).body(Map.of(
                        "message", "Payment not successful",
                        "paymentIntentStatus", piStatus == null ? "unknown" : piStatus
                ));
            }

            Map<String, String> meta = pi.getMetadata();
            checkoutId = meta == null ? null : meta.get("checkoutId");
            System.out.println("[DEBUG_LOG] PI metadata checkoutId=" + checkoutId);
            if (checkoutId == null || checkoutId.isBlank()) {
                return ResponseEntity.status(400).body(Map.of("message", "PaymentIntent metadata has no checkoutId"));
            }

            Map<String, Object> prepared = checkoutStore.get(checkoutId);
            if (prepared == null) return ResponseEntity.status(404).body(Map.of("message", "Checkout not found"));

            Object u = prepared.get("userId");
            if (u instanceof Number) userId = ((Number) u).longValue();
            else try { userId = u == null ? null : Long.valueOf(String.valueOf(u)); } catch (Exception ignored) {}

            cartService.finalizeCheckout(checkoutId, prepared);

            checkoutStore.remove(checkoutId);
            if (userId != null) {
                cartService.clearCartForUser(userId);
            }

            return ResponseEntity.ok(Map.of("status", "ok", "checkoutId", checkoutId));
        } catch (StripeException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Stripe error: " + e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", e.getMessage() == null ? e.toString() : e.getMessage()));
        }
    }

    @PostMapping("/paypal/cart-capture")
    public ResponseEntity<?> capturePayPalCart(@RequestBody Map<String, Object> data) {
        try {
            String checkoutId = data.get("checkoutId") == null ? null : String.valueOf(data.get("checkoutId"));
            String transactionId = data.get("transactionId") == null ? null : String.valueOf(data.get("transactionId"));

            if (checkoutId == null || checkoutId.isBlank()) {
                return ResponseEntity.status(400).body(Map.of("message", "Missing checkoutId"));
            }
            if (transactionId == null || transactionId.isBlank()) {
                return ResponseEntity.status(400).body(Map.of("message", "Missing transactionId"));
            }
            if (!payPalService.isConfigured()) {
                return ResponseEntity.status(503).body(Map.of("message", "PayPal is not configured"));
            }

            payPalService.verifyCaptureCompleted(transactionId);

            Map<String, Object> prepared = checkoutStore.get(checkoutId);
            if (prepared == null) return ResponseEntity.status(404).body(Map.of("message", "Checkout not found"));

            cartService.finalizeCheckout(checkoutId, prepared);
            checkoutStore.remove(checkoutId);

            return ResponseEntity.ok(Map.of("status", "paid", "checkoutId", checkoutId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Server error"));
        }
    }
}
