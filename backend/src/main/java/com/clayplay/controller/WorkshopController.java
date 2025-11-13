package com.clayplay.controller;

import com.clayplay.dto.WorkshopRequest;
import com.clayplay.dto.WorkshopResponse;
import com.clayplay.service.WorkshopService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workshops")
public class WorkshopController {

    private final WorkshopService service;

    public WorkshopController(WorkshopService service) {
        this.service = service;
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
}
