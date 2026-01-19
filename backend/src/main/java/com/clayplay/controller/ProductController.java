package com.clayplay.controller;

import com.clayplay.dto.ProductResponse;
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

    public ProductController(ProductService products, UserService users) {
        this.products = products;
        this.users = users;
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
            if (!users.isPolaznik(userId)) return ResponseEntity.status(403).body("Only polaznik can buy products");
            return ResponseEntity.ok(products.markPurchased(id, userId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
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
            if (!users.isOrganizator(userId)) return ResponseEntity.status(403).body("Only organizator can create products");

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
