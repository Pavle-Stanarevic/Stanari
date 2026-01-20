import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import "../styles/detaljiProizvoda.css";

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

function formatPriceEUR(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `€ ${n.toFixed(2)}`;
}

export default function ProductPage() {
  const { proizvodId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const p = await fetchJson(`/api/products/${proizvodId}`);
        if (!alive) return;
        setProduct(p);
        if (!p) setError("Proizvod nije pronađen.");
      } catch (e) {
        if (!alive) return;
        setError(e.message || "Greška.");
      } finally {
        alive && setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [proizvodId]);

  const displayName =
    product?.nazivProizvod || product?.kategorijaProizvod || "Proizvod";

  const productTitle = product?.opisProizvod || displayName;

  const productIdResolved =
    product?.idProizvod ??
    product?.proizvodId ??
    product?.id ??
    proizvodId;

  const isPurchased = Boolean(product?.kupljen);

  const onBuyProduct = async () => {
    try {
      if (!user) throw new Error("Prijavite se da biste mogli kupiti proizvod.");
      if (user?.userType !== "polaznik")
        throw new Error("Samo polaznici mogu kupiti proizvod.");
      if (!product) return;

      // ID fallback logika (za slučaj da backend vraća različito ime polja)
      const id = productIdResolved;
      if (isPurchased) throw new Error("Proizvod je već kupljen.");
      const userId = user?.id ?? user?.idKorisnik ?? user?.userId;
      if (!userId) throw new Error("Nedostaje ID korisnika.");

      setAdding(true);
      const updated = await fetchJson(`/api/products/${id}/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      setProduct(updated);
      navigate("/shop");
    } catch (e) {
      alert(e.message || "Kupnja nije uspjela.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <main className="product-page">
      <div className="pd-topbar">
        <Link className="pd-back" to="/shop">
          ← Natrag
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
              <h1 className="product-title">{productTitle}</h1>
              <p className="product-desc-full">{displayName}</p>

              <div className="pd-rating">
                <span className="pd-rating-score">
                  {Number.isFinite(Number(product?.organizerAvgRating))
                    ? Number(product.organizerAvgRating).toFixed(1)
                    : "0.0"}
                </span>
                <span className="pd-rating-stars" aria-label="Prosječna ocjena organizatora">
                  {"★".repeat(Math.round(Number(product?.organizerAvgRating || 0)))}
                  {"☆".repeat(5 - Math.round(Number(product?.organizerAvgRating || 0)))}
                </span>
                <span className="pd-rating-count">({Number(product?.organizerReviewCount || 0)})</span>
              </div>

              <div className="product-price">
                {formatPriceEUR(product.cijenaProizvod)}
              </div>

              <div className="product-actions">
                <button
                  className="btn btn-primary"
                  onClick={onBuyProduct}
                  disabled={adding || isPurchased || !user}
                  title={!user ? "Odjavljeni ste" : ""}
                >
                  {adding
                    ? "Kupujem..."
                    : !user
                    ? "Odjavljeni ste"
                    : isPurchased
                    ? "Kupljeno"
                    : "Kupi"}
                </button>
              </div>

              <div className="seller-note">
                Recenzije su vezane za prodavača, ne za proizvod.
              </div>
            </div>
          </section>

          <section className="pd-comments">
            <h2 className="pd-comments-title">Recenzije organizatora</h2>
            {Array.isArray(product?.organizerReviewComments) && product.organizerReviewComments.length ? (
              <ul className="pd-comments-list">
                {product.organizerReviewComments.map((c, i) => (
                  <li key={`${productIdResolved}-c-${i}`}>{c}</li>
                ))}
              </ul>
            ) : (
              <div className="pd-comments-empty">Još nema recenzija organizatora.</div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
