package com.clayplay.controller;

import com.clayplay.model.Clanarina;
import com.clayplay.model.Korisnik;
import com.clayplay.model.Placa;
import com.clayplay.repository.ClanarinaRepository;
import com.clayplay.repository.KorisnikRepository;
import com.clayplay.repository.PlacaRepository;
import com.clayplay.service.SubscriptionService;
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

    public PaymentController(KorisnikRepository korisnikRepository, ClanarinaRepository clanarinaRepository, PlacaRepository placaRepository, SubscriptionService subscriptionService) {
        this.korisnikRepository = korisnikRepository;
        this.clanarinaRepository = clanarinaRepository;
        this.placaRepository = placaRepository;
        this.subscriptionService = subscriptionService;
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
}
