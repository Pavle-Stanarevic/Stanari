package com.clayplay.model;

import jakarta.persistence.*;

@Entity
@Table(name = "FOTOGRAFIJA")
public class Fotografija {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "fotoId")
    private Long fotoId;

    @Column(name = "fotoURL", nullable = false, unique = true)
    private String fotoURL;

    public Long getFotoId() { return fotoId; }
    public void setFotoId(Long fotoId) { this.fotoId = fotoId; }

    public String getFotoURL() { return fotoURL; }
    public void setFotoURL(String fotoURL) { this.fotoURL = fotoURL; }
}
