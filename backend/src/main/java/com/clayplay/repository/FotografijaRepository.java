package com.clayplay.repository;

import com.clayplay.model.Fotografija;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;

@Repository
public interface FotografijaRepository extends JpaRepository<Fotografija, Long> {
    Optional<Fotografija> findByFotoURL(String fotoURL);

    @Query(value = "select f.fotoURL from fotografija f join fotorad fr on fr.fotoId = f.fotoId where fr.idRadionica = :id", nativeQuery = true)
    List<String> findUrlsByRadionicaId(@Param("id") Long id);
}
