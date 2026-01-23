package com.clayplay.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    private Path root;

    @PostConstruct
    public void init() {
        this.root = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.root);
        } catch (IOException e) {
            throw new RuntimeException("Unable to create upload directory", e);
        }
    }

    public String save(byte[] data, String contentType) {
        if (data == null || data.length == 0) throw new IllegalArgumentException("Empty file");
        String ext = extensionFromContentType(contentType);
        String filename = UUID.randomUUID().toString().replace("-", "") + ext;
        Path target = this.root.resolve(filename);
        try {
            Files.write(target, data);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
        return "/media/" + filename;
    }

    public Path resolve(String filename) {
        return this.root.resolve(filename).normalize();
    }

    private static String extensionFromContentType(String ct) {
        if (ct == null || ct.isBlank()) return ".bin";
        String c = ct.toLowerCase(Locale.ROOT);
        if (c.equals("image/jpeg") || c.equals("image/jpg")) return ".jpg";
        if (c.equals("image/png")) return ".png";
        if (c.equals("image/webp")) return ".webp";
        if (c.equals("image/gif")) return ".gif";
        if (c.equals("image/svg+xml")) return ".svg";
        if (c.startsWith("image/")) return ".img";
        return ".bin";
    }
}
