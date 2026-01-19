package com.clayplay.model;

import jakarta.persistence.*;

@Entity
@Table(name = "ADMINISTRATOR")
public class Administrator {

    @Id
    @Column(name = "idKorisnik")
    private Long idKorisnik;

    public Long getIdKorisnik() { return idKorisnik; }
    public void setIdKorisnik(Long idKorisnik) { this.idKorisnik = idKorisnik; }
}
