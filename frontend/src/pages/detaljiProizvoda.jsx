import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { addProductToCart } from "../api/cart";
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

  const onAddToCart = async () => {
    try {
      if (!user) throw new Error("Prijavite se da biste mogli dodati proizvod u košaricu.");
      if (user?.userType !== "polaznik")
        throw new Error("Samo polaznici mogu dodati proizvod u košaricu.");
      if (!product) return;

      // ID fallback logika (za slučaj da backend vraća različito ime polja)
      const id =
        product?.idProizvod ??
        product?.proizvodId ??
        product?.id ??
        proizvodId;

      setAdding(true);
      await addProductToCart(Number(id), 1);
      navigate("/kosarica");
    } catch (e) {
      alert(e.message || "Nije moguće dodati u košaricu.");
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

              <div className="product-price">
                {formatPriceEUR(product.cijenaProizvod)}
              </div>

              <div className="product-actions">
                <button
                  className="btn btn-primary"
                  onClick={onAddToCart}
                  disabled={adding}
                >
                  {adding ? "Dodajem..." : "Dodaj u košaricu"}
                </button>

                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => navigate("/kosarica")}
                >
                  Idi u košaricu
                </button>
              </div>

              <div className="seller-note">
                Recenzije su vezane za prodavača, ne za proizvod.
              </div>
            </div>
          </section>

          {/* Recenzije prodavača će doći kasnije kad API bude spreman */}
        </>
      )}
    </main>
  );
}
