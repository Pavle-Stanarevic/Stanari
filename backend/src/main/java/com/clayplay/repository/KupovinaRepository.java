package com.clayplay.repository;

import com.clayplay.model.Kupovina;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KupovinaRepository extends JpaRepository<Kupovina, Long> {
    boolean existsByIdKorisnikAndProizvodId(Long idKorisnik, Long proizvodId);

    List<Kupovina> findByIdKorisnikOrderByDatKupnjeDesc(Long idKorisnik);

    @Query("select k from Kupovina k join Proizvod p on p.proizvodId = k.proizvodId where p.idKorisnik = :sellerId order by k.datKupnje desc")
    List<Kupovina> findSalesBySellerId(@Param("sellerId") Long sellerId);
}
