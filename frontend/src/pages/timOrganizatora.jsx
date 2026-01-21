import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/timOrganizatora.css";

const API = import.meta.env.VITE_API_URL || "";

function getDisplayName(o) {
  if (o?.studyName) return o.studyName;
  return `${o?.firstName || ""} ${o?.lastName || ""}`.trim() || "Organizator";
}

function resolvePhotoUrl(o) {
  const raw = o?.photoUrl || o?.fotoUrl || o?.avatarUrl || "";
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("/")) return `${API}${raw}`;
  return raw;
}

export default function TimOrganizatora() {
  const navigate = useNavigate();

  const [organizatori, setOrganizatori] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const url = `${API}/api/organizatori`;
        console.log(`[DEBUG_LOG] TimOrganizatora: Fetching ${url}`);
        const res = await fetch(url, {
          credentials: "include",
        });
        console.log(`[DEBUG_LOG] TimOrganizatora: Response status: ${res.status}`);

        if (!res.ok) throw new Error("Backend endpoint nije dostupan.");

        const data = await res.json();
        if (!alive) return;

        setOrganizatori(Array.isArray(data) && data.length ? data : []);
      } catch (e) {
        if (!alive) return;
        console.error(`[DEBUG_LOG] TimOrganizatora: Error:`, e);
        setError(e.message || "Greška pri dohvaćanju organizatora.");
        setOrganizatori([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => (alive = false);
  }, []);

  return (
    <div className="team-page">
      <div className="team-wrap">
        <div className="team-hero">
          <h1 className="team-title">Naš Tim Organizatora</h1>
        </div>

        <div className="team-card">
          {loading && <div className="team-state">Učitavanje organizatora…</div>}

          {!loading && error && (
            <div className="team-state error">⚠ {error}</div>
          )}

          {!loading && !organizatori.length && !error && (
            <div className="team-state">Trenutno nema organizatora.</div>
          )}

          {!loading && organizatori.length > 0 && (
            <ul className="team-list">
              {organizatori.map((o) => (
                <li
                  key={o.id ?? o.idKorisnik}
                  className="team-item team-itemClickable"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/tim/${o.id ?? o.idKorisnik}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/tim/${o.id ?? o.idKorisnik}`);
                    }
                  }}
                >
                  <div className="team-avatarWrap">
                    <img
                      src={resolvePhotoUrl(o) || ""}
                      alt={getDisplayName(o)}
                      className="team-avatar"
                    />
                  </div>

                  <div className="team-info">
                    <div className="team-name">{getDisplayName(o)}</div>
                    <div className="team-sub">{o.email || "—"}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
