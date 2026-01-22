package com.clayplay.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.UUID;

@Service
public class CheckoutStore {
    private final ConcurrentHashMap<String, Map<String,Object>> store = new ConcurrentHashMap<>();

    public String save(Map<String,Object> payload) {
        String id = UUID.randomUUID().toString();
        store.put(id, payload);
        return id;
    }

    public Map<String,Object> get(String id) {
        if (id == null) return null;
        return store.get(id);
    }

    public Map<String,Object> remove(String id) {
        if (id == null) return null;
        return store.remove(id);
    }
}
