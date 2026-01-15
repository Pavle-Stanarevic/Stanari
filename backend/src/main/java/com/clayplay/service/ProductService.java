package com.clayplay.service;

import com.clayplay.dto.ProductResponse;
import com.clayplay.model.Fotografija;
import com.clayplay.model.Proizvod;
import com.clayplay.repository.FotoProizvodRepository;
import com.clayplay.repository.FotografijaRepository;
import com.clayplay.repository.ProizvodRepository;
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
    private final FileStorageService storage;

    public ProductService(ProizvodRepository proizvodRepository,
                          FotografijaRepository fotografijaRepository,
                          FotoProizvodRepository fotoProizvodRepository,
                          FileStorageService storage) {
        this.proizvodRepository = proizvodRepository;
        this.fotografijaRepository = fotografijaRepository;
        this.fotoProizvodRepository = fotoProizvodRepository;
        this.storage = storage;
    }

    public List<ProductResponse> listAll() {
        return proizvodRepository.findAll().stream().map(p -> toDto(p)).collect(Collectors.toList());
    }

    public ProductResponse getById(Long id) {
        Proizvod p = proizvodRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Not found"));
        return toDto(p);
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
        try {
            String url = fotoProizvodRepository.findFirstImageUrl(p.getProizvodId());
            r.imageUrl = url;
        } catch (Exception ignored) {}
        return r;
    }
}
