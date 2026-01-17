import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import "../styles/adminDashboard.css";

const TABS = {
  USERS: "Korisnici",
  PENDING: "Novi profili",
  PRICING: "Cijene članarine",
};

function statusBadgeClass(status) {
  if (status === "ACTIVE") return "badge badge-ok";
  if (status === "BLOCKED") return "badge badge-bad";
  if (status === "PENDING") return "badge badge-warn";
  return "badge";
}

function roleBadgeClass(role) {
  if (role === "ADMIN") return "role-badge role-admin";
  if (role === "ORGANIZATOR") return "role-badge role-org";
  return "role-badge role-user";
}

function formatRole(role) {
  if (role === "ADMIN") return "ADMIN";
  if (role === "ORGANIZATOR") return "ORGANIZATOR";
  return "POLAZNIK";
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tab, setTab] = useState(TABS.PENDING);

  // Placeholder users
  const [users, setUsers] = useState([
    {
      id: "u1",
      name: "Ana Horvat",
      email: "ana@example.com",
      role: "POLAZNIK",
      status: "ACTIVE",
      createdAt: "2025-12-03",
    },
    {
      id: "u2",
      name: "Studio Glina",
      email: "studio@example.com",
      role: "ORGANIZATOR",
      status: "ACTIVE",
      createdAt: "2025-12-10",
    },
    {
      id: "u3",
      name: "Marko Marić",
      email: "marko@example.com",
      role: "POLAZNIK",
      status: "BLOCKED",
      createdAt: "2025-12-12",
    },
  ]);

  // Placeholder pending organizer profiles
  const [pendingProfiles, setPendingProfiles] = useState([
    {
      id: "p1",
      name: "Keramika Luna Studio",
      email: "luna-studio@example.com",
      phone: "+385 99 123 4567",
      address: "Zagreb, Ilica 10",
      createdAt: "2026-01-10",
      status: "PENDING",
    },
    {
      id: "p2",
      name: "ClayCraft",
      email: "claycraft@example.com",
      phone: "+385 91 222 3333",
      address: "Rijeka, Korzo 1",
      createdAt: "2026-01-12",
      status: "PENDING",
    },
  ]);

  // Placeholder pricing
  const [pricing, setPricing] = useState({
    monthly: "9.99",
    yearly: "89.99",
    currency: "EUR",
  });
  const [pricingDraft, setPricingDraft] = useState(pricing);
  const [pricingSavedMsg, setPricingSavedMsg] = useState("");

  // Search
  const [qUsers, setQUsers] = useState("");
  const [qPending, setQPending] = useState("");

  const filteredUsers = useMemo(() => {
    const q = qUsers.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.role || "").toLowerCase().includes(q) ||
        (u.status || "").toLowerCase().includes(q)
      );
    });
  }, [users, qUsers]);

  const filteredPending = useMemo(() => {
    const q = qPending.trim().toLowerCase();
    if (!q) return pendingProfiles;
    return pendingProfiles.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.address || "").toLowerCase().includes(q) ||
        (p.phone || "").toLowerCase().includes(q)
      );
    });
  }, [pendingProfiles, qPending]);

  // Guard (UX)
  useEffect(() => {
    if (!user) return;

    // prilagodi ako ti user dolazi u drugom obliku (npr. user.user.role)
    const role = user?.role ?? user?.user?.role;
    if (role && role !== "ADMIN") navigate("/", { replace: true });
  }, [user, navigate]);

  // Mock actions (kasnije zamijeni API pozivima)
  function approveProfile(profileId) {
    setPendingProfiles((prev) => prev.filter((p) => p.id !== profileId));
  }

  function rejectProfile(profileId) {
    setPendingProfiles((prev) => prev.filter((p) => p.id !== profileId));
  }

  function blockUser(userId) {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: "BLOCKED" } : u))
    );
  }

  function unblockUser(userId) {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: "ACTIVE" } : u))
    );
  }

  function savePricing() {
    const m = Number(String(pricingDraft.monthly).replace(",", "."));
    const y = Number(String(pricingDraft.yearly).replace(",", "."));

    if (Number.isNaN(m) || m <= 0 || Number.isNaN(y) || y <= 0) {
      setPricingSavedMsg("Unesi ispravne cijene (pozitivan broj).");
      return;
    }

    const normalized = {
      ...pricingDraft,
      monthly: String(m.toFixed(2)),
      yearly: String(y.toFixed(2)),
    };

    setPricing(normalized);
    setPricingDraft(normalized);
    setPricingSavedMsg("Cijene spremljene (placeholder).");
    window.setTimeout(() => setPricingSavedMsg(""), 2500);
  }

  return (
    <div className="admin-wrap">
      <div className="admin-hero">
        <div>
          <h1 className="admin-title">Admin panel</h1>
          <p className="admin-subtitle">
            Upravljanje korisnicima, odobravanje profila i cijene članarina.
          </p>
        </div>

        <div className="admin-actions">
          <button className="btn btn-ghost" onClick={() => navigate(-1)}>
            Natrag
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        {Object.values(TABS).map((t) => (
          <button
            key={t}
            className={`tab ${tab === t ? "tab-active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* TAB: PENDING */}
      {tab === TABS.PENDING && (
        <div className="card">
          <div className="card-head">
            <h2>Novi profili (za odobravanje)</h2>
            <input
              className="input"
              placeholder="Pretraži po imenu/email/adresi..."
              value={qPending}
              onChange={(e) => setQPending(e.target.value)}
            />
          </div>

          {filteredPending.length === 0 ? (
            <div className="empty">
              <div className="empty-title">Nema profila za odobravanje</div>
              <div className="empty-subtitle">
                Kad backend spoji podatke, ovdje će se prikazivati pending organizatori.
              </div>
            </div>
          ) : (
            <div className="table">
              <div className="row row-head">
                <div>Naziv / Ime</div>
                <div>Email</div>
                <div>Kontakt</div>
                <div>Status</div>
                <div className="right">Akcije</div>
              </div>

              {filteredPending.map((p) => (
                <div className="row" key={p.id}>
                  <div className="cell-main">
                    <div className="strong">{p.name}</div>
                    <div className="muted">{p.address}</div>
                  </div>
                  <div>{p.email}</div>
                  <div>
                    <div>{p.phone}</div>
                    <div className="muted">Kreirano: {p.createdAt}</div>
                  </div>
                  <div>
                    <span className={statusBadgeClass(p.status)}>{p.status}</span>
                  </div>
                  <div className="right">
                    <button
                      className="btn btn-primary"
                      onClick={() => approveProfile(p.id)}
                    >
                      Odobri
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => rejectProfile(p.id)}
                    >
                      Odbij
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: USERS */}
      {tab === TABS.USERS && (
        <div className="card">
          <div className="card-head">
            <h2>Korisnici</h2>
            <input
              className="input"
              placeholder="Pretraži po imenu/email/roli/statusu..."
              value={qUsers}
              onChange={(e) => setQUsers(e.target.value)}
            />
          </div>

          <div className="table">
            <div className="row row-head row-users">
              <div>Korisnik</div>
              <div>Email</div>
              <div>Uloga</div>
              <div>Status</div>
              <div className="right">Akcije</div>
            </div>

            {filteredUsers.map((u) => (
              <div className="row row-users" key={u.id}>
                <div className="cell-main">
                  <div className="strong">{u.name}</div>
                  <div className="muted">Kreirano: {u.createdAt}</div>
                </div>
                <div>{u.email}</div>
                <div>
                  <span className={roleBadgeClass(u.role)}>{formatRole(u.role)}</span>
                </div>
                <div>
                  <span className={statusBadgeClass(u.status)}>{u.status}</span>
                </div>
                <div className="right">
                  {u.status === "ACTIVE" ? (
                    <button className="btn btn-danger" onClick={() => blockUser(u.id)}>
                      Blokiraj
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary"
                      onClick={() => unblockUser(u.id)}
                    >
                      Odblokiraj
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="hint">
            *Placeholder. Kasnije se spaja na backend listu korisnika.
          </div>
        </div>
      )}

      {/* TAB: PRICING */}
      {tab === TABS.PRICING && (
        <div className="card">
          <div className="card-head">
            <h2>Cijene članarina (organizatori)</h2>
            <div className="muted">
              Trenutno: {pricing.monthly} {pricing.currency} / mj, {pricing.yearly}{" "}
              {pricing.currency} / god
            </div>
          </div>

          <div className="pricing-grid">
            <div className="field">
              <label>Mjesecna cijena ({pricingDraft.currency})</label>
              <input
                className="input"
                value={pricingDraft.monthly}
                onChange={(e) =>
                  setPricingDraft((p) => ({ ...p, monthly: e.target.value }))
                }
                inputMode="decimal"
              />
            </div>

            <div className="field">
              <label>Godišnja cijena ({pricingDraft.currency})</label>
              <input
                className="input"
                value={pricingDraft.yearly}
                onChange={(e) =>
                  setPricingDraft((p) => ({ ...p, yearly: e.target.value }))
                }
                inputMode="decimal"
              />
            </div>

            <div className="field">
              <label>Valuta</label>
              <select
                className="input"
                value={pricingDraft.currency}
                onChange={(e) =>
                  setPricingDraft((p) => ({ ...p, currency: e.target.value }))
                }
              >
                <option value="EUR">EUR</option>
                <option value="HRK">HRK</option>
              </select>
            </div>
          </div>

          <div className="pricing-actions">
            <button className="btn btn-primary" onClick={savePricing}>
              Spremi
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setPricingDraft(pricing);
                setPricingSavedMsg("");
              }}
            >
              Odustani
            </button>

            {pricingSavedMsg ? <div className="msg">{pricingSavedMsg}</div> : null}
          </div>

          <div className="hint">
            *Kad backend bude gotov: učitaj cijene preko GET i spremi preko PUT.
          </div>
        </div>
      )}
    </div>
  );
}
