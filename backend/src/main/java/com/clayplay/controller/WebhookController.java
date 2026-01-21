package com.clayplay.controller;

import com.clayplay.model.Korisnik;
import com.clayplay.repository.KorisnikRepository;
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

import java.util.Optional;

@RestController
@RequestMapping("/api/payments/webhook")
public class WebhookController {

    private static final Logger logger = LoggerFactory.getLogger(WebhookController.class);

    @Value("${stripe.webhook.secret}")
    private String endpointSecret;

    private final KorisnikRepository korisnikRepository;

    public WebhookController(KorisnikRepository korisnikRepository) {
        this.korisnikRepository = korisnikRepository;
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
        logger.info("Handling success for PI: {}, userId metadata: {}", paymentIntent.getId(), userIdStr);
        if (userIdStr != null) {
            try {
                Long userId = Long.parseLong(userIdStr);
                Optional<Korisnik> userOpt = korisnikRepository.findById(userId);
                if (userOpt.isPresent()) {
                    Korisnik user = userOpt.get();
                    user.setSubscribed(true);
                    korisnikRepository.save(user);
                    logger.info("User {} (ID: {}) is now successfully subscribed in DB via Webhook", user.getEmail(), userId);
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
