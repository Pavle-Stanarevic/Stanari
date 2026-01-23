package com.clayplay.controller;

import com.clayplay.model.Korisnik;
import com.clayplay.repository.KorisnikRepository;
import com.clayplay.service.SubscriptionService;
import com.clayplay.service.CheckoutStore;
import com.clayplay.service.CartService;
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
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/payments/webhook")
public class WebhookController {

    private static final Logger logger = LoggerFactory.getLogger(WebhookController.class);

    @Value("${stripe.webhook.secret}")
    private String endpointSecret;

    private final SubscriptionService subscriptionService;
    private final KorisnikRepository korisnikRepository;
    private final CheckoutStore checkoutStore;
    private final CartService cartService;

    public WebhookController(SubscriptionService subscriptionService, KorisnikRepository korisnikRepository, CheckoutStore checkoutStore, CartService cartService) {
        this.subscriptionService = subscriptionService;
        this.korisnikRepository = korisnikRepository;
        this.checkoutStore = checkoutStore;
        this.cartService = cartService;
    }

    @PostMapping
    public ResponseEntity<String> handleStripeWebhook(@RequestBody String payload, @RequestHeader("Stripe-Signature") String sigHeader) {
        Event event;

        try {
            if ("whsec_dummy_for_demo".equals(endpointSecret)) {
                logger.warn("Using dummy webhook secret. Skipping signature verification for demo purposes.");
                event = ApiResource.GSON.fromJson(payload, Event.class);
            } else {
                event = Webhook.constructEvent(payload, sigHeader, endpointSecret);
            }
        } catch (Exception e) {
            logger.error("Error parsing webhook: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Webhook Error");
        }

        if ("payment_intent.succeeded".equals(event.getType())) {
            PaymentIntent paymentIntent = (PaymentIntent) event.getDataObjectDeserializer().getObject().orElse(null);
            if (paymentIntent != null) {
                logger.info("PaymentIntent was successful for amount: {}", paymentIntent.getAmount());
                handlePaymentSuccess(paymentIntent);

                String checkoutId = null;
                try {
                    checkoutId = paymentIntent.getMetadata() == null ? null : paymentIntent.getMetadata().get("checkoutId");
                } catch (Exception ex) { }

                if (checkoutId != null) {
                    logger.info("Detected checkoutId in PaymentIntent metadata: {}", checkoutId);
                    Map<String,Object> prepared = checkoutStore.get(checkoutId);
                    if (prepared != null) {
                        try {
                            cartService.finalizeCheckout(checkoutId, prepared);
                            checkoutStore.remove(checkoutId);
                            logger.info("Finalized checkout from webhook: {}", checkoutId);
                        } catch (Exception e) {
                            logger.error("Error finalizing checkout {}: {}", checkoutId, e.getMessage());
                        }
                    } else {
                        logger.warn("CheckoutStore has no entry for checkoutId: {}", checkoutId);
                    }
                }
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
                subscriptionService.activateSubscription(userId, billing, paymentIntent.getId());
            } catch (NumberFormatException e) {
                logger.error("Invalid userId format in metadata: {}", userIdStr);
            }
        } else {
            logger.warn("No userId found in PaymentIntent metadata. Metadata present: {}", paymentIntent.getMetadata());
        }
    }
}
