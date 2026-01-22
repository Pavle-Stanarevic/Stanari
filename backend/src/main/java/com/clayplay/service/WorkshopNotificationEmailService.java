package com.clayplay.service;

import com.clayplay.model.Korisnik;
import com.clayplay.model.Organizator;
import com.clayplay.model.Polaznik;
import com.clayplay.model.Radionica;
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

import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class WorkshopNotificationEmailService {

    private static final Logger log = LoggerFactory.getLogger(WorkshopNotificationEmailService.class);

    private final JavaMailSender mailSender;
    private final PolaznikRepository polaznikRepository;
    private final KorisnikRepository korisnikRepository;
    private final OrganizatorRepository organizatorRepository;
    private final String fromAddress;

    public WorkshopNotificationEmailService(
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
    public void notifyAllSubscribedPolaznici(Long organizerId, Radionica workshop) {
        if (organizerId == null || workshop == null) return;

        String organizerName = resolveOrganizerDisplayName(organizerId);
        String workshopTitle = safe(workshop.getNazivRadionica(), "Nova radionica");
        String description = safe(workshop.getOpisRadionica(), "").trim();
        String location = safe(workshop.getLokacijaRadionica(), "").trim();

        String when = "";
        try {
            if (workshop.getDatVrRadionica() != null) {
                when = workshop.getDatVrRadionica()
                        .toLocalDateTime()
                        .format(DateTimeFormatter.ofPattern("dd.MM.yyyy. HH:mm"));
            }
        } catch (Exception ignored) {
        }

        List<Polaznik> polaznici = polaznikRepository.findAll();
        int eligible = 0;
        int sent = 0;
        int skipped = 0;
        boolean loggedOne = false;

        for (Polaznik p : polaznici) {
            try {
                if (p == null || !p.isZeliObavijesti()) {
                    continue;
                }
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

                if (!loggedOne) {
                    loggedOne = true;
                    log.info("Workshop notification candidate: polaznikId={}, email={}, zeliObavijesti={}, from={}",
                            p.getIdKorisnik(), to, p.isZeliObavijesti(), fromAddress);
                }

                String firstName = safe(k.getIme(), "").trim();
                String greetingName = firstName.isBlank() ? "" : (" " + firstName);

                StringBuilder text = new StringBuilder();
                text.append("Pozdrav").append(greetingName).append("!\n\n");
                text.append("Organizator ").append(organizerName)
                        .append(" je upravo otvorio novu radionicu \"")
                        .append(workshopTitle)
                        .append("\".\n\n");

                if (!when.isBlank()) {
                    text.append("Vrijeme: ").append(when).append("\n");
                }
                if (!location.isBlank()) {
                    text.append("Lokacija: ").append(location).append("\n");
                }
                if (!description.isBlank()) {
                    text.append("\nOpis radionice:\n").append(description).append("\n");
                }

                text.append("\nVidimo se!\n");
                text.append("ClayPlay\n");

                SimpleMailMessage msg = new SimpleMailMessage();
                if (fromAddress != null && !fromAddress.isBlank()) {
                    msg.setFrom(fromAddress);
                }
                msg.setTo(to);
                msg.setSubject("Nova radionica: " + workshopTitle);
                msg.setText(text.toString());

                mailSender.send(msg);
                sent++;
            } catch (Exception e) {
                log.warn("Failed to send workshop notification email", e);
            }
        }

        log.info("Workshop notifications finished. eligible={}, sent={}, skipped={}, organizerId={}, workshopId={}",
                eligible, sent, skipped, organizerId, workshop.getIdRadionica());

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
