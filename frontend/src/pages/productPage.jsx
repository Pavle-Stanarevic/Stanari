import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../styles/ProductPage.css";

const PLACEHOLDER_PRODUCT = {
  proizvodId: "placeholder-1",
  nazivProizvod: "Ručno rađena keramička vaza",
  cijenaProizvod: 29.99,
  opisProizvod:
    "Ovo je placeholder proizvod koji služi isključivo za provjeru izgleda stranice. Svaki proizvod je ručno rađen, unikatan i može se minimalno razlikovati od prikaza.",
  imageUrl: "/images/placeholder.jpg",
  idKorisnik: 999,
};

const PLACEHOLDER_REVIEWS = [
  {
    id: 1,
    rating: 5,
    title: "Prekrasna izrada",
    body: "Proizvod je još ljepši uživo. Brza dostava i odlična komunikacija.",
    reviewerName: "Ana",
    createdAt: "2025-01-10",
  },
  {
    id: 2,
    rating: 4,
    title: "Jako zadovoljna",
    body: "Malo manja nego što sam očekivala, ali kvaliteta je vrhunska.",
    reviewerName: "Ivana",
    createdAt: "2025-01-08",
  },
];

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  if (!contentType.includes("application/json")) {
    throw new Error(`API nije vratio JSON: ${text.slice(0, 80)}...`);
  }
  return JSON.parse(text);
}

export default function ProductPage() {
  const { proizvodId } = useParams();

  const isPlaceholder = proizvodId?.startsWith("placeholder");

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      // placeholder mode
      if (isPlaceholder) {
        setProduct(PLACEHOLDER_PRODUCT);
        setReviews(PLACEHOLDER_REVIEWS);
        setLoading(false);
        return;
      }

      // pravi backend mode
      try {
        const p = await fetchJson(`/api/products/${proizvodId}`);
        setProduct(p);

        const r = await fetchJson(`/api/sellers/${p.idKorisnik}/reviews`);
        setReviews(Array.isArray(r) ? r : r.items ?? []);
      } catch (e) {
        setError(e.message || "Greška.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [proizvodId, isPlaceholder]);

  const displayName =
    product?.nazivProizvod ||
    product?.title ||
    product?.kategorijaProizvod ||
    "Proizvod";

  return (
    <main className="product-page">
      <div className="crumbs">
        <Link className="crumb" to="/shop">
          ← Nazad na Shop
        </Link>
      </div>

      {loading && <div className="status">Učitavanje...</div>}
      {!loading && error && <div className="status status--error">{error}</div>}

      {!loading && !error && product && (
        <>
          <section className="product-hero">
            <div className="product-media">
              <img
                src={product.imageUrl || "/images/placeholder.jpg"}
                alt={displayName}
              />
            </div>

            <div className="product-info">
              <h1 className="product-title">{displayName}</h1>
              <div className="product-price">
                € {Number(product.cijenaProizvod).toFixed(2)}
              </div>

              <p className="product-desc-full">
                {product.opisProizvod}
              </p>

              <button className="btn btn-primary" disabled>
                Add to cart
              </button>

              <div className="seller-note">
                Recenzije su vezane za prodavača, ne za proizvod.
              </div>
            </div>
          </section>


          <section className="reviews">
            <h2>Recenzije prodavača</h2>

            <div className="reviews-grid">
              {reviews.map((r) => (
                <div key={r.id} className="review-card">
                  <div className="review-stars">
                    {"★★★★★".slice(0, r.rating)}
                    <span className="review-stars--muted">
                      {"★★★★★".slice(r.rating)}
                    </span>
                  </div>

                  <div className="review-title">{r.title}</div>
                  <div className="review-body">{r.body}</div>

                  <div className="review-footer">
                    <span>{r.reviewerName}</span>
                    <span>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
