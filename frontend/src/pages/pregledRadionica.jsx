import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listWorkshops, getReservedWorkshopIds } from "../api/workshops";
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
  if (Number.isNaN(d.getTime())) return "—";
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
  const [cartItems, setCartItems] = useState([]);
  const [reservedIds, setReservedIds] = useState(() => new Set());

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // tabovi
  const [activeTab, setActiveTab] = useState("upcoming"); // "upcoming" | "past"

  // filteri
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const organizer = user?.userType === "organizator";
  const polaznik = user?.userType === "polaznik";

  // 1) radionice
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

  // 2) košarica (samo refresh na load / promjena usera)
  useEffect(() => {
    let alive = true;

    const refresh = async () => {
      try {
        const data = await getCart();
        const arr = Array.isArray(data) ? data : data?.items || [];
        if (alive) setCartItems(Array.isArray(arr) ? arr : []);
      } catch {
        if (alive) setCartItems([]);
      }
    };

    refresh();
    return () => {
      alive = false;
    };
  }, [user]);

  // 3) prijavljene radionice (samo polaznik)
  useEffect(() => {
    let alive = true;

    if (!user || user?.userType !== "polaznik") {
      setReservedIds(new Set());
      return () => {
        alive = false;
      };
    }

    const userId = user?.id ?? user?.idKorisnik ?? user?.userId;
    if (userId == null) {
      setReservedIds(new Set());
      return () => {
        alive = false;
      };
    }

    getReservedWorkshopIds(userId)
      .then((ids) => {
        if (!alive) return;
        const nums = Array.isArray(ids) ? ids.map((x) => Number(x)) : [];
        setReservedIds(new Set(nums.filter((n) => !Number.isNaN(n))));
      })
      .catch(() => {
        if (!alive) return;
        setReservedIds(new Set());
      });

    return () => {
      alive = false;
    };
  }, [user]);

  // 4) podjela na prošle/nadolazeće
  const { pastItems, upcomingItems } = useMemo(() => {
    const now = new Date();
    const past = [];
    const upcoming = [];

    for (const w of items || []) {
      const iso = getWorkshopISO(w);
      if (!iso) continue;
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) continue;
      if (d < now) past.push(w);
      else upcoming.push(w);
    }

    past.sort((a, b) => new Date(getWorkshopISO(b)) - new Date(getWorkshopISO(a)));
    upcoming.sort((a, b) => new Date(getWorkshopISO(a)) - new Date(getWorkshopISO(b)));

    return { pastItems: past, upcomingItems: upcoming };
  }, [items]);

  const baseList = activeTab === "upcoming" ? upcomingItems : pastItems;

  // 5) filter na aktivnom tabu
  const filteredItems = useMemo(() => {
    const locQ = (filterLocation || "").trim().toLowerCase();
    const start = filterStartDate ? new Date(`${filterStartDate}T00:00:00`) : null;
    const end = filterEndDate ? new Date(`${filterEndDate}T23:59:59`) : null;
    const maxP = maxPrice === "" ? null : Number(maxPrice);

    return (baseList || []).filter((w) => {
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
        const priceNum = w?.price === "" || w?.price == null ? null : Number(w.price);
        if (priceNum == null || Number.isNaN(priceNum) || priceNum > maxP) return false;
      }

      return true;
    });
  }, [baseList, filterLocation, filterStartDate, filterEndDate, maxPrice]);

  const empty = !loading && !err && filteredItems.length === 0;

  const isInCart = (workshopId) => {
    const arr = Array.isArray(cartItems) ? cartItems : [];
    return arr.some((item) => {
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

  const currentUserId = user?.id ?? user?.userId ?? user?.korisnikId ?? null;

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

            {organizer ? (
              <button
                className="new-workshop-btn"
                onClick={() => navigate("/organizacijaRadionica")}
              >
                + Nova radionica
              </button>
            ) : null}
          </div>
        </div>

        {!loading && !err ? (
          <div className="rw-tabs">
            <button
              type="button"
              className={`rw-tab ${activeTab === "past" ? "active" : ""}`}
              onClick={() => setActiveTab("past")}
            >
              Prošle <span className="rw-count">{pastItems.length}</span>
            </button>

            <button
              type="button"
              className={`rw-tab ${activeTab === "upcoming" ? "active" : ""}`}
              onClick={() => setActiveTab("upcoming")}
            >
              Nadolazeće <span className="rw-count">{upcomingItems.length}</span>
            </button>
          </div>
        ) : null}

        {!loading && !err ? (
          <section className={`filters-dropdown ${filtersOpen ? "open" : ""}`}>
            <div className="filters-inner">
              <div className="filters-top">
                <span className="filters-caption">
                  Prikaz: <strong>{filteredItems.length}</strong> / {baseList.length}
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
        ) : null}

        {loading ? <div className="info">Učitavanje…</div> : null}
        {err ? <div className="error">{err}</div> : null}

        {empty ? (
          <div className="empty">
            <p>Nema radionica koje odgovaraju odabranom tabu i filterima.</p>
            <button onClick={clearFilters}>Očisti filtere</button>
          </div>
        ) : null}

        {!loading && !err && !empty ? (
          <ul className="workshop-list">
            {filteredItems.map((w) => {
              const wid = Number(w?.id ?? w?.idRadionica ?? w?.workshopId);
              const ownerId = w?.organizerId ?? w?.organizatorId ?? w?.idKorisnik ?? null;
              const isOwner =
                organizer &&
                currentUserId != null &&
                ownerId != null &&
                Number(currentUserId) === Number(ownerId);

              const isUpcoming = activeTab === "upcoming";
              const isReserved = reservedIds.has(wid);
              const inCart = isInCart(wid);
              const isFull = Number(w?.capacity) <= 0;

              return (
                <li key={wid} className="workshop-item">
                  <div className="thumb" aria-hidden>
                    <div className="thumb-circle" />
                  </div>

                  <div className="content">
                    <h3 className="title">
                      {w.title || "Bez naziva"}
                      {isOwner ? (
                        <span className="owner-badge">[Vaša radionica]</span>
                      ) : isUpcoming && isReserved ? (
                        <span className="reserved-badge">[Prijavljen]</span>
                      ) : isUpcoming && inCart ? (
                        <span className="cart-badge">[U košarici]</span>
                      ) : isUpcoming && isFull ? (
                        <span className="full-badge">[Popunjeno]</span>
                      ) : null}
                    </h3>

                    <div className="meta">
                      <span>{formatPrice(w.price)} po osobi</span>
                      <span>•</span>
                      <span>{formatDuration(w.durationMinutes)}</span>
                    </div>

                    <div className="submeta">
                      <span>Datum: {formatDateTime(getWorkshopISO(w))}</span>
                      {w.location ? <span>Lokacija: {w.location}</span> : null}
                      {isUpcoming ? <span>Kapacitet: {w.capacity ?? "—"}</span> : null}
                    </div>

                    <div className="actions-row">
                      <button className="new-workshop-btn" onClick={() => goToDetails(w)}>
                        Detalji
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </main>
    </div>
  );
}
