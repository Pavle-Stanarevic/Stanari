package com.clayplay.service;

import com.clayplay.dto.ProductResponse;
import com.clayplay.model.Fotografija;
import com.clayplay.model.Kupovina;
import com.clayplay.model.Proizvod;
import com.clayplay.repository.FotoProizvodRepository;
import com.clayplay.repository.FotografijaRepository;
import com.clayplay.repository.KupovinaRepository;
import com.clayplay.repository.ProizvodRepository;
import com.clayplay.repository.RecenzijaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProizvodRepository proizvodRepository;
    private final FotografijaRepository fotografijaRepository;
    private final FotoProizvodRepository fotoProizvodRepository;
    private final KupovinaRepository kupovinaRepository;
    private final RecenzijaRepository recenzijaRepository;
    private final FileStorageService storage;

    public ProductService(ProizvodRepository proizvodRepository,
                          FotografijaRepository fotografijaRepository,
                          FotoProizvodRepository fotoProizvodRepository,
                          KupovinaRepository kupovinaRepository,
                          RecenzijaRepository recenzijaRepository,
                          FileStorageService storage) {
        this.proizvodRepository = proizvodRepository;
        this.fotografijaRepository = fotografijaRepository;
        this.fotoProizvodRepository = fotoProizvodRepository;
        this.kupovinaRepository = kupovinaRepository;
        this.recenzijaRepository = recenzijaRepository;
        this.storage = storage;
    }

    public List<ProductResponse> listAll() {
        return proizvodRepository.findByKupljenFalseOrderByProizvodIdDesc()
                .stream()
                .map(p -> toDto(p))
                .collect(Collectors.toList());
    }

    public ProductResponse getById(Long id) {
        Proizvod p = proizvodRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Not found"));
        return toDto(p);
    }

    @Transactional
    public ProductResponse markPurchased(Long id, Long userId) {
        if (userId == null) throw new IllegalArgumentException("Missing userId");
        Proizvod p = proizvodRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Not found"));
        if (Boolean.TRUE.equals(p.getKupljen())) {
            throw new IllegalArgumentException("Proizvod je već kupljen.");
        }
        if (kupovinaRepository.existsByIdKorisnikAndProizvodId(userId, id)) {
            throw new IllegalArgumentException("Proizvod je već kupljen.");
        }

        p.setKupljen(true);
        Proizvod saved = proizvodRepository.save(p);

        Kupovina k = new Kupovina();
        k.setIdKorisnik(userId);
        k.setProizvodId(id);
        kupovinaRepository.save(k);

        return toDto(saved);
    }

    @Transactional
    public Long create(Long idKorisnik, String opis, BigDecimal cijena, String kategorija, byte[] imageBytes, String contentType) {
        Proizvod p = new Proizvod();
        p.setIdKorisnik(idKorisnik);
        p.setOpisProizvod(opis);
        p.setCijenaProizvod(cijena);
        p.setKategorijaProizvod(kategorija);
        Proizvod saved = proizvodRepository.save(p);

        if (imageBytes != null && imageBytes.length > 0) {
            String publicUrl = storage.save(imageBytes, contentType);
            Fotografija f = new Fotografija();
            f.setFotoURL(publicUrl);
            Fotografija sf = fotografijaRepository.save(f);
            fotoProizvodRepository.link(saved.getProizvodId(), sf.getFotoId());
        }

        return saved.getProizvodId();
    }

    private ProductResponse toDto(Proizvod p) {
        ProductResponse r = new ProductResponse();
        r.proizvodId = p.getProizvodId();
        r.opisProizvod = p.getOpisProizvod();
        r.cijenaProizvod = p.getCijenaProizvod();
        r.kategorijaProizvod = p.getKategorijaProizvod();
        r.idKorisnik = p.getIdKorisnik();
        r.kupljen = p.getKupljen();
        try {
            Long sellerId = p.getIdKorisnik();
            Long productId = p.getProizvodId();
            if (sellerId != null && productId != null) {
                r.organizerAvgRating = recenzijaRepository.avgRatingForSellerExcluding(sellerId, productId);
                r.organizerReviewCount = recenzijaRepository.countReviewsForSellerExcluding(sellerId, productId);
                r.organizerReviewComments = recenzijaRepository.commentTextsForSellerExcluding(sellerId, productId);
            }
        } catch (Exception ignored) {}
        try {
            String url = fotoProizvodRepository.findFirstImageUrl(p.getProizvodId());
            r.imageUrl = url;
        } catch (Exception ignored) {}
        r.nazivProizvod = p.getOpisProizvod();
        r.title = p.getOpisProizvod();
        return r;
    }
}
