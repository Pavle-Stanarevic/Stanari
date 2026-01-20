package com.clayplay.repository;

import com.clayplay.model.Recenzija;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecenzijaRepository extends JpaRepository<Recenzija, Long> {
    List<Recenzija> findByProizvodIdOrderByIdRecenzijaDesc(Long proizvodId);
    boolean existsByProizvodIdAndIdKorisnik(Long proizvodId, Long idKorisnik);
    Optional<Recenzija> findByProizvodIdAndIdKorisnik(Long proizvodId, Long idKorisnik);

    @Query("select avg(r.ocjena) from Recenzija r join Proizvod p on p.proizvodId = r.proizvodId where p.idKorisnik = :sellerId and p.kupljen = true and p.proizvodId <> :excludeId")
    Double avgRatingForSellerExcluding(@Param("sellerId") Long sellerId, @Param("excludeId") Long excludeId);

    @Query("select count(r) from Recenzija r join Proizvod p on p.proizvodId = r.proizvodId where p.idKorisnik = :sellerId and p.kupljen = true and p.proizvodId <> :excludeId")
    Long countReviewsForSellerExcluding(@Param("sellerId") Long sellerId, @Param("excludeId") Long excludeId);

    @Query("select r.textRecenzija from Recenzija r join Proizvod p on p.proizvodId = r.proizvodId where p.idKorisnik = :sellerId and p.kupljen = true and p.proizvodId <> :excludeId and r.textRecenzija is not null and r.textRecenzija <> '' order by r.idRecenzija desc")
    List<String> commentTextsForSellerExcluding(@Param("sellerId") Long sellerId, @Param("excludeId") Long excludeId);
}
