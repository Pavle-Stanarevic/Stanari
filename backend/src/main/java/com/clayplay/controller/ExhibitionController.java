package com.clayplay.controller;

import com.clayplay.dto.ExhibitionApplicationResponse;
import com.clayplay.dto.ExhibitionResponse;
import com.clayplay.model.Izlozba;
import com.clayplay.model.Komentar;
import com.clayplay.repository.IzlozbaRepository;
import com.clayplay.repository.KomentarRepository;
import com.clayplay.repository.PrijavaRepository;
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

    public ExhibitionController(ExhibitionService exhibitions, ExhibitionReservationService reservations, KomentarRepository komentari, IzlozbaRepository izlozbe, PrijavaRepository prijave, UserService users) {
        this.exhibitions = exhibitions;
        this.reservations = reservations;
        this.komentari = komentari;
        this.izlozbe = izlozbe;
        this.prijave = prijave;
        this.users = users;
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

            if (prijave.findByIdKorisnikAndIdIzlozba(userId, exhibitionId).isEmpty()) {
                return ResponseEntity.status(403).body("Komentar je dopušten samo za izložbe na koje ste se prijavili");
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
}
