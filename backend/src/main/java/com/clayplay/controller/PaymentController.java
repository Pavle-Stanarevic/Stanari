package com.clayplay.controller;

import com.clayplay.model.Clanarina;
import com.clayplay.model.Korisnik;
import com.clayplay.model.Placa;
import com.clayplay.repository.ClanarinaRepository;
import com.clayplay.repository.KorisnikRepository;
import com.clayplay.repository.PlacaRepository;
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

    public PaymentController(KorisnikRepository korisnikRepository, ClanarinaRepository clanarinaRepository, PlacaRepository placaRepository) {
        this.korisnikRepository = korisnikRepository;
        this.clanarinaRepository = clanarinaRepository;
        this.placaRepository = placaRepository;
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
                    .setReceiptEmail(korisnikRepository.findById(userId).map(Korisnik::getEmail).orElse(null));

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
    @Transactional
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
                String billing = (String) data.getOrDefault("billing", "monthly");
                
                Optional<Clanarina> clanarinaOpt = clanarinaRepository.findByTipClanarine(billing);
                if (clanarinaOpt.isPresent()) {
                    Clanarina clanarina = clanarinaOpt.get();
                    
                    if (paymentIntentId != null && placaRepository.existsByStripePaymentIntentId(paymentIntentId)) {
                        System.out.println("[DEBUG_LOG] Payment " + paymentIntentId + " already processed, skipping manual confirmation.");

                        return placaRepository.findFirstByIdKorisnikOrderByDatvrKrajClanarineDesc(userId)
                            .map(p -> ResponseEntity.ok(Map.of("status", "success", "isSubscribed", true, "subscriptionEndDate", p.getDatvrKrajClanarine())))
                            .orElse(ResponseEntity.ok(Map.of("status", "success", "isSubscribed", true)));
                    }

                    Placa placa = new Placa();
                    placa.setIdKorisnik(userId);
                    placa.setIdClanarina(clanarina.getIdClanarina());
                    placa.setStripePaymentIntentId(paymentIntentId);
                    
                    OffsetDateTime now = OffsetDateTime.now();
                    placa.setDatvrPocetakClanarine(now);
                    
                    if ("monthly".equalsIgnoreCase(billing)) {
                        placa.setDatvrKrajClanarine(now.plusMonths(1));
                    } else if ("yearly".equalsIgnoreCase(billing)) {
                        placa.setDatvrKrajClanarine(now.plusYears(1));
                    } else {
                        placa.setDatvrKrajClanarine(now.plusMonths(1));
                    }
                    
                    placaRepository.save(placa);
                    System.out.println("[DEBUG_LOG] User " + userId + " marked as subscribed via manual confirmation (plan: " + billing + ").");
                    return ResponseEntity.ok(Map.of("status", "success", "isSubscribed", true, "subscriptionEndDate", placa.getDatvrKrajClanarine()));
                } else {
                    return ResponseEntity.status(400).body("Clanarina type not found");
                }
            }
            return ResponseEntity.status(404).body("User not found");
        } catch (Exception e) {
            System.out.println("[DEBUG_LOG] Error in confirmSuccess: " + e.getMessage());
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }
}
