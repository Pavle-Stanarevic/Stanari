package com.clayplay.model;

import jakarta.persistence.*;

@Entity
@Table(name = "REZERVACIJA",
        uniqueConstraints = @UniqueConstraint(columnNames = {"idKorisnik", "idRadionica"}))
public class Rezervacija {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idRezervacija")
    private Long idRezervacija;

    @Column(name = "idKorisnik", nullable = false)
    private Long idKorisnik;

    @Column(name = "idRadionica", nullable = false)
    private Long idRadionica;

    @Column(name = "statusRez", nullable = false)
    private String statusRez = "reserved";

    public Long getIdRezervacija() { return idRezervacija; }
    public void setIdRezervacija(Long idRezervacija) { this.idRezervacija = idRezervacija; }

    public Long getIdKorisnik() { return idKorisnik; }
    public void setIdKorisnik(Long idKorisnik) { this.idKorisnik = idKorisnik; }

    public Long getIdRadionica() { return idRadionica; }
    public void setIdRadionica(Long idRadionica) { this.idRadionica = idRadionica; }

    public String getStatusRez() { return statusRez; }
    public void setStatusRez(String statusRez) { this.statusRez = statusRez; }
}
