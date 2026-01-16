import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../styles/productPage.css";

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

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      // Dohvat iz backenda
      try {
        const p = await fetchJson(`/api/products/${proizvodId}`);
        setProduct(p);
      } catch (e) {
        setError(e.message || "Greška.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [proizvodId]);

  const displayName = product?.nazivProizvod || product?.kategorijaProizvod || "Proizvod";

  return (
    <main className="product-page">
      <div className="crumbs">
        <Link className="crumb" to="/shop">
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
              <h1 className="product-title">{product.opisProizvod}</h1>
              <p className="product-desc-full">
                {displayName}
              </p>
              <div className="product-price">
                € {Number(product.cijenaProizvod).toFixed(2)}
              </div>

              

              <button className="btn btn-primary" disabled>
                Add to cart
              </button>

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
