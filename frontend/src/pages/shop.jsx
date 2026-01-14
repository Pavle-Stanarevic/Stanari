import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ShopProductAdd from "../components/shopProductAdd.jsx";
import useAuth from "../hooks/useAuth";
import "../styles/shop.css";

// Prava pristupa temeljem prijavljenog korisnika

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const contentType = res.headers.get("content-type") || "";

  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || `HTTP ${res.status}`);
  }

  if (!contentType.includes("application/json")) {
    throw new Error(`API nije vratio JSON. Dobio sam: ${text.slice(0, 80)}...`);
  }

  return JSON.parse(text);
}

function SkeletonCard({ i }) {
  return (
    <div className="product-card skeleton" key={`sk-${i}`}>
      <div className="skeleton-img" />
      <div className="product-body">
        <div className="product-top">
          <div className="skeleton-line w-60" />
          <div className="skeleton-line w-30" />
        </div>
        <div className="skeleton-line w-95" />
        <div className="skeleton-line w-85" />
        <div className="skeleton-line w-70" />
      </div>
    </div>
  );
}

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [me, setMe] = useState(null);
  const { user } = useAuth();

  const [category, setCategory] = useState("");
  const [maxPrice, setMaxPrice] = useState(500);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const canAddProducts = (user?.userType === "organizator");

  async function loadMe() {
    try {
      const data = await fetchJson("/api/me", { credentials: "include" });
      setMe(data);
    } catch {
      // ignore
    }
  }

  async function loadProducts() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchJson("/api/products");
      const list = Array.isArray(data) ? data : data.items ?? [];
      setProducts(list);
    } catch (e) {
      setError(e.message || "Greška kod dohvaćanja proizvoda.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
    loadProducts();
  }, []);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.kategorijaProizvod).filter(Boolean));
    return ["", ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const okCategory = !category || p.kategorijaProizvod === category;
      const price = Number(p.cijenaProizvod);
      const okPrice = Number.isFinite(price) ? price <= maxPrice : true;
      return okCategory && okPrice;
    });
  }, [products, category, maxPrice]);

  const showEmpty = !loading && !error && filtered.length === 0;

  return (
    <>
      <main className="shop-page">
        <section className="hero">
          <div className="hero-overlay">
            <div className="hero-content">
              <h1>Clay Play Shop</h1>
              <p>Kupite keramičke proizvode naših stručnjaka i instruktora</p>

              <div className="hero-actions">
                {canAddProducts && (
                  <button
                    className="hero-btn hero-btn--secondary"
                    onClick={() => setIsAddOpen(true)}
                    type="button"
                  >
                    + Dodaj proizvod
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* FILTERI */}
        <section className="filters">
          <div className="filters-inner">
            <div className="filter">
              <label htmlFor="category">Kategorija</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c || "all"} value={c}>
                    {c || "Sve kategorije"}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter">
              <label htmlFor="price">Max cijena: € {maxPrice}</label>
              <div className="price-filter">
                <div className="price-values">
                  <span>€ 0</span>
                  <span>€ 500</span>
                </div>
                <input
                  id="price"
                  type="range"
                  min="0"
                  max="500"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                />
                <small>Raspon cijena</small>
              </div>
            </div>
          </div>
        </section>

        {/* STATUS */}
        {loading && <div className="status">Učitavanje...</div>}
        {!loading && error && <div className="status status--error">{error}</div>}

        {/* PROIZVODI */}
        <section className="products">
          {loading &&
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard i={i} />)}

          {!loading &&
            !error &&
            filtered.map((p) => (
              <Link
                key={p.proizvodId}
                to={`/shop/${p.proizvodId}`}
                className="product-card"
              >
                <img
                  src={p.imageUrl || "/images/placeholder.jpg"}
                  alt="Proizvod"
                  loading="lazy"
                />
                <div className="product-body">
                  <div className="product-top">
                    <h3 className="product-title">
                      {p.nazivProizvod || p.title || p.kategorijaProizvod || "Proizvod"}
                    </h3>
                    <span className="product-price">
                      € {Number(p.cijenaProizvod).toFixed(2)}
                    </span>
                  </div>
                  <p className="product-desc">{p.opisProizvod}</p>
                </div>
              </Link>
            ))}

          {showEmpty && (
            <div className="status">Trenutno nema proizvoda.</div>
          )}

        </section>

        {/* MODAL */}
        <ShopProductAdd
          open={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onCreated={loadProducts}
        />
      </main>
    </>
  );
}
