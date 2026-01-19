package com.clayplay.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "PROIZVOD")
public class Proizvod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "proizvodId")
    private Long proizvodId;

    @Column(name = "opisProizvod")
    private String opisProizvod;

    @Column(name = "cijenaProizvod", nullable = false)
    private BigDecimal cijenaProizvod;

    @Column(name = "kategorijaProizvod", nullable = false)
    private String kategorijaProizvod;

    @Column(name = "kupljen", nullable = false)
    private Boolean kupljen = false;

    @Column(name = "idKorisnik", nullable = false)
    private Long idKorisnik;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idKorisnik", referencedColumnName = "idKorisnik", insertable = false, updatable = false)
    private Organizator organizator;

    public Long getProizvodId() { return proizvodId; }
    public void setProizvodId(Long proizvodId) { this.proizvodId = proizvodId; }

    public String getOpisProizvod() { return opisProizvod; }
    public void setOpisProizvod(String opisProizvod) { this.opisProizvod = opisProizvod; }

    public BigDecimal getCijenaProizvod() { return cijenaProizvod; }
    public void setCijenaProizvod(BigDecimal cijenaProizvod) { this.cijenaProizvod = cijenaProizvod; }

    public String getKategorijaProizvod() { return kategorijaProizvod; }
    public void setKategorijaProizvod(String kategorijaProizvod) { this.kategorijaProizvod = kategorijaProizvod; }

    public Boolean getKupljen() { return kupljen; }
    public void setKupljen(Boolean kupljen) { this.kupljen = kupljen; }

    public Long getIdKorisnik() { return idKorisnik; }
    public void setIdKorisnik(Long idKorisnik) { this.idKorisnik = idKorisnik; }

    public Organizator getOrganizator() { return organizator; }
    public void setOrganizator(Organizator organizator) { this.organizator = organizator; }
}
