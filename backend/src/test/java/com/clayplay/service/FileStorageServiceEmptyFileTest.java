package com.clayplay.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class FileStorageServiceEmptyFileTest {

    @Test
    void FileStorageService_Save_EmptyFile_ThrowsException() {
        FileStorageService storage = new FileStorageService();

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> storage.save(new byte[0], "image/png")
        );

        assertEquals("Empty file", ex.getMessage());
    }
}
