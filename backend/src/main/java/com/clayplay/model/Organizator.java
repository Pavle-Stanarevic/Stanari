package com.clayplay.model;

import jakarta.persistence.*;

@Entity
@Table(name = "ORGANIZATOR")
public class Organizator {

    @Id
    @Column(name = "idkorisnik")
    private Long idKorisnik;

    @Column(name = "imestudija")
    private String imeStudija; // nullable in DB, optional here
    @Column(name = "status_organizator", nullable = false)
    private String statusOrganizator = "APPROVED";

    @OneToOne(optional = false)
    @JoinColumn(name = "idkorisnik", referencedColumnName = "idkorisnik", insertable = false, updatable = false)
    private Korisnik korisnik;

    public Long getIdKorisnik() { return idKorisnik; }
    public void setIdKorisnik(Long idKorisnik) { this.idKorisnik = idKorisnik; }

    public String getImeStudija() { return imeStudija; }
    public void setImeStudija(String imeStudija) { this.imeStudija = imeStudija; }
    
    public String getStatusOrganizator() { return statusOrganizator; }
    public void setStatusOrganizator(String statusOrganizator) { this.statusOrganizator = statusOrganizator; }

    public Korisnik getKorisnik() { return korisnik; }
    public void setKorisnik(Korisnik korisnik) { this.korisnik = korisnik; }
}
