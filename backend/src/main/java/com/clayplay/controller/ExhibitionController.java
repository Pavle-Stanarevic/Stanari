package com.clayplay.controller;

import com.clayplay.dto.ExhibitionApplicationResponse;
import com.clayplay.dto.ExhibitionResponse;
import com.clayplay.model.Izlozba;
import com.clayplay.model.Komentar;
import com.clayplay.model.Korisnik;
import com.clayplay.model.Prijava;
import com.clayplay.repository.IzlozbaRepository;
import com.clayplay.repository.KomentarRepository;
import com.clayplay.repository.PrijavaRepository;
import com.clayplay.repository.KorisnikRepository;
import com.clayplay.service.ExhibitionReservationService;
import com.clayplay.service.ExhibitionService;
import com.clayplay.service.UserService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/exhibitions")
public class ExhibitionController {

    private final ExhibitionService exhibitions;
    private final ExhibitionReservationService reservations;
    private final KomentarRepository komentari;
    private final IzlozbaRepository izlozbe;
    private final PrijavaRepository prijave;
    private final UserService users;
    private final KorisnikRepository korisnici;

    public ExhibitionController(ExhibitionService exhibitions, ExhibitionReservationService reservations, KomentarRepository komentari, IzlozbaRepository izlozbe, PrijavaRepository prijave, UserService users, KorisnikRepository korisnici) {
        this.exhibitions = exhibitions;
        this.reservations = reservations;
        this.komentari = komentari;
        this.izlozbe = izlozbe;
        this.prijave = prijave;
        this.users = users;
        this.korisnici = korisnici;
    }

