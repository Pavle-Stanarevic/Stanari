package com.clayplay.service;

import com.clayplay.model.Clanarina;
import com.clayplay.model.Korisnik;
import com.clayplay.model.Placa;
import com.clayplay.repository.ClanarinaRepository;
import com.clayplay.repository.KorisnikRepository;
import com.clayplay.repository.PlacaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Optional;

@Service
public class SubscriptionService {

    private static final Logger logger = LoggerFactory.getLogger(SubscriptionService.class);

    private final KorisnikRepository korisnikRepository;
    private final PlacaRepository placaRepository;
    private final ClanarinaRepository clanarinaRepository;

    public SubscriptionService(KorisnikRepository korisnikRepository, PlacaRepository placaRepository, ClanarinaRepository clanarinaRepository) {
        this.korisnikRepository = korisnikRepository;
        this.placaRepository = placaRepository;
        this.clanarinaRepository = clanarinaRepository;
    }

    @Transactional
    public synchronized Optional<Placa> activateSubscription(Long userId, String billing, String paymentIntentId) {
        logger.info("Activating subscription for user: {}, billing: {}, PI: {}", userId, billing, paymentIntentId);

        if (paymentIntentId != null && placaRepository.existsByStripePaymentIntentId(paymentIntentId)) {
            logger.info("PaymentIntent {} already processed, skipping.", paymentIntentId);
            return placaRepository.findFirstByIdKorisnikOrderByDatvrKrajClanarineDesc(userId);
        }

        Optional<Korisnik> userOpt = korisnikRepository.findById(userId);
        if (userOpt.isEmpty()) {
            logger.error("User with ID {} not found", userId);
            return Optional.empty();
        }

        String actualBilling = (billing == null) ? "monthly" : billing;
        Optional<Clanarina> clanarinaOpt = clanarinaRepository.findByTipClanarine(actualBilling);
        if (clanarinaOpt.isEmpty()) {
            logger.error("Clanarina type '{}' not found", actualBilling);
            return Optional.empty();
        }

        Clanarina clanarina = clanarinaOpt.get();
        Placa placa = new Placa();
        placa.setIdKorisnik(userId);
        placa.setIdClanarina(clanarina.getIdClanarina());
        placa.setStripePaymentIntentId(paymentIntentId);

        OffsetDateTime now = OffsetDateTime.now();
        placa.setDatvrPocetakClanarine(now);

        if ("monthly".equalsIgnoreCase(actualBilling)) {
            placa.setDatvrKrajClanarine(now.plusMonths(1));
        } else if ("yearly".equalsIgnoreCase(actualBilling)) {
            placa.setDatvrKrajClanarine(now.plusYears(1));
        } else {
            placa.setDatvrKrajClanarine(now.plusMonths(1));
        }

        Placa saved = placaRepository.save(placa);
        logger.info("Subscription activated for user {}. Valid until: {}", userId, saved.getDatvrKrajClanarine());
        return Optional.of(saved);
    }
}
