import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { clearCart, getCart, removeCartItem, updateCartItemQty } from "../api/cart";
import { createCheckoutFromCart } from "../api/checkout";
import "../styles/kosarica.css";

function formatPrice(price) {
  if (price === "" || price == null) return "—";
  const n = Number(price);
  if (Number.isNaN(n)) return String(price);
  return `${n.toFixed(2)}€`;
}

function getItemTitle(it) {
  if (!it) return "";
  if (it.title && String(it.title).trim() && String(it.title).trim().toLowerCase() !== 'proizvod') return it.title;

  const meta = it.meta;
  let metaObj = null;
  if (meta) {
    if (typeof meta === 'string') {
      try { metaObj = JSON.parse(meta); } catch { metaObj = null; }
    } else if (typeof meta === 'object') metaObj = meta;
  }

  if (metaObj) {
    return (
      metaObj.opisProizvod || metaObj.nazivProizvod || metaObj.title || metaObj.name || metaObj.productName || metaObj.category || it.title || 'Proizvod'
    );
  }

  return it.title || 'Proizvod';
}

export default function Kosarica() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orderNote, setOrderNote] = useState("");

  const reload = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await getCart();
      const arr = Array.isArray(data) ? data : data?.items || [];
      const normalized = Array.isArray(arr) ? arr : [];
      setItems(normalized);

      (async function enrich() {
        if (!normalized || !normalized.length) return;
        const base = import.meta.env.VITE_API_URL || "";

        async function tryFetchPaths(paths) {
          for (const p of paths) {
            try {
              const res = await fetch(base + p, { credentials: 'include' });
              if (!res.ok) continue;
              const body = await res.json();
              return body?.item || body?.product || body?.workshop || body;
            } catch (e) { }
          }
          return null;
        }

        let changed = false;
        const updated = await Promise.all(
          normalized.map(async (it) => {
            const copy = { ...it };
            // if title or price missing, try to fetch
            if ((!copy.title || copy.title === "" || Number(copy.price || 0) === 0) && copy.productId) {
              const id = copy.productId;
              const candidate = await tryFetchPaths([
                `/api/proizvodi/${id}`,
                `/api/proizvod/${id}`,
                `/api/products/${id}`,
                `/api/product/${id}`,
              ]);
              if (candidate) {
                if (!copy.title) copy.title = candidate.opisProizvod || candidate.nazivProizvod || candidate.title || candidate.naziv || candidate.name || candidate.naslov;
                if (!copy.price || Number(copy.price) === 0) copy.price = candidate.cijenaProizvod ?? candidate.price ?? candidate.amount ?? copy.price;
                if (!copy.meta) {
                  const metaObj = candidate.meta || candidate || null;
                  if (candidate.kategorijaProizvod && typeof metaObj === 'object') metaObj.category = candidate.kategorijaProizvod;
                  copy.meta = metaObj;
                }
                changed = true;
              }
            }

            if ((!copy.title || copy.title === "" || Number(copy.price || 0) === 0) && copy.idRadionica) {
              const id = copy.idRadionica;
              const candidate = await tryFetchPaths([
                `/api/radionica/${id}`,
                `/api/radionice/${id}`,
                `/api/workshop/${id}`,
                `/api/workshops/${id}`,
              ]);
              if (candidate) {
                if (!copy.title) copy.title = candidate.title || candidate.naslov || candidate.name;
                if (!copy.price || Number(copy.price) === 0) copy.price = candidate.price ?? candidate.cijena ?? copy.price;
                if (!copy.meta) copy.meta = candidate.meta || candidate || null;
                changed = true;
              }
            }

            return copy;
          })
        );

        if (changed) setItems(updated);
      })();

    } catch (e) {
      setErr(e.message || "Greška pri dohvaćanju košarice.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    reload();
  }, [user, navigate]);

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
      setOrderNote("");
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
      const userId = user?.id ?? user?.idKorisnik ?? user?.userId;
      const res = await createCheckoutFromCart({ userId });
      const checkoutId = res?.checkoutId;
      const total = res?.total;
      const items = res?.items || [];

      if (!checkoutId) throw new Error("Ne mogu kreirati narudžbu (checkout). Pokušajte ponovno.");

      navigate("/placanje", { state: { mode: "cart", checkoutId, checkout: { checkoutId, total, items } } });
    } catch (e) {
      const msg = e?.message || (e?.body || e?.toString()) || "Ne mogu potvrditi narudžbu.";
      alert(msg);
      try { await reload(); } catch (ignored) {}
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
        {!!orderNote && !loading && !err && <div className="cart-info">{orderNote}</div>}

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
                        <div className="cart-item-title">{getItemTitle(p)}</div>
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
                {checkoutLoading ? "Pripremam…" : "Idi na plaćanje"}
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
