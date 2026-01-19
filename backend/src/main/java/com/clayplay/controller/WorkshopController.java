package com.clayplay.controller;

import com.clayplay.dto.WorkshopRequest;
import com.clayplay.dto.WorkshopResponse;
import com.clayplay.service.WorkshopService;
import com.clayplay.service.ReservationService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workshops")
public class WorkshopController {

    private final WorkshopService service;
    private final ReservationService reservations;

    public WorkshopController(WorkshopService service, ReservationService reservations) {
        this.service = service;
        this.reservations = reservations;
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody WorkshopRequest req) {
        try {
            Long id = service.create(req);
            Map<String, Object> resp = new HashMap<>();
            resp.put("workshopId", id);
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Server error");
        }
    }

    @GetMapping
    public List<WorkshopResponse> list() {
        return service.listRecent(100);
    }

    @GetMapping("/{id}/photos")
    public ResponseEntity<?> listPhotos(@PathVariable("id") Long workshopId) {
        try {
            return ResponseEntity.ok(service.listPhotoUrls(workshopId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Server error");
        }
    }

    @PostMapping(path = "/{id}/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadPhotos(
            @PathVariable("id") Long workshopId,
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) {
        try {
            return ResponseEntity.ok(service.addPhotos(workshopId, images));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Server error");
        }
    }

    @PostMapping("/{id}/apply")
    public ResponseEntity<?> apply(@PathVariable("id") Long workshopId, @RequestBody(required = false) Map<String, Object> body) {
        try {
            if (body == null || body.get("userId") == null) return ResponseEntity.badRequest().body("Missing userId");
            Long userId = ((Number) body.get("userId")).longValue();
            Long resId = reservations.apply(userId, workshopId);
            return ResponseEntity.ok(new java.util.HashMap<String, Object>() {{ put("reservationId", resId); }});
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            String msg = e.getMessage();
            if (msg != null && msg.contains("Nema slobodnih mjesta")) {
                return ResponseEntity.status(409).body("Nema slobodnih mjesta");
            }
            return ResponseEntity.status(500).body("Server error");
        }
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancel(@PathVariable("id") Long workshopId, @RequestBody(required = false) Map<String, Object> body) {
        try {
            if (body == null || body.get("userId") == null) return ResponseEntity.badRequest().body("Missing userId");
            Long userId = ((Number) body.get("userId")).longValue();
            reservations.cancel(userId, workshopId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            String msg = e.getMessage();
            if (msg != null && msg.contains("otkazati manje od 2 dana")) {
                return ResponseEntity.status(409).body(msg);
            }
            return ResponseEntity.status(500).body("Server error");
        }
    }

    @GetMapping("/reserved")
    public ResponseEntity<?> reservedForUser(@RequestParam("userId") Long userId) {
        try {
            List<Long> ids = reservations.reservedWorkshopIds(userId);
            return ResponseEntity.ok(ids);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Server error");
        }
    }
}
