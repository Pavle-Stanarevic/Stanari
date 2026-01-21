package com.clayplay.controller;

import com.clayplay.model.Clanarina;
import com.clayplay.model.Korisnik;
import com.clayplay.model.Placa;
import com.clayplay.repository.ClanarinaRepository;
import com.clayplay.repository.KorisnikRepository;
import com.clayplay.repository.PlacaRepository;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.ApiResource;
import com.stripe.net.Webhook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.Optional;

@RestController
@RequestMapping("/api/payments/webhook")
public class WebhookController {

    private static final Logger logger = LoggerFactory.getLogger(WebhookController.class);

    @Value("${stripe.webhook.secret}")
    private String endpointSecret;

    private final KorisnikRepository korisnikRepository;
    private final PlacaRepository placaRepository;
    private final ClanarinaRepository clanarinaRepository;

    public WebhookController(KorisnikRepository korisnikRepository, PlacaRepository placaRepository, ClanarinaRepository clanarinaRepository) {
        this.korisnikRepository = korisnikRepository;
        this.placaRepository = placaRepository;
        this.clanarinaRepository = clanarinaRepository;
    }

    @PostMapping
    @Transactional
    public ResponseEntity<String> handleStripeWebhook(@RequestBody String payload, @RequestHeader("Stripe-Signature") String sigHeader) {
        Event event;

        try {
            event = Webhook.constructEvent(payload, sigHeader, endpointSecret);
        } catch (Exception e) {
            logger.error("Error parsing webhook: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Webhook Error");
        }

        if ("payment_intent.succeeded".equals(event.getType())) {
            PaymentIntent paymentIntent = (PaymentIntent) event.getDataObjectDeserializer().getObject().orElse(null);
            if (paymentIntent != null) {
                logger.info("PaymentIntent was successful for amount: {}", paymentIntent.getAmount());
                handlePaymentSuccess(paymentIntent);
            }
        } else {
            logger.info("Received event type: {}", event.getType());
        }

        return ResponseEntity.ok("Success");
    }

    private void handlePaymentSuccess(PaymentIntent paymentIntent) {
        String userIdStr = paymentIntent.getMetadata().get("userId");
        String billing = paymentIntent.getMetadata().get("billing");
        
        logger.info("Handling success for PI: {}, userId metadata: {}, billing: {}", paymentIntent.getId(), userIdStr, billing);
        
        if (userIdStr != null) {
            try {
                Long userId = Long.parseLong(userIdStr);
                Optional<Korisnik> userOpt = korisnikRepository.findById(userId);
                if (userOpt.isPresent()) {
                    if (billing == null) {
                        billing = "monthly";
                    }
                    
                    Optional<Clanarina> clanarinaOpt = clanarinaRepository.findByTipClanarine(billing);
                    if (clanarinaOpt.isPresent()) {
                        Clanarina clanarina = clanarinaOpt.get();
                        
                        String piId = paymentIntent.getId();
                        if (piId != null && placaRepository.existsByStripePaymentIntentId(piId)) {
                            logger.info("Payment {} already processed, skipping", piId);
                            return;
                        }

                        Placa placa = new Placa();
                        placa.setIdKorisnik(userId);
                        placa.setIdClanarina(clanarina.getIdClanarina());
                        placa.setStripePaymentIntentId(piId);
                        
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
                        logger.info("User ID: {} successfully subscribed with plan: {}. Valid until: {}", userId, billing, placa.getDatvrKrajClanarine());
                    } else {
                        logger.error("Clanarina type '{}' not found in database", billing);
                    }
                } else {
                    logger.error("User with ID {} not found in database", userId);
                }
            } catch (NumberFormatException e) {
                logger.error("Invalid userId format in metadata: {}", userIdStr);
            }
        } else {
            logger.warn("No userId found in PaymentIntent metadata. Metadata present: {}", paymentIntent.getMetadata());
        }
    }
}
