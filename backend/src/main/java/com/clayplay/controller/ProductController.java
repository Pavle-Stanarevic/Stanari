package com.clayplay.controller;

import com.clayplay.dto.ProductResponse;
import com.clayplay.model.Recenzija;
import com.clayplay.repository.KupovinaRepository;
import com.clayplay.repository.RecenzijaRepository;
import com.clayplay.service.ProductService;
import com.clayplay.service.UserService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService products;
    private final UserService users;
    private final RecenzijaRepository recenzije;
    private final KupovinaRepository kupovine;

    public ProductController(ProductService products, UserService users, RecenzijaRepository recenzije, KupovinaRepository kupovine) {
        this.products = products;
        this.users = users;
        this.recenzije = recenzije;
        this.kupovine = kupovine;
    }

    @GetMapping
    public List<ProductResponse> list() {
        return products.listAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable("id") Long id) {
        try {
            return ResponseEntity.ok(products.getById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body("Not found");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Server error");
        }
    }

    @PostMapping("/{id}/buy")
    public ResponseEntity<?> buy(@PathVariable("id") Long id, @RequestBody(required = false) Map<String, Object> body) {
        try {
            if (body == null || body.get("userId") == null) return ResponseEntity.badRequest().body("Missing userId");
            Long userId = ((Number) body.get("userId")).longValue();
            if (users.isBlocked(userId)) return ResponseEntity.status(403).body("User is blocked");
            if (!users.isPolaznik(userId)) return ResponseEntity.status(403).body("Only polaznik can buy products");
            return ResponseEntity.ok(products.markPurchased(id, userId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Server error");
        }
    }

    @GetMapping("/{id}/reviews")
    public ResponseEntity<?> listReviews(@PathVariable("id") Long id) {
        try {
            List<Recenzija> list = recenzije.findByProizvodIdOrderByIdRecenzijaDesc(id);
            List<Map<String, Object>> payload = list.stream().map(r -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", r.getIdRecenzija());
                m.put("rating", r.getOcjena());
                m.put("text", r.getTextRecenzija());
                m.put("userId", r.getIdKorisnik());
                return m;
            }).toList();
            return ResponseEntity.ok(payload);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Server error");
        }
    }

    @PostMapping("/{id}/reviews")
    public ResponseEntity<?> createReview(@PathVariable("id") Long id, @RequestBody(required = false) Map<String, Object> body) {
        try {
            if (body == null) return ResponseEntity.badRequest().body("Missing payload");
            Object userIdRaw = body.get("userId");
            if (userIdRaw == null) return ResponseEntity.badRequest().body("Missing userId");
            Long userId = ((Number) userIdRaw).longValue();

            if (users.isBlocked(userId)) return ResponseEntity.status(403).body("User is blocked");
            if (!users.isPolaznik(userId)) return ResponseEntity.status(403).body("Only polaznik can review products");
            if (!kupovine.existsByIdKorisnikAndProizvodId(userId, id)) {
                return ResponseEntity.status(403).body("Only buyers can review this product");
            }
            if (recenzije.existsByProizvodIdAndIdKorisnik(id, userId)) {
                return ResponseEntity.badRequest().body("Recenzija već postoji za ovaj proizvod");
            }

            Integer rating = null;
            try { rating = body.get("rating") == null ? null : ((Number) body.get("rating")).intValue(); } catch (Exception ignored) {}
            String text = body.get("text") == null ? null : String.valueOf(body.get("text")).trim();

            if (rating == null || rating < 1 || rating > 5) {
                return ResponseEntity.badRequest().body("Ocjena mora biti između 1 i 5");
            }
            if (text != null && text.length() > 1000) {
                return ResponseEntity.badRequest().body("Tekst recenzije je predug");
            }

            Recenzija r = new Recenzija();
            r.setProizvodId(id);
            r.setIdKorisnik(userId);
            r.setOcjena(rating);
            r.setTextRecenzija(text);
            Recenzija saved = recenzije.save(r);

            Map<String, Object> resp = new HashMap<>();
            resp.put("id", saved.getIdRecenzija());
            resp.put("rating", saved.getOcjena());
            resp.put("text", saved.getTextRecenzija());
            resp.put("userId", saved.getIdKorisnik());
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Server error");
        }
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createMultipart(
            @RequestParam("userId") Long userId,
            @RequestParam("opisProizvod") String opisProizvod,
            @RequestParam("cijenaProizvod") String cijenaProizvod,
            @RequestParam("kategorijaProizvod") String kategorijaProizvod,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        try {
            if (userId == null) return ResponseEntity.badRequest().body("Missing userId");
            if (users.isBlocked(userId)) return ResponseEntity.status(403).body("User is blocked");
            if (!users.isApprovedOrganizator(userId)) return ResponseEntity.status(403).body("Only approved organizator can create products");
            if (!users.hasActiveSubscription(userId)) return ResponseEntity.status(403).body("Active subscription is required");

            BigDecimal cijena;
            try { cijena = new BigDecimal(cijenaProizvod); } catch (Exception e) { return ResponseEntity.badRequest().body("Invalid price"); }

            byte[] bytes = null; String contentType = null;
            if (image != null && !image.isEmpty()) {
                try { bytes = image.getBytes(); } catch (Exception ignored) {}
                contentType = image.getContentType();
            }

            Long id = products.create(userId, opisProizvod, cijena, kategorijaProizvod, bytes, contentType);
            Map<String, Object> resp = new HashMap<>();
            resp.put("proizvodId", id);
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Server error");
        }
    }
}
