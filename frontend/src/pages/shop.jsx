import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ShopProductAdd from "../components/shopProductAdd.jsx";
import useAuth from "../hooks/useAuth";
import "../styles/shop.css";
import { PRODUCT_CATEGORIES } from "../data/productCategories";
import { getCart } from "../api/cart";


async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
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
  const [cartItems, setCartItems] = useState([]);

  const organizerStatus = String(user?.organizerStatus || "").toUpperCase();
  const isOrganizer = user?.userType === "organizator";
  const isApprovedOrganizer = isOrganizer && organizerStatus === "APPROVED";
  const isPendingOrganizer = isOrganizer && organizerStatus === "PENDING";
  const isRejectedOrganizer = isOrganizer && organizerStatus === "REJECTED";
  const isSubscribed = !!user?.isSubscribed;
  const canAddProducts = isOrganizer && isApprovedOrganizer && isSubscribed;

  async function loadMe() {
    try {
      const data = await fetchJson("/api/me", { credentials: "include" });
      setMe(data);
    } catch { }
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

  useEffect(() => {
    let alive = true;

    const refresh = async () => {
      try {
        const data = await getCart();
        const items = Array.isArray(data) ? data : data?.items || [];
        if (alive) setCartItems(Array.isArray(items) ? items : []);
      } catch {
        if (alive) setCartItems([]);
      }
    };

    refresh();
    const onCartUpdated = (e) => {
      const items = e?.detail?.items;
      if (Array.isArray(items)) setCartItems(items);
      else refresh();
      loadProducts();
    };
    const onStorage = (e) => {
      if (e.key && e.key.startsWith("stanari_cart_v1:")) {
        refresh();
        loadProducts();
      }
    };

    window.addEventListener("cart:updated", onCartUpdated);
    window.addEventListener("storage", onStorage);
    return () => {
      alive = false;
      window.removeEventListener("cart:updated", onCartUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, [user]);

  const isProductInCart = (productId) => {
    const items = Array.isArray(cartItems) ? cartItems : [];
    return items.some((item) => {
      if (item?.type && item.type !== "product") return false;
      if (item?.productId != null) return Number(item.productId) === Number(productId);
      if (item?.meta?.productId != null) return Number(item.meta.productId) === Number(productId);
      if (typeof item?.id === "string" && item.id.startsWith("product:")) {
        return Number(item.id.split(":")[1]) === Number(productId);
      }
      return false;
    });
  };

  const categories = useMemo(() => ["", ...PRODUCT_CATEGORIES], []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (p?.kupljen) return false;
      const okCategory = !category || p.kategorijaProizvod === category;
      const price = Number(p.cijenaProizvod);
      const okPrice = Number.isFinite(price) ? price <= maxPrice : true;
      return okCategory && okPrice;
    });
  }, [products, category, maxPrice]);

  const showEmpty = !loading && !error && filtered.length === 0;

  function resetFilters() {
    setCategory("");
    setMaxPrice(500);
  }

  const filtersActive = category !== "" || maxPrice !== 500;

  return (
    <main className="shop-page">
      <section className="hero">
        <div className="hero-overlay">
          <div className="hero-content">
            <h1>Clay Play Shop</h1>
            <p>Kupite keramičke proizvode naših stručnjaka i instruktora</p>

            <div className="hero-actions">
              {isOrganizer && (
                <div style={{ display: "grid", gap: 6 }}>
                  <button
                    className="hero-btn hero-btn--secondary"
                    onClick={() => setIsAddOpen(true)}
                    type="button"
                    disabled={!canAddProducts}
                    title={
                      isPendingOrganizer
                        ? "Čeka se odobrenje admina"
                        : isRejectedOrganizer
                        ? "Profil je odbijen"
                        : !isSubscribed
                        ? "Potrebna je aktivna pretplata"
                        : ""
                    }
                  >
                    + Dodaj proizvod
                  </button>
                  {!canAddProducts ? (
                    <div className="hint" style={{ margin: 0 }}>
                      {isPendingOrganizer
                        ? "Čeka se odobrenje admina."
                        : isRejectedOrganizer
                        ? "Profil je odbijen."
                        : !isSubscribed
                        ? "Za objavu proizvoda potrebna je aktivna pretplata."
                        : ""}
                    </div>
                  ) : null}
                </div>
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

          {/* CIJENA */}
          <div className="filter">
            <div className="filter-labelRow">
              <label htmlFor="price" className="filter-label">
                Raspon cijena
              </label>
            </div>

            <div className="price-filter">
              <div className="price-values">
                <span>€ 0</span>
                <span>€ {maxPrice}</span>
              </div>

              <input
                id="price"
                type="range"
                min="0"
                max="500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
              />
            </div>
          </div>


          <div className="filter filter-reset">
            <button
              type="button"
              className="reset-btn"
              onClick={resetFilters}
              disabled={!filtersActive}
            >
              Reset filtera
            </button>
          </div>
        </div>
      </section>

      {/* STATUS */}
      {loading && <div className="status">Učitavanje...</div>}
      {!loading && error && <div className="status status--error">{error}</div>}

      {/* PROIZVODI */}
      <section className="products">
        {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard i={i} />)}

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
                alt={p.opisProizvod || p.nazivProizvod || p.title || "Proizvod"}
                loading="lazy"
              />
              <div className="product-body">
                <div className="product-top">
                  <h3 className="product-title">{p.opisProizvod || p.nazivProizvod || p.title || "Proizvod"}</h3>
                  {isProductInCart(p.proizvodId ?? p.id ?? p.productId) && (
                    <span className="cart-badge">U košarici</span>
                  )}
                  <span className="product-price">€ {Number(p.cijenaProizvod).toFixed(2)}</span>
                </div>
                <div className="product-category">{p.kategorijaProizvod || p.kategorija || ""}</div>
                <div className="product-rating">
                  <span className="product-rating-score">
                    {Number.isFinite(Number(p.organizerAvgRating))
                      ? Number(p.organizerAvgRating).toFixed(1)
                      : "0.0"}
                  </span>
                  <span className="product-rating-stars" aria-label="Prosječna ocjena organizatora">
                    {"★".repeat(Math.round(Number(p.organizerAvgRating || 0)))}
                    {"☆".repeat(5 - Math.round(Number(p.organizerAvgRating || 0)))}
                  </span>
                  <span className="product-rating-count">({Number(p.organizerReviewCount || 0)})</span>
                </div>
              </div>
            </Link>
          ))}

        {showEmpty && <div className="status">Trenutno nema proizvoda.</div>}
      </section>

      {/* MODAL */}
      <ShopProductAdd
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onCreated={loadProducts}
      />
    </main>
  );
}
