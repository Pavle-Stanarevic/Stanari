package com.clayplay.controller;

import com.clayplay.model.Clanarina;
import com.clayplay.model.Korisnik;
import com.clayplay.model.Organizator;
import com.clayplay.repository.AdministratorRepository;
import com.clayplay.repository.ClanarinaRepository;
import com.clayplay.repository.KorisnikRepository;
import com.clayplay.repository.OrganizatorRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final KorisnikRepository korisnikRepository;
    private final OrganizatorRepository organizatorRepository;
    private final AdministratorRepository administratorRepository;
    private final ClanarinaRepository clanarinaRepository;

    public AdminController(
            KorisnikRepository korisnikRepository,
            OrganizatorRepository organizatorRepository,
            AdministratorRepository administratorRepository,
            ClanarinaRepository clanarinaRepository
    ) {
        this.korisnikRepository = korisnikRepository;
        this.organizatorRepository = organizatorRepository;
        this.administratorRepository = administratorRepository;
        this.clanarinaRepository = clanarinaRepository;
    }

    @GetMapping("/users")
    @Transactional(readOnly = true)
    public ResponseEntity<?> listUsers() {
        List<Korisnik> all = korisnikRepository.findAll();
        List<Map<String, Object>> payload = all.stream().map(u -> {
            Long id = u.getIdKorisnik();
            boolean isAdmin = administratorRepository.existsByIdKorisnik(id);
            Organizator org = organizatorRepository.findById(id).orElse(null);
            boolean isOrg = org != null;

            String role = isAdmin ? "ADMIN" : isOrg ? "ORGANIZATOR" : "POLAZNIK";
            String baseStatus = u.getStatus() == null ? "ACTIVE" : u.getStatus();
            String status = "BLOCKED".equalsIgnoreCase(baseStatus)
                    ? "BLOCKED"
                    : (isOrg && "PENDING".equalsIgnoreCase(org.getStatusOrganizator()) ? "PENDING" : "ACTIVE");

            String name = buildDisplayName(u, org);

            Map<String, Object> m = new HashMap<>();
            m.put("id", id);
            m.put("name", name);
            m.put("email", u.getEmail());
            m.put("role", role);
            m.put("status", status);
            m.put("createdAt", "—");
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(payload);
    }

    @PatchMapping("/users/{userId}/block")
    @Transactional
    public ResponseEntity<?> blockUser(@PathVariable Long userId) {
        Korisnik u = korisnikRepository.findById(userId).orElse(null);
        if (u == null) return ResponseEntity.status(404).body("Not found");
        u.setStatus("BLOCKED");
        korisnikRepository.save(u);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/users/{userId}/unblock")
    @Transactional
    public ResponseEntity<?> unblockUser(@PathVariable Long userId) {
        Korisnik u = korisnikRepository.findById(userId).orElse(null);
        if (u == null) return ResponseEntity.status(404).body("Not found");
        u.setStatus("ACTIVE");
        korisnikRepository.save(u);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/pending-profiles")
    @Transactional(readOnly = true)
    public ResponseEntity<?> pendingProfiles() {
        List<Organizator> pending = organizatorRepository
                .findByStatusOrganizatorOrderByIdKorisnikAsc("PENDING");

        List<Map<String, Object>> payload = pending.stream().map(org -> {
            Korisnik u = org.getKorisnik();
            Map<String, Object> m = new HashMap<>();
            m.put("id", org.getIdKorisnik());
            m.put("name", buildDisplayName(u, org));
            m.put("email", u != null ? u.getEmail() : null);
            m.put("phone", u != null ? u.getBrojTelefona() : null);
            m.put("address", u != null ? u.getAdresa() : null);
            m.put("createdAt", "—");
            m.put("status", "PENDING");
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(payload);
    }

    @PatchMapping("/profiles/{organizatorId}/approve")
    @Transactional
    public ResponseEntity<?> approveProfile(@PathVariable Long organizatorId) {
        Organizator org = organizatorRepository.findById(organizatorId).orElse(null);
        if (org == null) return ResponseEntity.status(404).body("Not found");
        org.setStatusOrganizator("APPROVED");
        organizatorRepository.save(org);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/profiles/{organizatorId}/reject")
    @Transactional
    public ResponseEntity<?> rejectProfile(@PathVariable Long organizatorId) {
        Organizator org = organizatorRepository.findById(organizatorId).orElse(null);
        if (org == null) return ResponseEntity.status(404).body("Not found");
        org.setStatusOrganizator("REJECTED");
        organizatorRepository.save(org);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/membership-pricing")
    @Transactional(readOnly = true)
    public ResponseEntity<?> membershipPricing() {
        BigDecimal monthly = clanarinaRepository.findByTipClanarine("monthly")
                .map(Clanarina::getIznosEUR)
                .orElse(new BigDecimal("9.99"));
        BigDecimal yearly = clanarinaRepository.findByTipClanarine("yearly")
                .map(Clanarina::getIznosEUR)
                .orElse(new BigDecimal("89.99"));

        Map<String, Object> resp = new HashMap<>();
        resp.put("monthly", monthly);
        resp.put("yearly", yearly);
        resp.put("currency", "EUR");
        return ResponseEntity.ok(resp);
    }

    @PutMapping("/membership-pricing")
    @Transactional
    public ResponseEntity<?> updateMembershipPricing(@RequestBody Map<String, Object> body) {
        if (body == null) return ResponseEntity.badRequest().body("Missing body");

        BigDecimal monthly = parseAmount(body.get("monthly"));
        BigDecimal yearly = parseAmount(body.get("yearly"));

        if (monthly == null || yearly == null) {
            return ResponseEntity.badRequest().body("Invalid pricing");
        }

        upsertPrice("monthly", monthly);
        upsertPrice("yearly", yearly);

        return ResponseEntity.ok().build();
    }

    private void upsertPrice(String type, BigDecimal amount) {
        Optional<Clanarina> existing = clanarinaRepository.findByTipClanarine(type);
        if (existing.isPresent()) {
            Clanarina c = existing.get();
            c.setIznosEUR(amount);
            clanarinaRepository.save(c);
        } else {
            Clanarina c = new Clanarina();
            c.setTipClanarine(type);
            c.setIznosEUR(amount);
            clanarinaRepository.save(c);
        }
    }

    private BigDecimal parseAmount(Object raw) {
        if (raw == null) return null;
        try {
            return new BigDecimal(String.valueOf(raw).replace(",", "."));
        } catch (Exception e) {
            return null;
        }
    }

    private String buildDisplayName(Korisnik u, Organizator org) {
        if (org != null && org.getImeStudija() != null && !org.getImeStudija().isBlank()) {
            return org.getImeStudija();
        }
        String first = u != null && u.getIme() != null ? u.getIme() : "";
        String last = u != null && u.getPrezime() != null ? u.getPrezime() : "";
        String full = (first + " " + last).trim();
        return !full.isBlank() ? full : (u != null ? u.getEmail() : "Korisnik");
    }
}
