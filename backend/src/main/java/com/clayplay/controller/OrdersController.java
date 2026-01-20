package com.clayplay.controller;

import com.clayplay.model.Kupovina;
import com.clayplay.model.Proizvod;
import com.clayplay.repository.KupovinaRepository;
import com.clayplay.repository.ProizvodRepository;
import com.clayplay.repository.RecenzijaRepository;
import com.clayplay.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
public class OrdersController {

    private final KupovinaRepository kupovinaRepository;
    private final ProizvodRepository proizvodRepository;
    private final RecenzijaRepository recenzije;
    private final UserService userService;

    public OrdersController(KupovinaRepository kupovinaRepository, ProizvodRepository proizvodRepository, RecenzijaRepository recenzije, UserService userService) {
        this.kupovinaRepository = kupovinaRepository;
        this.proizvodRepository = proizvodRepository;
        this.recenzije = recenzije;
        this.userService = userService;
    }

    @GetMapping("/my")
    @Transactional(readOnly = true)
    public ResponseEntity<?> myOrders(@RequestParam("userId") Long userId) {
        try {
            if (userId == null) return ResponseEntity.badRequest().body("Missing userId");
            if (!userService.isPolaznik(userId)) {
                return ResponseEntity.status(403).body("Only polaznik can view purchases");
            }

            List<Kupovina> list = kupovinaRepository.findByIdKorisnikOrderByDatKupnjeDesc(userId);
            List<Long> productIds = list.stream().map(Kupovina::getProizvodId).distinct().collect(Collectors.toList());
            Map<Long, Proizvod> byId = proizvodRepository.findAllById(productIds)
                    .stream()
                    .collect(Collectors.toMap(Proizvod::getProizvodId, p -> p));

                List<Map<String, Object>> payload = list.stream()
                    .map(k -> {
                    Map<String, Object> m = toItem(k, byId.get(k.getProizvodId()));
                    boolean reviewed = recenzije.existsByProizvodIdAndIdKorisnik(k.getProizvodId(), k.getIdKorisnik());
                    m.put("reviewed", reviewed);
                    return m;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(payload);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Server error");
        }
    }

    @GetMapping("/sales")
    @Transactional(readOnly = true)
    public ResponseEntity<?> sales(@RequestParam("sellerId") Long sellerId) {
        try {
            if (sellerId == null) return ResponseEntity.badRequest().body("Missing sellerId");
            if (!userService.isOrganizator(sellerId)) {
                return ResponseEntity.status(403).body("Only organizator can view sales");
            }

            List<Kupovina> list = kupovinaRepository.findSalesBySellerId(sellerId);
            List<Long> productIds = list.stream().map(Kupovina::getProizvodId).distinct().collect(Collectors.toList());
            Map<Long, Proizvod> byId = proizvodRepository.findAllById(productIds)
                    .stream()
                    .collect(Collectors.toMap(Proizvod::getProizvodId, p -> p));

            List<Map<String, Object>> payload = list.stream()
                    .map(k -> {
                        Map<String, Object> m = toItem(k, byId.get(k.getProizvodId()));
                        m.put("buyerId", k.getIdKorisnik());
                        return m;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(payload);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Server error");
        }
    }

    private Map<String, Object> toItem(Kupovina k, Proizvod p) {
        Map<String, Object> m = new HashMap<>();
        Long pid = k != null ? k.getProizvodId() : null;
        m.put("id", pid);
        m.put("productId", pid);
        m.put("qty", 1);
        m.put("purchasedAt", k != null ? k.getDatKupnje() : null);

        if (p != null) {
            m.put("title", p.getOpisProizvod());
            m.put("productTitle", p.getOpisProizvod());
            m.put("price", p.getCijenaProizvod());
        } else {
            m.put("title", "Proizvod");
        }
        return m;
    }
}
