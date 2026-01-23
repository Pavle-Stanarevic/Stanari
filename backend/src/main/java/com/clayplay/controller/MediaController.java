package com.clayplay.controller;

import com.clayplay.service.FileStorageService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@RestController
public class MediaController {

    private final FileStorageService storage;

    public MediaController(FileStorageService storage) {
        this.storage = storage;
    }

    @GetMapping("/media/{filename:.+}")
    public ResponseEntity<Resource> get(@PathVariable String filename) {
        Path path = storage.resolve(filename);
        if (!Files.exists(path) || !Files.isRegularFile(path)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        FileSystemResource resource = new FileSystemResource(path);
        String ct = null;
        try { ct = Files.probeContentType(path); } catch (IOException ignored) {}
        if (ct == null || ct.isBlank()) ct = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, ct)
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000, immutable")
                .body(resource);
    }
}
