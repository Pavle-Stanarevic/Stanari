import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/timOrganizatora.css";

const API = import.meta.env.VITE_API_URL;

// Placeholder dok backend endpoint nije spreman
const PLACEHOLDER = [
  {
    id: "1",
    firstName: "Tim",
    lastName: "Cheese",
    studyName: "Clay Studio Cheese",
    email: "cheese@clayplay.com",
    photoUrl:
      "https://api.dicebear.com/7.x/thumbs/svg?seed=Cheese&backgroundColor=b6e3f4",
  },
  {
    id: "2",
    firstName: "Tech",
    lastName: "Support",
    studyName: "Support Studio",
    email: "support@clayplay.com",
    photoUrl:
      "https://api.dicebear.com/7.x/thumbs/svg?seed=TechSupport&backgroundColor=b6e3f4",
  },
  {
    id: "3",
    firstName: "John",
    lastName: "Pork",
    studyName: null,
    email: "john.pork@clayplay.com",
    photoUrl:
      "https://api.dicebear.com/7.x/thumbs/svg?seed=JohnPork&backgroundColor=b6e3f4",
  },
  {
    id: "4",
    firstName: "Mladi",
    lastName: "Adam",
    studyName: "Adam Studio",
    email: "adam@clayplay.com",
    photoUrl:
      "https://api.dicebear.com/7.x/thumbs/svg?seed=Adam&backgroundColor=b6e3f4",
  },
];

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
        const res = await fetch(`${API}/api/organizatori`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Backend endpoint nije dostupan.");

        const data = await res.json();
        if (!alive) return;

        setOrganizatori(Array.isArray(data) && data.length ? data : []);
      } catch (e) {
        if (!alive) return;
        setError(e.message);
        setOrganizatori(PLACEHOLDER); // fallback za UI
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
                      src={resolvePhotoUrl(o) || PLACEHOLDER[0].photoUrl}
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
