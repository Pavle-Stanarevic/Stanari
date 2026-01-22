package com.clayplay.service;

import com.clayplay.model.Korisnik;
import com.clayplay.model.Organizator;
import com.clayplay.model.Polaznik;
import com.clayplay.model.Proizvod;
import com.clayplay.repository.KorisnikRepository;
import com.clayplay.repository.OrganizatorRepository;
import com.clayplay.repository.PolaznikRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ProductNotificationEmailService {

    private static final Logger log = LoggerFactory.getLogger(ProductNotificationEmailService.class);

    private final JavaMailSender mailSender;
    private final PolaznikRepository polaznikRepository;
    private final KorisnikRepository korisnikRepository;
    private final OrganizatorRepository organizatorRepository;
    private final String fromAddress;

    public ProductNotificationEmailService(
            JavaMailSender mailSender,
            PolaznikRepository polaznikRepository,
            KorisnikRepository korisnikRepository,
            OrganizatorRepository organizatorRepository,
            @Qualifier("mailFromAddress") String fromAddress
    ) {
        this.mailSender = mailSender;
        this.polaznikRepository = polaznikRepository;
        this.korisnikRepository = korisnikRepository;
        this.organizatorRepository = organizatorRepository;
        this.fromAddress = fromAddress;
    }

    @Transactional(readOnly = true)
    public void notifyAllSubscribedPolaznici(Long organizerId, Proizvod product) {
        if (organizerId == null || product == null) return;

        String organizerName = resolveOrganizerDisplayName(organizerId);
        String productTitle = safe(product.getOpisProizvod(), "Novi proizvod").trim();
        String category = safe(product.getKategorijaProizvod(), "").trim();
        BigDecimal price = product.getCijenaProizvod();

        List<Polaznik> polaznici = polaznikRepository.findAll();
        int eligible = 0;
        int sent = 0;
        int skipped = 0;

        for (Polaznik p : polaznici) {
            try {
                if (p == null || !p.isZeliObavijesti()) continue;
                eligible++;

                Korisnik k = p.getKorisnik();
                if (k == null) {
                    k = korisnikRepository.findById(p.getIdKorisnik()).orElse(null);
                }
                if (k == null) {
                    skipped++;
                    continue;
                }

                if ("BLOCKED".equalsIgnoreCase(String.valueOf(k.getStatus()))) {
                    skipped++;
                    continue;
                }

                String to = safe(k.getEmail(), "").trim();
                if (to.isBlank()) {
                    skipped++;
                    continue;
                }

                String firstName = safe(k.getIme(), "").trim();
                String greetingName = firstName.isBlank() ? "" : (" " + firstName);

                StringBuilder text = new StringBuilder();
                text.append("Pozdrav").append(greetingName).append("!\n\n");
                text.append("Organizator ").append(organizerName)
                        .append(" je upravo dodao novi proizvod u trgovinu: \"")
                        .append(productTitle)
                        .append("\".\n\n");

                if (!category.isBlank()) {
                    text.append("Kategorija: ").append(category).append("\n");
                }
                if (price != null) {
                    text.append("Cijena: ").append(price).append(" €\n");
                }

                text.append("\nProvjerite ponudu u aplikaciji.\n");
                text.append("\nLijep pozdrav,\nClayPlay\n");

                SimpleMailMessage msg = new SimpleMailMessage();
                if (fromAddress != null && !fromAddress.isBlank()) {
                    msg.setFrom(fromAddress);
                }
                msg.setTo(to);
                msg.setSubject("Novi proizvod u trgovini: " + productTitle);
                msg.setText(text.toString());

                mailSender.send(msg);
                sent++;
            } catch (Exception e) {
                log.warn("Failed to send product notification email", e);
            }
        }

        log.info("Product notifications finished. eligible={}, sent={}, skipped={}, organizerId={}, proizvodId={}",
                eligible, sent, skipped, organizerId, product.getProizvodId());

        if (eligible == 0) {
            log.warn("No subscribed polaznici found (POLAZNIK.zeliobavijesti=true). No emails attempted.");
        } else if (sent == 0) {
            log.warn("Subscribed polaznici exist but no emails were sent. Check KORISNIK.status, missing emails, and mail.from configuration.");
        }
    }

    private String resolveOrganizerDisplayName(Long organizerId) {
        try {
            Organizator org = organizatorRepository.findById(organizerId).orElse(null);
            if (org != null) {
                if (org.getImeStudija() != null && !org.getImeStudija().isBlank()) return org.getImeStudija();
                Korisnik k = org.getKorisnik();
                if (k != null) {
                    String full = (safe(k.getIme(), "") + " " + safe(k.getPrezime(), "")).trim();
                    if (!full.isBlank()) return full;
                    String email = safe(k.getEmail(), "").trim();
                    if (!email.isBlank()) return email;
                }
            }
        } catch (Exception ignored) {
        }
        return "organizator";
    }

    private static String safe(String v, String fallback) {
        if (v == null) return fallback;
        String s = String.valueOf(v);
        return s.isBlank() ? fallback : s;
    }
}
