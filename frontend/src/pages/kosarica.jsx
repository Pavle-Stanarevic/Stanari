import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearCart, getCart, removeCartItem, updateCartItemQty } from "../api/cart";
import { createCheckoutFromCart } from "../api/checkout";
import "../styles/kosarica.css";

function formatPrice(price) {
  if (price === "" || price == null) return "—";
  const n = Number(price);
  if (Number.isNaN(n)) return String(price);
  return `${n.toFixed(2)}€`;
}

export default function Kosarica() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const reload = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await getCart();
      const arr = Array.isArray(data) ? data : data?.items || [];
      setItems(Array.isArray(arr) ? arr : []);
    } catch (e) {
      setErr(e.message || "Greška pri dohvaćanju košarice.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const workshops = useMemo(() => items.filter((x) => x.type === "workshop"), [items]);
  const products = useMemo(() => items.filter((x) => x.type === "product"), [items]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.qty || 1), 0);
  }, [items]);

  const onRemove = async (itemId) => {
    try {
      await removeCartItem(itemId);
      setItems((xs) => xs.filter((x) => x.id !== itemId));
    } catch (e) {
      alert(e.message || "Ne mogu ukloniti stavku.");
    }
  };

  const onClear = async () => {
    try {
      await clearCart();
      setItems([]);
    } catch (e) {
      alert(e.message || "Ne mogu očistiti košaricu.");
    }
  };

  const onQty = async (itemId, qty) => {
    const q = Math.max(1, Number(qty || 1));
    setItems((xs) => xs.map((x) => (x.id === itemId ? { ...x, qty: q } : x)));
    try {
      await updateCartItemQty(itemId, q);
    } catch (e) {
      alert(e.message || "Ne mogu promijeniti količinu.");
      reload();
    }
  };

  const onCheckout = async () => {
    setCheckoutLoading(true);

    try {
      // pravi flow kad backend bude spreman
      const data = await createCheckoutFromCart();
      const checkoutId = data?.checkoutId || data?.id;
      if (!checkoutId) throw new Error("Backend nije vratio checkoutId.");

      navigate("/placanje", { state: { mode: "cart", checkoutId } });
    } catch (e) {
      // ✅ fallback bez backenda: pokaži stvarne stavke iz košarice
      navigate("/placanje", { state: { mode: "cart", items } });

      // Ako želiš ručni demo placeholder:
      // navigate("/placanje?demoCart=1");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="cart-page">
      <main className="cart-wrap">
        <div className="cart-header">
          <h1>Košarica</h1>
          <div className="cart-actions">
            <button className="cart-btn" onClick={() => navigate(-1)} disabled={checkoutLoading}>
              ← Natrag
            </button>
            <button
              className="cart-btn danger"
              onClick={onClear}
              disabled={!items.length || checkoutLoading}
            >
              Očisti košaricu
            </button>
          </div>
        </div>

        {loading && <div className="cart-info">Učitavanje…</div>}
        {!!err && !loading && <div className="cart-error">{err}</div>}

        {!loading && !err && items.length === 0 && (
          <div className="cart-empty">
            <p>Košarica je prazna.</p>
            <div className="cart-empty-actions">
              <button className="primary" onClick={() => navigate("/pregledRadionica")}>
                Pregled radionica
              </button>
              <button className="primary ghost" onClick={() => navigate("/shop")}>
                Shop
              </button>
            </div>
          </div>
        )}

        {!loading && !err && items.length > 0 && (
          <>
            <section className="cart-section">
              <div className="cart-section-title">
                <h2>Radionice</h2>
                <span>{workshops.length}</span>
              </div>

              {workshops.length === 0 ? (
                <div className="cart-muted">Nema radionica u košarici.</div>
              ) : (
                <ul className="cart-list">
                  {workshops.map((w) => (
                    <li key={w.id} className="cart-item">
                      <div className="cart-item-main">
                        <div className="cart-item-title">{w.title}</div>
                        {w.meta ? (
                          <div className="cart-item-meta">
                            {w.meta.dateISO ? (
                              <span>Datum: {new Date(w.meta.dateISO).toLocaleString()}</span>
                            ) : null}
                            {w.meta.location ? <span>Lokacija: {w.meta.location}</span> : null}
                          </div>
                        ) : null}
                      </div>

                      <div className="cart-item-right">
                        <div className="cart-price">{formatPrice(w.price)}</div>
                        <button className="cart-remove" onClick={() => onRemove(w.id)}>
                          Ukloni
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="cart-section">
              <div className="cart-section-title">
                <h2>Proizvodi</h2>
                <span>{products.length}</span>
              </div>

              {products.length === 0 ? (
                <div className="cart-muted">Nema proizvoda u košarici.</div>
              ) : (
                <ul className="cart-list">
                  {products.map((p) => (
                    <li key={p.id} className="cart-item">
                      <div className="cart-item-main">
                        <div className="cart-item-title">{p.title}</div>
                        {p.meta?.category ? (
                          <div className="cart-item-meta">
                            <span>Kategorija: {p.meta.category}</span>
                          </div>
                        ) : null}
                      </div>

                      <div className="cart-item-right">
                        <div className="cart-price">{formatPrice(Number(p.price || 0))}</div>
                        <button className="cart-remove" onClick={() => onRemove(p.id)}>
                          Ukloni
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="cart-summary">
              <div className="sum-row">
                <span>Ukupno</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>

              <button className="primary" onClick={onCheckout} disabled={checkoutLoading}>
                {checkoutLoading ? "Pokrećem naplatu..." : "Nastavi na plaćanje"}
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
