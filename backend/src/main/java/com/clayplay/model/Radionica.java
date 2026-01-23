package com.clayplay.model;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.OffsetDateTime;

@Entity
@Table(name = "RADIONICA")
public class Radionica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idradionica")
    private Long idRadionica;

    @Column(name = "nazivradionica", nullable = false, length = 50)
    private String nazivRadionica;

    @Column(name = "opisradionica", nullable = false, length = 1000)
    private String opisRadionica;

    @JdbcTypeCode(SqlTypes.INTERVAL_SECOND)
    @Column(name = "trajanje", nullable = false)
    private Duration trajanje;

    @Column(name = "datvrradionica", nullable = false)
    private OffsetDateTime datVrRadionica;

    @Column(name = "lokacijaradionica", nullable = false, length = 100)
    private String lokacijaRadionica;

    @Column(name = "brslobmjesta", nullable = false)
    private Integer brSlobMjesta;

    @Column(name = "cijenaradionica", nullable = false)
    private BigDecimal cijenaRadionica;

    @Column(name = "idkorisnik", nullable = false)
    private Long idKorisnik;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idkorisnik", referencedColumnName = "idkorisnik", insertable = false, updatable = false)
    private Organizator organizator;

    public Long getIdRadionica() { return idRadionica; }
    public void setIdRadionica(Long idRadionica) { this.idRadionica = idRadionica; }

    public String getNazivRadionica() { return nazivRadionica; }
    public void setNazivRadionica(String nazivRadionica) { this.nazivRadionica = nazivRadionica; }

    public String getOpisRadionica() { return opisRadionica; }
    public void setOpisRadionica(String opisRadionica) { this.opisRadionica = opisRadionica; }

    public Duration getTrajanje() { return trajanje; }
    public void setTrajanje(Duration trajanje) { this.trajanje = trajanje; }

    public OffsetDateTime getDatVrRadionica() { return datVrRadionica; }
    public void setDatVrRadionica(OffsetDateTime datVrRadionica) { this.datVrRadionica = datVrRadionica; }

    public String getLokacijaRadionica() { return lokacijaRadionica; }
    public void setLokacijaRadionica(String lokacijaRadionica) { this.lokacijaRadionica = lokacijaRadionica; }

    public Integer getBrSlobMjesta() { return brSlobMjesta; }
    public void setBrSlobMjesta(Integer brSlobMjesta) { this.brSlobMjesta = brSlobMjesta; }

    public BigDecimal getCijenaRadionica() { return cijenaRadionica; }
    public void setCijenaRadionica(BigDecimal cijenaRadionica) { this.cijenaRadionica = cijenaRadionica; }

    public Long getIdKorisnik() { return idKorisnik; }
    public void setIdKorisnik(Long idKorisnik) { this.idKorisnik = idKorisnik; }

    public Organizator getOrganizator() { return organizator; }
    public void setOrganizator(Organizator organizator) { this.organizator = organizator; }
}
