package com.clayplay.controller;

import com.clayplay.dto.ExhibitionApplicationResponse;
import com.clayplay.dto.ExhibitionResponse;
import com.clayplay.service.ExhibitionReservationService;
import com.clayplay.service.ExhibitionService;
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

    public ExhibitionController(ExhibitionService exhibitions, ExhibitionReservationService reservations) {
        this.exhibitions = exhibitions;
        this.reservations = reservations;
    }

    @GetMapping
    public List<ExhibitionResponse> list() {
        return exhibitions.listAll();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> create(
            @RequestParam("title") String title,
            @RequestParam("location") String location,
            @RequestParam("startDateTime") String startDateTime,
            @RequestParam("organizerId") Long organizerId,
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) {
        try {
            OffsetDateTime when = OffsetDateTime.parse(startDateTime);
            Long id = exhibitions.create(organizerId, title, location, when, images);
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
            List<ExhibitionApplicationResponse> apps = reservations.applicationStatuses(userId);
            return ResponseEntity.ok(apps);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Server error");
        }
    }
}