    @GetMapping
    public List<ExhibitionResponse> list() {
        return exhibitions.listAll();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> create(
            @RequestParam("title") String title,
            @RequestParam("location") String location,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("startDateTime") String startDateTime,
            @RequestParam("organizerId") Long organizerId,
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) {
        try {
            if (users.isBlocked(organizerId)) return ResponseEntity.status(403).body("User is blocked");
            OffsetDateTime when = OffsetDateTime.parse(startDateTime);
            Long id = exhibitions.create(organizerId, title, location, description, when, images);
            Map<String, Object> resp = new HashMap<>();
            resp.put("exhibitionId", id);
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Server error");
        }
    }

    @PostMapping("/{id}/apply")
    public ResponseEntity<?> apply(@PathVariable("id") Long exhibitionId, @RequestBody(required = false) Map<String, Object> body) {
        try {
            if (body == null || body.get("userId") == null) return ResponseEntity.badRequest().body("Missing userId");
            Long userId = ((Number) body.get("userId")).longValue();
            if (users.isBlocked(userId)) return ResponseEntity.status(403).body("User is blocked");
            Long id = reservations.apply(userId, exhibitionId);
            return ResponseEntity.ok(new HashMap<String, Object>() {{ put("applicationId", id); }});
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Server error");
        }
    }

    @GetMapping("/reserved")
    public ResponseEntity<?> reservedForUser(@RequestParam("userId") Long userId) {
        try {
            if (users.isBlocked(userId)) return ResponseEntity.status(403).body("User is blocked");
            List<Long> ids = reservations.reservedExhibitionIds(userId);
            return ResponseEntity.ok(ids);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Server error");
        }
    }

    @GetMapping("/applications")
    public ResponseEntity<?> applicationsForUser(@RequestParam("userId") Long userId) {
        try {
            if (users.isBlocked(userId)) return ResponseEntity.status(403).body("User is blocked");
            List<ExhibitionApplicationResponse> apps = reservations.applicationStatuses(userId);
            return ResponseEntity.ok(apps);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Server error");
        }
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<?> listComments(@PathVariable("id") Long exhibitionId) {
        try {
            List<Komentar> list = komentari.findByIdIzlozbaOrderByIdKomentarDesc(exhibitionId);
            List<Map<String, Object>> payload = list.stream().map(k -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", k.getIdKomentar());
                m.put("text", k.getTextKomentar());
                m.put("userId", k.getIdKorisnik());
                m.put("replyTo", k.getOdgovaraIdKomentar());
                return m;
            }).toList();
            return ResponseEntity.ok(payload);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Server error");
        }
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<?> createComment(@PathVariable("id") Long exhibitionId, @RequestBody(required = false) Map<String, Object> body) {
        try {
            if (body == null) return ResponseEntity.badRequest().body("Missing payload");
            Object userIdRaw = body.get("userId");
            if (userIdRaw == null) return ResponseEntity.badRequest().body("Missing userId");
            Long userId = ((Number) userIdRaw).longValue();
            if (users.isBlocked(userId)) return ResponseEntity.status(403).body("User is blocked");

            Izlozba iz = izlozbe.findById(exhibitionId).orElse(null);
            if (iz == null) return ResponseEntity.status(404).body("Izložba nije pronađena");
            if (iz.getDatVrIzlozba() == null || iz.getDatVrIzlozba().isAfter(java.time.OffsetDateTime.now())) {
                return ResponseEntity.badRequest().body("Komentar je moguć tek nakon završetka izložbe");
            }

            Prijava prijava = prijave.findByIdKorisnikAndIdIzlozba(userId, exhibitionId).orElse(null);
            if (prijava == null || !"accepted".equalsIgnoreCase(prijava.getStatusIzlozba())) {
                return ResponseEntity.status(403).body("Komentar je dopušten samo za prihvaćene prijave");
            }

            if (komentari.existsByIdIzlozbaAndIdKorisnik(exhibitionId, userId)) {
                return ResponseEntity.badRequest().body("Već ste ostavili komentar za ovu izložbu");
            }

            String text = body.get("text") == null ? "" : String.valueOf(body.get("text")).trim();
            if (text.isBlank()) return ResponseEntity.badRequest().body("Komentar je prazan");
            if (text.length() > 1000) return ResponseEntity.badRequest().body("Komentar je predug");

            Komentar k = new Komentar();
            k.setIdIzlozba(exhibitionId);
            k.setIdKorisnik(userId);
            k.setTextKomentar(text);
            Komentar saved = komentari.save(k);

            Map<String, Object> resp = new HashMap<>();
            resp.put("id", saved.getIdKomentar());
            resp.put("text", saved.getTextKomentar());
            resp.put("userId", saved.getIdKorisnik());
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Server error");
        }
    }

    @GetMapping("/{id}/applications")
    public ResponseEntity<?> listApplicationsForExhibition(
            @PathVariable("id") Long exhibitionId,
            @RequestParam("organizerId") Long organizerId
    ) {
        try {
            if (organizerId == null) return ResponseEntity.badRequest().body("Missing organizerId");
            if (users.isBlocked(organizerId)) return ResponseEntity.status(403).body("User is blocked");

            Izlozba iz = izlozbe.findById(exhibitionId).orElse(null);
            if (iz == null) return ResponseEntity.status(404).body("Izložba nije pronađena");
            if (!organizerId.equals(iz.getIdKorisnik())) {
                return ResponseEntity.status(403).body("Only organizer can view applications");
            }

            List<Map<String, Object>> payload = prijave
                    .findByIdIzlozbaAndStatusIzlozba(exhibitionId, "pending")
                    .stream()
                    .map(p -> {
                        Map<String, Object> m = new HashMap<>();
                        m.put("applicationId", p.getIdPrijava());
                        m.put("status", p.getStatusIzlozba());
                        m.put("userId", p.getIdKorisnik());

                        Korisnik u = korisnici.findById(p.getIdKorisnik()).orElse(null);
                        if (u != null) {
                            m.put("email", u.getEmail());
                            m.put("firstName", u.getIme());
                            m.put("lastName", u.getPrezime());
                        }
                        return m;
                    })
                    .toList();

            return ResponseEntity.ok(payload);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Server error");
        }
    }

    @PatchMapping("/{exhibitionId}/applications/{applicationId}/decision")
    public ResponseEntity<?> decideApplication(
            @PathVariable("exhibitionId") Long exhibitionId,
            @PathVariable("applicationId") Long applicationId,
            @RequestBody(required = false) Map<String, Object> body
    ) {
        try {
            if (body == null) return ResponseEntity.badRequest().body("Missing payload");
            Object organizerRaw = body.get("organizerId");
            if (organizerRaw == null) return ResponseEntity.badRequest().body("Missing organizerId");
            Long organizerId = ((Number) organizerRaw).longValue();
            if (users.isBlocked(organizerId)) return ResponseEntity.status(403).body("User is blocked");

            String decision = body.get("decision") == null ? "" : String.valueOf(body.get("decision")).trim();
            String status;
            if ("ACCEPT".equalsIgnoreCase(decision)) {
                status = "accepted";
            } else if ("REJECT".equalsIgnoreCase(decision)) {
                status = "rejected";
            } else {
                return ResponseEntity.badRequest().body("Invalid decision");
            }

            Izlozba iz = izlozbe.findById(exhibitionId).orElse(null);
            if (iz == null) return ResponseEntity.status(404).body("Izložba nije pronađena");
            if (!organizerId.equals(iz.getIdKorisnik())) {
                return ResponseEntity.status(403).body("Only organizer can decide applications");
            }

            Prijava p = prijave.findByIdPrijavaAndIdIzlozba(applicationId, exhibitionId).orElse(null);
            if (p == null) return ResponseEntity.status(404).body("Prijava nije pronađena");
            if (!"pending".equalsIgnoreCase(p.getStatusIzlozba())) {
                return ResponseEntity.status(409).body("Decision already made");
            }

            p.setStatusIzlozba(status);
            prijave.save(p);
            return ResponseEntity.ok(Map.of("status", status));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Server error");
        }
    }
}
