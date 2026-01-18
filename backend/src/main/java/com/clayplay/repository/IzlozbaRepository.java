package com.clayplay.repository;

import com.clayplay.model.Izlozba;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.List;

public interface IzlozbaRepository extends JpaRepository<Izlozba, Long> {
	List<Izlozba> findByIdKorisnikOrderByDatVrIzlozbaAsc(Long idKorisnik);

	List<Izlozba> findByIdKorisnikAndDatVrIzlozbaBeforeOrderByDatVrIzlozbaDesc(
		Long idKorisnik,
		OffsetDateTime before
	);

	List<Izlozba> findByIdKorisnikAndDatVrIzlozbaAfterOrderByDatVrIzlozbaAsc(
		Long idKorisnik,
		OffsetDateTime after
	);
}
