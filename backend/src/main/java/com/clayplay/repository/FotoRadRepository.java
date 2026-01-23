package com.clayplay.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class FotoRadRepository {

	@PersistenceContext
	private EntityManager em;

	@Transactional
	public void insertLink(Long fotoId, Long idRadionica) {
		em.createNativeQuery("INSERT INTO fotorad (fotoId, idRadionica) VALUES (:fotoId, :idRadionica)")
				.setParameter("fotoId", fotoId)
				.setParameter("idRadionica", idRadionica)
				.executeUpdate();
	}
}
