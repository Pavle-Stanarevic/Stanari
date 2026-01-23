package com.clayplay.repository;

import com.clayplay.model.Radionica;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface RadionicaRepository extends JpaRepository<Radionica, Long> {
    List<Radionica> findAllByOrderByDatVrRadionicaAsc(Pageable pageable);

    List<Radionica> findByIdKorisnikOrderByDatVrRadionicaAsc(Long idKorisnik);

    List<Radionica> findByIdKorisnikAndDatVrRadionicaBeforeOrderByDatVrRadionicaDesc(
        Long idKorisnik,
        OffsetDateTime before
    );

    List<Radionica> findByIdKorisnikAndDatVrRadionicaAfterOrderByDatVrRadionicaAsc(
        Long idKorisnik,
        OffsetDateTime after
    );

    Optional<Radionica> findByIdRadionica(Long idRadionica);
}
