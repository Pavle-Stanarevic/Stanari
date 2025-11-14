package com.clayplay.repository;

import com.clayplay.model.Fotografija;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FotografijaRepository extends JpaRepository<Fotografija, Long> {
    Optional<Fotografija> findByFotoURL(String fotoURL);
}
