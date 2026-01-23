package com.clayplay.model;

import jakarta.persistence.*;

@Entity
@Table(name = "KORISNIK")
public class Korisnik {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idkorisnik")
    private Long idKorisnik;

    @Column(name = "ime")
    private String ime;

    @Column(name = "prezime")
    private String prezime;

    @Column(name = "adresa")
    private String adresa;

    @Column(name = "brojtelefona")
    private String brojTelefona;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "status", nullable = false)
    private String status = "ACTIVE";

    @Column(name = "fotoid")
    private Long fotoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fotoid", referencedColumnName = "fotoid", insertable = false, updatable = false)
    private Fotografija fotografija;

    public Long getIdKorisnik() { return idKorisnik; }
    public void setIdKorisnik(Long idKorisnik) { this.idKorisnik = idKorisnik; }

    public String getIme() { return ime; }
    public void setIme(String ime) { this.ime = ime; }

    public String getPrezime() { return prezime; }
    public void setPrezime(String prezime) { this.prezime = prezime; }

    public String getAdresa() { return adresa; }
    public void setAdresa(String adresa) { this.adresa = adresa; }

    public String getBrojTelefona() { return brojTelefona; }
    public void setBrojTelefona(String brojTelefona) { this.brojTelefona = brojTelefona; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getFotoId() { return fotoId; }
    public void setFotoId(Long fotoId) { this.fotoId = fotoId; }

    public Fotografija getFotografija() { return fotografija; }
    public void setFotografija(Fotografija fotografija) { this.fotografija = fotografija; }
}
