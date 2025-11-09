package com.clayplay.model;

import jakarta.persistence.*;

@Entity
@Table(name = "POLAZNIK")
public class Polaznik {

    @Id
    @Column(name = "idKorisnik")
    private Long idKorisnik;

    @Column(name = "zeliObavijesti", nullable = false)
    private boolean zeliObavijesti = false;

    @OneToOne(optional = false)
    @JoinColumn(name = "idKorisnik", referencedColumnName = "idKorisnik", insertable = false, updatable = false)
    private Korisnik korisnik;

    public Long getIdKorisnik() { return idKorisnik; }
    public void setIdKorisnik(Long idKorisnik) { this.idKorisnik = idKorisnik; }

    public boolean isZeliObavijesti() { return zeliObavijesti; }
    public void setZeliObavijesti(boolean zeliObavijesti) { this.zeliObavijesti = zeliObavijesti; }

    public Korisnik getKorisnik() { return korisnik; }
    public void setKorisnik(Korisnik korisnik) { this.korisnik = korisnik; }
}
