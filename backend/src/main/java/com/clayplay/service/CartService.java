package com.clayplay.service;

import com.clayplay.model.CartItem;
import com.clayplay.model.Kupovina;
import com.clayplay.model.Proizvod;
import com.clayplay.model.Radionica;
import com.clayplay.model.Rezervacija;
import com.clayplay.repository.CartItemRepository;
import com.clayplay.repository.KupovinaRepository;
import com.clayplay.repository.ProizvodRepository;
import com.clayplay.repository.RadionicaRepository;
import com.clayplay.repository.RezervacijaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class CartService {

    private static final Logger log = LoggerFactory.getLogger(CartService.class);

    private final CartItemRepository cartItemRepository;
    private final ProizvodRepository proizvodRepository;
    private final RadionicaRepository radionicaRepository;
    private final KupovinaRepository kupovinaRepository;
    private final RezervacijaRepository rezervacijaRepository;

    public CartService(CartItemRepository cartItemRepository,
                       ProizvodRepository proizvodRepository,
                       RadionicaRepository radionicaRepository,
                       KupovinaRepository kupovinaRepository,
                       RezervacijaRepository rezervacijaRepository) {
        this.cartItemRepository = cartItemRepository;
        this.proizvodRepository = proizvodRepository;
        this.radionicaRepository = radionicaRepository;
        this.kupovinaRepository = kupovinaRepository;
        this.rezervacijaRepository = rezervacijaRepository;
    }

    @Transactional(readOnly = true)
    public List<CartItem> getCartForUser(Long userId) {
        if (userId == null) return List.of();
        List<CartItem> items = cartItemRepository.findByIdKorisnikOrderByCreatedAtAsc(userId);

        if (items != null && !items.isEmpty()) {
            for (CartItem item : items) {
                try {
                    if (item.getProductId() != null) {
                        Optional<Proizvod> pOpt = proizvodRepository.findById(item.getProductId());
                        if (pOpt.isPresent()) {
                            Proizvod p = pOpt.get();
                            if (item.getTitle() == null || item.getTitle().isBlank()) item.setTitle(p.getOpisProizvod());
                            if (item.getPrice() == null) item.setPrice(p.getCijenaProizvod());
                            if (item.getMeta() == null) {
                                item.setMeta(String.format("{\"productId\":%d,\"category\":\"%s\"}",
                                        p.getProizvodId(), p.getKategorijaProizvod()));
                            }
                        }
                    } else if (item.getIdRadionica() != null) {
                        Optional<Radionica> rOpt = radionicaRepository.findById(item.getIdRadionica());
                        if (rOpt.isPresent()) {
                            Radionica r = rOpt.get();
                            if (item.getTitle() == null || item.getTitle().isBlank()) item.setTitle(r.getNazivRadionica());
                            if (item.getPrice() == null && r.getCijenaRadionica() != null) item.setPrice(r.getCijenaRadionica());
                            if (item.getMeta() == null) {
                                item.setMeta(String.format("{\"dateISO\":\"%s\",\"location\":\"%s\"}",
                                        r.getDatVrRadionica() == null ? "" : r.getDatVrRadionica().toString(),
                                        r.getLokacijaRadionica() == null ? "" : r.getLokacijaRadionica()));
                            }
                        }
                    }
                } catch (Exception ignored) {
                }

                if (item.getPrice() == null) item.setPrice(new BigDecimal("0.00"));
            }
        }

        return items;
    }

    @Transactional
    public List<CartItem> addItem(Long userId, CartItem item) {
        if (userId == null) throw new IllegalArgumentException("Missing userId");
        if (item == null) throw new IllegalArgumentException("Missing item");

        item.setIdKorisnik(userId);

        try {
            if (item.getProductId() != null) {
                Optional<Proizvod> pOpt = proizvodRepository.findById(item.getProductId());
                if (pOpt.isPresent()) {
                    Proizvod p = pOpt.get();
                    if (item.getTitle() == null || item.getTitle().isBlank()) item.setTitle(p.getOpisProizvod());
                    if (item.getPrice() == null) item.setPrice(p.getCijenaProizvod());
                    if (item.getMeta() == null) item.setMeta(String.format("{\"productId\":%d,\"category\":\"%s\"}", p.getProizvodId(), p.getKategorijaProizvod()));
                } else {
                }
            } else if (item.getIdRadionica() != null) {
                Optional<Radionica> rOpt = radionicaRepository.findById(item.getIdRadionica());
                if (rOpt.isPresent()) {
                    Radionica r = rOpt.get();
                    if (item.getTitle() == null || item.getTitle().isBlank()) item.setTitle(r.getNazivRadionica());
                    if (item.getPrice() == null && r.getCijenaRadionica() != null) item.setPrice(r.getCijenaRadionica());
                    if (item.getMeta() == null) item.setMeta(String.format("{\"dateISO\":\"%s\",\"location\":\"%s\"}",
                            r.getDatVrRadionica() == null ? "" : r.getDatVrRadionica().toString(),
                            r.getLokacijaRadionica() == null ? "" : r.getLokacijaRadionica()));
                }
            }
        } catch (Exception ignored) {}

        if (item.getPrice() == null) item.setPrice(new BigDecimal("0.00"));

        cartItemRepository.save(item);
        return cartItemRepository.findByIdKorisnikOrderByCreatedAtAsc(userId);
    }

    @Transactional
    public List<CartItem> removeItem(Long userId, Long cartItemId) {
        if (userId == null) throw new IllegalArgumentException("Missing userId");
        if (cartItemId == null) throw new IllegalArgumentException("Missing cartItemId");
        cartItemRepository.deleteById(cartItemId);
        return cartItemRepository.findByIdKorisnikOrderByCreatedAtAsc(userId);
    }

    @Transactional
    public List<CartItem> updateQty(Long userId, Long cartItemId, int qty) {
        if (userId == null) throw new IllegalArgumentException("Missing userId");
        CartItem item = cartItemRepository.findById(cartItemId).orElseThrow(() -> new IllegalArgumentException("Item not found"));
        if (!userId.equals(item.getIdKorisnik())) throw new IllegalArgumentException("Not your item");
        item.setQty(Math.max(1, qty));
        cartItemRepository.save(item);
        return cartItemRepository.findByIdKorisnikOrderByCreatedAtAsc(userId);
    }

    @Transactional
    public List<CartItem> updateQtyByFriendlyId(Long userId, String friendlyId, int qty) {
        if (userId == null) throw new IllegalArgumentException("Missing userId");
        if (friendlyId == null || friendlyId.isBlank()) throw new IllegalArgumentException("Missing item id");
        String[] parts = friendlyId.split(":", 2);
        if (parts.length == 2) {
            String prefix = parts[0];
            String val = parts[1];
            try {
                if ("product".equalsIgnoreCase(prefix)) {
                    Long pid = Long.valueOf(val);
                    CartItem item = cartItemRepository.findByIdKorisnikAndProductId(userId, pid)
                            .orElseThrow(() -> new IllegalArgumentException("Item not found"));
                    item.setQty(Math.max(1, qty));
                    cartItemRepository.save(item);
                    return cartItemRepository.findByIdKorisnikOrderByCreatedAtAsc(userId);
                } else if ("workshop".equalsIgnoreCase(prefix)) {
                    Long wid = Long.valueOf(val);
                    CartItem item = cartItemRepository.findByIdKorisnikAndIdRadionica(userId, wid)
                            .orElseThrow(() -> new IllegalArgumentException("Item not found"));
                    item.setQty(Math.max(1, qty));
                    cartItemRepository.save(item);
                    return cartItemRepository.findByIdKorisnikOrderByCreatedAtAsc(userId);
                } else if ("cart".equalsIgnoreCase(prefix)) {
                    Long cid = Long.valueOf(val);
                    return updateQty(userId, cid, qty);
                }
            } catch (NumberFormatException nfe) {
                throw new IllegalArgumentException("Invalid id format");
            }
        }
        throw new IllegalArgumentException("Unknown item id format");
    }

    @Transactional
    public List<CartItem> removeItemByFriendlyId(Long userId, String friendlyId) {
        if (userId == null) throw new IllegalArgumentException("Missing userId");
        if (friendlyId == null || friendlyId.isBlank()) throw new IllegalArgumentException("Missing item id");
        String[] parts = friendlyId.split(":", 2);
        if (parts.length == 2) {
            String prefix = parts[0];
            String val = parts[1];
            try {
                if ("product".equalsIgnoreCase(prefix)) {
                    Long pid = Long.valueOf(val);
                    cartItemRepository.deleteByIdKorisnikAndProductId(userId, pid);
                    return cartItemRepository.findByIdKorisnikOrderByCreatedAtAsc(userId);
                } else if ("workshop".equalsIgnoreCase(prefix)) {
                    Long wid = Long.valueOf(val);
                    cartItemRepository.deleteByIdKorisnikAndIdRadionica(userId, wid);
                    return cartItemRepository.findByIdKorisnikOrderByCreatedAtAsc(userId);
                } else if ("cart".equalsIgnoreCase(prefix)) {
                    Long cid = Long.valueOf(val);
                    return removeItem(userId, cid);
                }
            } catch (NumberFormatException nfe) {
                throw new IllegalArgumentException("Invalid id format");
            }
        }
        throw new IllegalArgumentException("Unknown item id format");
    }

    @Transactional
    public List<CartItem> clearCart(Long userId) {
        if (userId == null) throw new IllegalArgumentException("Missing userId");
        cartItemRepository.deleteByIdKorisnik(userId);
        return List.of();
    }

    @Transactional
    public void clearCartForUser(Long userId) {
        if (userId == null) {
            log.warn("clearCartForUser called with null userId");
            return;
        }
        try {
            List<CartItem> items = cartItemRepository.findByIdKorisnikOrderByCreatedAtAsc(userId);
            final int before = items == null ? 0 : items.size();
            cartItemRepository.deleteByIdKorisnik(userId);
            log.info("clearCartForUser: cleared cart for userId={}, removedCount={}", userId, before);
        } catch (Exception e) {
            log.error("clearCartForUser: error clearing cart for userId={}", userId, e);
            throw e;
        }
    }

    @Transactional
    public void checkout(Long userId) {
        if (userId == null) throw new IllegalArgumentException("Missing userId");
        List<CartItem> items = cartItemRepository.findByIdKorisnikOrderByCreatedAtAsc(userId);
        if (items == null || items.isEmpty()) return;

        for (CartItem item : items) {
            try {
                if (item.getProductId() != null) {
                    Long prodId = item.getProductId();
                    Proizvod p = proizvodRepository.findById(prodId).orElseThrow(() -> new IllegalArgumentException("Proizvod ne postoji: " + prodId));
                    if (Boolean.TRUE.equals(p.getKupljen())) {
                        cartItemRepository.deleteByIdKorisnik(userId);
                        throw new IllegalArgumentException("Proizvod više nije dostupan: " + prodId);
                    }
                    if (kupovinaRepository.existsByIdKorisnikAndProizvodId(userId, prodId)) {
                    } else {
                        Kupovina k = new Kupovina();
                        k.setIdKorisnik(userId);
                        k.setProizvodId(prodId);
                        kupovinaRepository.save(k);
                        p.setKupljen(true);
                        proizvodRepository.save(p);
                    }
                } else if (item.getIdRadionica() != null) {
                    Long wid = item.getIdRadionica();
                    Radionica r = radionicaRepository.findById(wid).orElseThrow(() -> new IllegalArgumentException("Radionica ne postoji: " + wid));
                    if (r.getBrSlobMjesta() == null || r.getBrSlobMjesta() <= 0) {
                        cartItemRepository.deleteByIdKorisnik(userId);
                        throw new IllegalArgumentException("Nema slobodnih mjesta za radionicu: " + wid);
                    }
                    if (!rezervacijaRepository.existsByIdKorisnikAndIdRadionica(userId, wid)) {
                        Rezervacija rez = new Rezervacija();
                        rez.setIdKorisnik(userId);
                        rez.setIdRadionica(wid);
                        rez.setStatusRez("reserved");
                        rezervacijaRepository.save(rez);
                        r.setBrSlobMjesta(r.getBrSlobMjesta() - 1);
                        radionicaRepository.save(r);
                    }
                }
            } catch (IllegalArgumentException e) {
                throw e;
            } catch (Exception e) {
                cartItemRepository.deleteByIdKorisnik(userId);
                throw new IllegalArgumentException("Ne mogu obraditi kupnju: " + e.getMessage());
            }
        }

        cartItemRepository.deleteByIdKorisnik(userId);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> prepareCheckout(Long userId) {
        if (userId == null) throw new IllegalArgumentException("Missing userId");
        List<CartItem> items = cartItemRepository.findByIdKorisnikOrderByCreatedAtAsc(userId);
        if (items == null || items.isEmpty()) throw new IllegalArgumentException("Cart is empty");

        BigDecimal total = BigDecimal.ZERO;
        for (CartItem item : items) {
            if (item.getProductId() != null) {
                Proizvod p = proizvodRepository.findById(item.getProductId()).orElse(null);
                if (p == null || Boolean.TRUE.equals(p.getKupljen())) {
                    cartItemRepository.deleteByIdKorisnik(userId);
                    throw new IllegalArgumentException("Some products are no longer available. Cart cleared.");
                }
                total = total.add(item.getPrice() == null ? BigDecimal.ZERO : item.getPrice().multiply(new BigDecimal(item.getQty())));
            } else if (item.getIdRadionica() != null) {
                Radionica r = radionicaRepository.findById(item.getIdRadionica()).orElse(null);
                if (r == null || r.getBrSlobMjesta() == null || r.getBrSlobMjesta() <= 0) {
                    cartItemRepository.deleteByIdKorisnik(userId);
                    throw new IllegalArgumentException("Some workshops are no longer available. Cart cleared.");
                }
                total = total.add(item.getPrice() == null ? BigDecimal.ZERO : item.getPrice().multiply(new BigDecimal(item.getQty())));
            }
        }

        Map<String, Object> out = new HashMap<>();
        out.put("userId", userId);
        out.put("total", total.doubleValue());
        out.put("items", items.stream().map(it -> {
            Map<String,Object> m = new HashMap<>();
            m.put("idCartItem", it.getIdCartItem());
            m.put("type", it.getType());
            m.put("productId", it.getProductId());
            m.put("idRadionica", it.getIdRadionica());
            m.put("qty", it.getQty());
            m.put("title", it.getTitle());
            m.put("price", it.getPrice() == null ? 0 : it.getPrice().doubleValue());
            return m;
        }).toList());

        return out;
    }

    @Transactional
    public void finalizeCheckout(String checkoutId, Map<String, Object> payload) {
        log.info("finalizeCheckout called: checkoutId={}, payloadKeys={}", checkoutId, payload == null ? "null" : payload.keySet());
        if (payload == null) throw new IllegalArgumentException("Missing payload");
        Long userId = payload.get("userId") instanceof Number ? ((Number) payload.get("userId")).longValue() : null;
        if (userId == null) throw new IllegalArgumentException("Missing userId in payload");

        List<CartItem> items = cartItemRepository.findByIdKorisnikOrderByCreatedAtAsc(userId);
        if (items == null || items.isEmpty()) return;

        for (CartItem item : items) {
            if (item.getProductId() != null) {
                Long prodId = item.getProductId();
                Proizvod p = proizvodRepository.findById(prodId).orElseThrow(() -> new IllegalArgumentException("Proizvod ne postoji: " + prodId));
                if (Boolean.TRUE.equals(p.getKupljen())) {
                    cartItemRepository.deleteByIdKorisnik(userId);
                    throw new IllegalArgumentException("Proizvod je već kupljen: " + prodId);
                }
                Kupovina kup = new Kupovina();
                kup.setIdKorisnik(userId);
                kup.setProizvodId(prodId);
                kupovinaRepository.save(kup);
                p.setKupljen(true);
                proizvodRepository.save(p);
            } else if (item.getIdRadionica() != null) {
                Long wid = item.getIdRadionica();
                Radionica r = radionicaRepository.findById(wid).orElseThrow(() -> new IllegalArgumentException("Radionica ne postoji: " + wid));
                if (r.getBrSlobMjesta() == null || r.getBrSlobMjesta() <= 0) {
                    cartItemRepository.deleteByIdKorisnik(userId);
                    throw new IllegalArgumentException("Radionica nema slobodnih mjesta: " + wid);
                }
                Rezervacija rez = new Rezervacija();
                rez.setIdKorisnik(userId);
                rez.setIdRadionica(wid);
                rezervacijaRepository.save(rez);
                r.setBrSlobMjesta(r.getBrSlobMjesta() - 1);
                radionicaRepository.save(r);
            }
        }

        cartItemRepository.deleteByIdKorisnik(userId);
    }
}
