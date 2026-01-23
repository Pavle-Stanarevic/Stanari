package com.clayplay.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "CART_ITEM")
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idcartitem")
    private Long idCartItem;

    @Column(name = "idkorisnik", nullable = false)
    private Long idKorisnik;

    @Column(name = "type", nullable = false, length = 50)
    private String type;

    @Column(name = "productid")
    private Long productId;

    @Column(name = "idradionica")
    private Long idRadionica;

    @Column(name = "qty", nullable = false)
    private Integer qty = 1;

    @Column(name = "title", length = 255)
    private String title;

    @Column(name = "price", precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "meta", columnDefinition = "text")
    private String meta;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    public CartItem() {
        this.createdAt = OffsetDateTime.now();
    }

    public Long getIdCartItem() { return idCartItem; }
    public void setIdCartItem(Long idCartItem) { this.idCartItem = idCartItem; }

    public Long getIdKorisnik() { return idKorisnik; }
    public void setIdKorisnik(Long idKorisnik) { this.idKorisnik = idKorisnik; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public Long getIdRadionica() { return idRadionica; }
    public void setIdRadionica(Long idRadionica) { this.idRadionica = idRadionica; }

    public Integer getQty() { return qty; }
    public void setQty(Integer qty) { this.qty = qty; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public String getMeta() { return meta; }
    public void setMeta(String meta) { this.meta = meta; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
