import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listWorkshops,
  getReservedWorkshopIds,
} from "../api/workshops";
import { getCart } from "../api/cart";
import useAuth from "../hooks/useAuth";
import "../styles/pregledRadionica.css";

function formatPrice(price) {
  if (price === "" || price == null) return "—";
  const n = Number(price);
  if (Number.isNaN(n)) return String(price);
  return `${n.toFixed(2)}€`;
}

function formatDuration(mins) {
  const m = Number(mins || 0);
  if (!m) return "—";
  if (m % 60 === 0) return `${m / 60}h`;
  return `${Math.floor(m / 60)}h ${m % 60}min`;
}

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  const time = d.toTimeString().slice(0, 5);

  return `${day}/${month}/${year} - ${time}h`;
}

function getWorkshopISO(w) {
  return w?.startDateTime ?? w?.dateISO ?? w?.date ?? null;
}

export default function PregledRadionica() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [reservedIds, setReservedIds] = useState(() => new Set());
  const [cartItems, setCartItems] = useState([]);

  // FILTER STATE
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // dohvacanje radionica s API
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr("");
    listWorkshops()
      .then((data) => {
        if (!alive) return;
        setItems(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!alive) return;
        setErr(e.message || "Greška pri dohvaćanju radionica");
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    if (!user || user?.userType !== "polaznik") {
      setReservedIds(new Set());
      return () => {
        alive = false;
      };
    }
    const userId = user.id ?? user.idKorisnik;
    getReservedWorkshopIds(userId)
      .then((ids) => {
        if (!alive) return;
        setReservedIds(new Set(Array.isArray(ids) ? ids : []));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [user]);

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

  const upcomingItems = useMemo(() => {
    const now = new Date();
    return (items || []).filter((w) => {
      const iso = getWorkshopISO(w);
      if (!iso) return false;
      const d = new Date(iso);
      return !Number.isNaN(d.getTime()) && d >= now;
    });
  }, [items]);

  const organizer = user?.userType === "organizator";
  const polaznik = user?.userType === "polaznik";

  const filteredUpcomingItems = useMemo(() => {
    const locQ = (filterLocation || "").trim().toLowerCase();

    const start = filterStartDate ? new Date(`${filterStartDate}T00:00:00`) : null;
    const end = filterEndDate ? new Date(`${filterEndDate}T23:59:59`) : null;

    const maxP = maxPrice === "" ? null : Number(maxPrice);

    return (upcomingItems || []).filter((w) => {
      const iso = getWorkshopISO(w);
      const d = iso ? new Date(iso) : null;
      if (!d || Number.isNaN(d.getTime())) return false;

      if (start && d < start) return false;
      if (end && d > end) return false;

      if (locQ) {
        const loc = (w?.location || "").toLowerCase();
        if (!loc.includes(locQ)) return false;
      }

      if (maxP != null && !Number.isNaN(maxP)) {
        const priceNum =
          w?.price === "" || w?.price == null ? null : Number(w.price);
        if (priceNum == null || Number.isNaN(priceNum) || priceNum > maxP) return false;
      }

      return true;
    });
  }, [upcomingItems, filterLocation, filterStartDate, filterEndDate, maxPrice]);

  const empty = useMemo(
    () => !filteredUpcomingItems || filteredUpcomingItems.length === 0,
    [filteredUpcomingItems]
  );

  const isInCart = (workshopId) => {
    const items = Array.isArray(cartItems) ? cartItems : [];
    return items.some((item) => {
      if (item?.type && item.type !== "workshop") return false;
      if (item?.workshopId != null) return Number(item.workshopId) === Number(workshopId);
      if (item?.meta?.workshopId != null) return Number(item.meta.workshopId) === Number(workshopId);
      if (typeof item?.id === "string" && item.id.startsWith("workshop:")) {
        return Number(item.id.split(":")[1]) === Number(workshopId);
      }
      return false;
    });
  };

  const clearFilters = () => {
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterLocation("");
    setMaxPrice("");
  };

  const activeFiltersCount = useMemo(() => {
    let c = 0;
    if (filterStartDate) c++;
    if (filterEndDate) c++;
    if ((filterLocation || "").trim()) c++;
    if (maxPrice !== "") c++;
    return c;
  }, [filterStartDate, filterEndDate, filterLocation, maxPrice]);

  const goToDetails = (w) => {
    const wid = w?.id ?? w?.idRadionica ?? w?.workshopId;
    navigate(`/radionica/${wid}`);
  };

  return (
    <div className="list-page">
      <main className="list-wrap">
        <div className="list-header">
          <h1>Pregled naših radionica</h1>

          <div className="header-actions">
            <button
              type="button"
              className="filters-toggle-btn"
              onClick={() => setFiltersOpen((p) => !p)}
            >
              Filteri
              {activeFiltersCount > 0 ? (
                <span className="filters-pill">{activeFiltersCount}</span>
              ) : null}
              <span className={`chev ${filtersOpen ? "open" : ""}`} aria-hidden>
                ▾
              </span>
            </button>

            {organizer && (
              <button
                className="new-workshop-btn"
                onClick={() => navigate("/organizacijaRadionica")}
              >
                + Nova radionica
              </button>
            )}
          </div>
        </div>

        {!loading && !err && (
          <section className={`filters-dropdown ${filtersOpen ? "open" : ""}`}>
            <div className="filters-inner">
              <div className="filters-top">
                <span className="filters-caption">
                  Prikaz: <strong>{filteredUpcomingItems.length}</strong> /{" "}
                  {upcomingItems.length}
                </span>

                <button
                  type="button"
                  className="filters-clear-btn"
                  onClick={clearFilters}
                  disabled={activeFiltersCount === 0}
                >
                  Očisti
                </button>
              </div>

              <div className="filters-grid">
                <div className="field">
                  <label>Datum od</label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Datum do</label>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                  />
                </div>

                <div className="field field-wide">
                  <label>Lokacija</label>
                  <input
                    type="text"
                    placeholder="npr. Zagreb, Split..."
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                  />
                </div>

                <div className="field field-wide">
                  <label>Cijena do (€)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="npr. 30"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {loading && <div className="info">Učitavanje…</div>}
        {!!err && <div className="error">{err}</div>}

        {!loading && empty && !err && (
          <div className="empty">
            <p>Nema radionica koje odgovaraju odabranim filterima.</p>
            <button onClick={clearFilters}>Očisti filtere</button>
          </div>
        )}

        {!loading && !empty && (
          <ul className="workshop-list">
            {filteredUpcomingItems.map((w) => {
              const wid = w?.id ?? w?.idRadionica ?? w?.workshopId;
              return (
              <li key={wid ?? w.id} className="workshop-item">
                <div className="thumb" aria-hidden>
                  <div className="thumb-circle" />
                </div>

                <div className="content">
                  <h3 className="title">
                    {w.title || "Bez naziva"}
                    {reservedIds.has(wid) ? (
                      <span className="reserved-badge">[Prijavljen]</span>
                    ) : isInCart(wid) ? (
                      <span className="cart-badge">[U košarici]</span>
                    ) : Number(w.capacity) <= 0 ? (
                      <span className="full-badge">[Popunjeno]</span>
                    ) : null}
                  </h3>

                  <div className="meta">
                    <span>{formatPrice(w.price)} po osobi</span>
                    <span>•</span>
                    <span>{formatDuration(w.durationMinutes)}</span>
                  </div>

                  <div className="submeta">
                    <span>Datum: {formatDateTime(w.startDateTime)}</span>
                    {w.location ? <span>Lokacija: {w.location}</span> : null}
                    <span>Kapacitet: {w.capacity ?? "—"}</span>
                  </div>

                  {/* ✅ promjena: klik vodi na detalje */}
                  {(polaznik || organizer) && (
                    <div className="actions-row">
                      <button
                        className="new-workshop-btn"
                        onClick={() => goToDetails(w)}
                      >
                        Detalji
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
