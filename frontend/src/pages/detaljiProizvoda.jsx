import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { addProductToCart, getCart } from "../api/cart";
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
  const [cartItems, setCartItems] = useState([]);

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
    };
    const onStorage = (e) => {
      if (e.key && e.key.startsWith("stanari_cart_v1:")) refresh();
    };

    window.addEventListener("cart:updated", onCartUpdated);
    window.addEventListener("storage", onStorage);
    return () => {
      alive = false;
      window.removeEventListener("cart:updated", onCartUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, [user]);

  const displayName =
    product?.nazivProizvod || product?.kategorijaProizvod || "Proizvod";

  const productTitle = product?.opisProizvod || displayName;

  const productIdResolved =
    product?.idProizvod ??
    product?.proizvodId ??
    product?.id ??
    proizvodId;

  const isInCart = cartItems.some((item) => {
    if (item?.type && item.type !== "product") return false;
    if (item?.productId != null) return Number(item.productId) === Number(productIdResolved);
    if (item?.meta?.productId != null) return Number(item.meta.productId) === Number(productIdResolved);
    if (typeof item?.id === "string" && item.id.startsWith("product:")) {
      return Number(item.id.split(":")[1]) === Number(productIdResolved);
    }
    return false;
  });

  const onAddToCart = async () => {
    try {
      if (!user) throw new Error("Prijavite se da biste mogli dodati proizvod u košaricu.");
      if (user?.userType !== "polaznik")
        throw new Error("Samo polaznici mogu dodati proizvod u košaricu.");
      if (!product) return;

      // ID fallback logika (za slučaj da backend vraća različito ime polja)
      const id = productIdResolved;
      if (isInCart) throw new Error("Proizvod je već u košarici.");

      setAdding(true);
      await addProductToCart(Number(id), 1, {
        title: productTitle,
        price: product?.cijenaProizvod,
        category: product?.kategorijaProizvod,
      });
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
                  disabled={adding || isInCart || !user}
                  title={!user ? "Odjavljeni ste" : ""}
                >
                  {adding
                    ? "Dodajem..."
                    : !user
                    ? "Odjavljeni ste"
                    : isInCart
                    ? "U košarici"
                    : "Dodaj u košaricu"}
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
