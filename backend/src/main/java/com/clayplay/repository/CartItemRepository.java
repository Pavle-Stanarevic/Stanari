package com.clayplay.repository;

import com.clayplay.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByIdKorisnikOrderByCreatedAtAsc(Long idKorisnik);
    void deleteByIdKorisnik(Long idKorisnik);

    Optional<CartItem> findByIdKorisnikAndProductId(Long idKorisnik, Long productId);
    Optional<CartItem> findByIdKorisnikAndIdRadionica(Long idKorisnik, Long idRadionica);

    void deleteByIdKorisnikAndProductId(Long idKorisnik, Long productId);
    void deleteByIdKorisnikAndIdRadionica(Long idKorisnik, Long idRadionica);
}
