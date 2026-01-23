import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import {
  approveProfile as approveProfileApi,
  blockUser as blockUserApi,
  getMembershipPricing,
  listPendingProfiles,
  listUsers,
  rejectProfile as rejectProfileApi,
  unblockUser as unblockUserApi,
  updateMembershipPricing,
} from "../api/admin";
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

  const [users, setUsers] = useState([]);
  const [pendingProfiles, setPendingProfiles] = useState([]);

  // --- Pricing (valuta fiksna EUR; dropdown uklonjen) ---
  const [pricing, setPricing] = useState({
    monthly: "9.99",
    yearly: "89.99",
    currency: "EUR",
  });
  const [pricingDraft, setPricingDraft] = useState(pricing);
  const [pricingSavedMsg, setPricingSavedMsg] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingPending, setLoadingPending] = useState(false);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [errorUsers, setErrorUsers] = useState("");
  const [errorPending, setErrorPending] = useState("");
  const [errorPricing, setErrorPricing] = useState("");

  // --- Search / filter ---
  const [qUsers, setQUsers] = useState("");
  const [qPending, setQPending] = useState("");

  const filteredUsers = useMemo(() => {
    const q = qUsers.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      return (
        String(u.name || "").toLowerCase().includes(q) ||
        String(u.email || "").toLowerCase().includes(q) ||
        String(u.role || "").toLowerCase().includes(q) ||
        String(u.status || "").toLowerCase().includes(q)
      );
    });
  }, [users, qUsers]);

  const filteredPending = useMemo(() => {
    const q = qPending.trim().toLowerCase();
    if (!q) return pendingProfiles;
    return pendingProfiles.filter((p) => {
      return (
        String(p.name || "").toLowerCase().includes(q) ||
        String(p.email || "").toLowerCase().includes(q) ||
        String(p.address || "").toLowerCase().includes(q) ||
        String(p.phone || "").toLowerCase().includes(q)
      );
    });
  }, [pendingProfiles, qPending]);

  // --- Guard: ako nije admin ---
  useEffect(() => {
    const role = user?.role ?? user?.user?.role ?? null;
    if (role !== "ADMIN") navigate("/", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    const role = user?.role ?? user?.user?.role;
    if (!role || role !== "ADMIN") return;

    const loadAll = async () => {
      try {
        setLoadingUsers(true);
        setErrorUsers("");
        const data = await listUsers();
        setUsers(Array.isArray(data) ? data : []);
      } catch (e) {
        setErrorUsers(e.message || "Ne mogu dohvatiti korisnike.");
      } finally {
        setLoadingUsers(false);
      }

      try {
        setLoadingPending(true);
        setErrorPending("");
        const data = await listPendingProfiles();
        setPendingProfiles(Array.isArray(data) ? data : []);
      } catch (e) {
        setErrorPending(e.message || "Ne mogu dohvatiti pending profile.");
      } finally {
        setLoadingPending(false);
      }

      try {
        setLoadingPricing(true);
        setErrorPricing("");
        const data = await getMembershipPricing();
        const normalized = {
          monthly: String(data?.monthly ?? pricing.monthly),
          yearly: String(data?.yearly ?? pricing.yearly),
          currency: "EUR",
        };
        setPricing(normalized);
        setPricingDraft(normalized);
      } catch (e) {
        setErrorPricing(e.message || "Ne mogu dohvatiti cijene članarina.");
      } finally {
        setLoadingPricing(false);
      }
    };

    loadAll();
  }, [user]);

  // --- Mock actions (kasnije zamijeni s API) ---
  async function approveProfile(profileId) {
    await approveProfileApi(profileId);
    const data = await listPendingProfiles();
    setPendingProfiles(Array.isArray(data) ? data : []);
    const usersData = await listUsers();
    setUsers(Array.isArray(usersData) ? usersData : []);
  }

  async function rejectProfile(profileId) {
    await rejectProfileApi(profileId);
    const data = await listPendingProfiles();
    setPendingProfiles(Array.isArray(data) ? data : []);
    const usersData = await listUsers();
    setUsers(Array.isArray(usersData) ? usersData : []);
  }

  async function blockUser(userId) {
    await blockUserApi(userId);
    const data = await listUsers();
    setUsers(Array.isArray(data) ? data : []);
  }

  async function unblockUser(userId) {
    await unblockUserApi(userId);
    const data = await listUsers();
    setUsers(Array.isArray(data) ? data : []);
  }

  async function savePricing() {
    const m = Number(String(pricingDraft.monthly).replace(",", "."));
    const y = Number(String(pricingDraft.yearly).replace(",", "."));
    if (Number.isNaN(m) || m <= 0 || Number.isNaN(y) || y <= 0) {
      setPricingSavedMsg("Unesi ispravne cijene (pozitivan broj).");
      return;
    }

    const normalized = {
      monthly: String(m.toFixed(2)),
      yearly: String(y.toFixed(2)),
      currency: "EUR", // fiksno
    };

    await updateMembershipPricing({ monthly: normalized.monthly, yearly: normalized.yearly });
    setPricing(normalized);
    setPricingDraft(normalized);
    setPricingSavedMsg("Cijene su spremljene.");
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

          {loadingPending ? (
            <div className="empty">
              <div className="empty-title">Učitavanje…</div>
            </div>
          ) : errorPending ? (
            <div className="empty">
              <div className="empty-title">{errorPending}</div>
            </div>
          ) : filteredPending.length === 0 ? (
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
                  {u.role === "ADMIN" ? null : u.status === "ACTIVE" ? (
                    <button
                      className="btn btn-danger"
                      onClick={() => blockUser(u.id)}
                    >
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

          {loadingUsers ? <div className="hint">Učitavanje korisnika…</div> : null}
          {errorUsers ? <div className="hint">{errorUsers}</div> : null}
        </div>
      )}


      {tab === TABS.PRICING && (
        <div className="card">
          <div className="card-head">
            <h2>Cijene članarina (organizatori)</h2>
            <div className="muted">
              Trenutno: {pricing.monthly} € / mj, {pricing.yearly} € / god
            </div>
          </div>

          {loadingPricing ? <div className="hint">Učitavanje cijena…</div> : null}
          {errorPricing ? <div className="hint">{errorPricing}</div> : null}

          <div className="pricing-grid">
            <div className="field">
              <label>Mjesecna cijena (€)</label>
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
              <label>Godišnja cijena (€)</label>
              <input
                className="input"
                value={pricingDraft.yearly}
                onChange={(e) =>
                  setPricingDraft((p) => ({ ...p, yearly: e.target.value }))
                }
                inputMode="decimal"
              />
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
