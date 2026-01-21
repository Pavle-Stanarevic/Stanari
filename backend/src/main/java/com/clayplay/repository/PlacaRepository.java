package com.clayplay.repository;

import com.clayplay.model.Placa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface PlacaRepository extends JpaRepository<Placa, Long> {
    
    @Query("SELECT p FROM Placa p WHERE p.idKorisnik = :userId AND (p.datvrKrajClanarine IS NULL OR p.datvrKrajClanarine > :now) ORDER BY p.datvrKrajClanarine DESC")
    List<Placa> findActiveSubscriptions(@Param("userId") Long userId, @Param("now") OffsetDateTime now);

    Optional<Placa> findFirstByIdKorisnikOrderByDatvrKrajClanarineDesc(Long idKorisnik);

    boolean existsByStripePaymentIntentId(String stripePaymentIntentId);
}
