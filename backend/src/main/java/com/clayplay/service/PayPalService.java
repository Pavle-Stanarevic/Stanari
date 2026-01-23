package com.clayplay.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@Service
public class PayPalService {

    private static final Logger log = LoggerFactory.getLogger(PayPalService.class);

    @Value("${paypal.client-id:}")
    private String clientId;

    @Value("${paypal.client-secret:}")
    private String clientSecret;

    @Value("${paypal.env:sandbox}")
    private String env;

    private final RestTemplate restTemplate = new RestTemplate();

    public boolean isConfigured() {
        return clientId != null && !clientId.isBlank() && clientSecret != null && !clientSecret.isBlank();
    }

    private String baseUrl() {
        return "live".equalsIgnoreCase(env)
                ? "https://api-m.paypal.com"
                : "https://api-m.sandbox.paypal.com";
    }

    public String getAccessToken() {
        if (!isConfigured()) {
            throw new IllegalStateException("PayPal is not configured (paypal.client-id/client-secret)");
        }

        String creds = clientId + ":" + clientSecret;
        String basic = Base64.getEncoder().encodeToString(creds.getBytes(StandardCharsets.UTF_8));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.set("Authorization", "Basic " + basic);

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "client_credentials");

        HttpEntity<MultiValueMap<String, String>> req = new HttpEntity<>(form, headers);

        ResponseEntity<Map> res = restTemplate.exchange(
                baseUrl() + "/v1/oauth2/token",
                HttpMethod.POST,
                req,
                Map.class
        );

        if (!res.getStatusCode().is2xxSuccessful() || res.getBody() == null) {
            throw new IllegalStateException("PayPal token request failed: " + res.getStatusCode());
        }

        Object token = res.getBody().get("access_token");
        if (token == null) throw new IllegalStateException("PayPal token missing in response");
        return String.valueOf(token);
    }

    public Map<String, Object> verifyCaptureCompleted(String captureId) {
        if (captureId == null || captureId.isBlank()) throw new IllegalArgumentException("Missing captureId");

        String token = getAccessToken();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setAccept(java.util.List.of(MediaType.APPLICATION_JSON));

        HttpEntity<Void> req = new HttpEntity<>(headers);

        ResponseEntity<Map> res = restTemplate.exchange(
                baseUrl() + "/v2/payments/captures/" + captureId,
                HttpMethod.GET,
                req,
                Map.class
        );

        if (!res.getStatusCode().is2xxSuccessful() || res.getBody() == null) {
            throw new IllegalStateException("PayPal capture lookup failed: " + res.getStatusCode());
        }

        Object statusObj = res.getBody().get("status");
        String status = statusObj == null ? null : String.valueOf(statusObj);
        if (!"COMPLETED".equalsIgnoreCase(status)) {
            throw new IllegalStateException("PayPal capture is not COMPLETED (status=" + status + ")");
        }

        return (Map<String, Object>) res.getBody();
    }
}
