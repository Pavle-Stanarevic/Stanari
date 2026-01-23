package com.clayplay.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CheckoutStoreNullIdTest {

    @Test
    void CheckoutStore_NullId_GetAndRemove_ReturnNull() {
        CheckoutStore store = new CheckoutStore();

        assertNull(store.get(null), "get(null) mora vratiti null");
        assertNull(store.remove(null), "remove(null) mora vratiti null");
    }
}
