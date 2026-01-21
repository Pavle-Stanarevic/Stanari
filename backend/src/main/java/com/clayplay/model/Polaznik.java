package com.clayplay.model;

import jakarta.persistence.*;

@Entity
@Table(name = "POLAZNIK")
public class Polaznik {

    @Id
    @Column(name = "idkorisnik")
    private Long idKorisnik;

    @Column(name = "zeliobavijesti", nullable = false)
    private boolean zeliObavijesti = false;

    @OneToOne(optional = false)
    @JoinColumn(name = "idkorisnik", referencedColumnName = "idkorisnik", insertable = false, updatable = false)
    private Korisnik korisnik;

    public Long getIdKorisnik() { return idKorisnik; }
    public void setIdKorisnik(Long idKorisnik) { this.idKorisnik = idKorisnik; }

    public boolean isZeliObavijesti() { return zeliObavijesti; }
    public void setZeliObavijesti(boolean zeliObavijesti) { this.zeliObavijesti = zeliObavijesti; }

    public Korisnik getKorisnik() { return korisnik; }
    public void setKorisnik(Korisnik korisnik) { this.korisnik = korisnik; }
}
