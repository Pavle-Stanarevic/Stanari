package com.clayplay.service;

import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class CheckoutStoreSaveAndGetTest {

    @Test
    void CheckoutStore_SaveAndGet_ReturnsSamePayload() {
        CheckoutStore store = new CheckoutStore();

        Map<String, Object> payload = new HashMap<>();
        payload.put("amount", 120);
        payload.put("currency", "EUR");
        payload.put("userId", 5);

        String id = store.save(payload);

        assertNotNull(id, "ID ne smije biti null nakon save()");
        assertFalse(id.isBlank(), "ID ne smije biti prazan string");

        Map<String, Object> loaded = store.get(id);

        assertNotNull(loaded, "Dohvaćeni payload ne smije biti null");
        assertEquals(payload, loaded, "Dohvaćeni payload mora biti jednak spremljenom payload-u");
    }
}
