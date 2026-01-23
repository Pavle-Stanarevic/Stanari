import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getOrganizator,
  getOrganizatorIzlozbe,
  getOrganizatorProizvodi,
  getOrganizatorRadionice,
} from "../api/organisers.js";
import "../styles/profilOrganizator.css";

const API = import.meta.env.VITE_API_URL;


function resolvePhotoUrl(o) {
  const raw = o?.photoUrl || o?.fotoUrl || o?.avatarUrl || "";
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("/")) return `${API}${raw}`;
  return `${API}/${raw}`;
}

function getDisplayName(o) {
  if (`${o?.firstName || ""} ${o?.lastName || ""}`.trim()) return `${o?.firstName || ""} ${o?.lastName || ""}`.trim();
  if (o?.studyName) return o.studyName || "Organizator";
  return "Organizator";
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

function formatPrice(price) {
  if (price === "" || price == null) return "—";
  const n = Number(price);
  if (Number.isNaN(n)) return String(price);
  return `${n.toFixed(2)}€`;
}

const TABS = [
  { key: "pastWorkshops", label: "Prošle radionice" },
  { key: "upcomingWorkshops", label: "Nadolazeće radionice" },
  { key: "pastExhibitions", label: "Prošle izložbe" },
  { key: "upcomingExhibitions", label: "Buduće izložbe" },
  { key: "products", label: "Svi proizvodi" },
];

export default function ProfilOrganizator() {
  const navigate = useNavigate();
  const { organizatorId } = useParams();

  const [org, setOrg] = useState(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [orgError, setOrgError] = useState("");

  const [activeTab, setActiveTab] = useState("upcomingWorkshops");
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [listItems, setListItems] = useState([]);

  // load organizer
  useEffect(() => {
    let alive = true;
    setOrgLoading(true);
    setOrgError("");

    getOrganizator(organizatorId)
      .then((data) => {
        if (!alive) return;
        setOrg(data || null);
      })
      .catch((e) => {
        if (!alive) return;
        setOrgError(e.message || "Greška pri dohvaćanju organizatora");
        setOrg(null);
      })
      .finally(() => alive && setOrgLoading(false));

    return () => {
      alive = false;
    };
  }, [organizatorId]);


  useEffect(() => {
    let alive = true;
    setListLoading(true);
    setListError("");

    const load = async () => {
      try {
        let data;
        if (activeTab === "pastWorkshops") {
          data = await getOrganizatorRadionice(organizatorId, "past");
        } else if (activeTab === "upcomingWorkshops") {
          data = await getOrganizatorRadionice(organizatorId, "upcoming");
        } else if (activeTab === "pastExhibitions") {
          data = await getOrganizatorIzlozbe(organizatorId, "past");
        } else if (activeTab === "upcomingExhibitions") {
          data = await getOrganizatorIzlozbe(organizatorId, "upcoming");
        } else if (activeTab === "products") {
          data = await getOrganizatorProizvodi(organizatorId);
        }

        if (!alive) return;

        const arr = Array.isArray(data) ? data : [];
        const orgIdNum = organizatorId != null ? Number(organizatorId) : null;
        const filtered =
          activeTab === "products" && orgIdNum != null
            ? arr.filter((p) => Number(p?.idKorisnik ?? p?.organizatorId ?? p?.sellerId) === orgIdNum)
            : arr;

        setListItems(filtered);
      } catch (e) {
        if (!alive) return;
        setListError(e.message || "Greška pri dohvaćanju popisa");
        setListItems([]);
      } finally {
        if (!alive) return;
        setListLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [organizatorId, activeTab]);

  const displayName = useMemo(() => getDisplayName(org), [org]);
  const avatar = useMemo(() => resolvePhotoUrl(org), [org]);

  return (
    <div className="org-page">
      <div className="org-wrap">
        <div className="org-top">
          <button className="org-back" onClick={() => navigate(-1)}>
            ← Natrag
          </button>
        </div>

        <h1 className="org-title">{displayName}</h1>

        <section className="org-card">
          <div className="org-hero">
            <div className="org-avatarWrap">
              <img className="org-avatar" src={avatar} alt={displayName} />
            </div>

            <div className="org-info">
              <div className="org-infoTitle">General Info</div>

              {orgLoading && <div className="org-state">Učitavanje profila…</div>}
              {!orgLoading && orgError && (
                <div className="org-state error">⚠ {orgError}</div>
              )}

              {!orgLoading && (
                <ul className="org-infoList">
                  <li>
                    <span className="org-label">Adresa:</span>
                    <span className="org-value">{org?.address || "—"}</span>
                  </li>
                  <li>
                    <span className="org-label">Kontakt:</span>
                    <span className="org-value">{org?.contact || org?.phone || "—"}</span>
                  </li>
                  <li>
                    <span className="org-label">e-mail:</span>
                    <span className="org-value">{org?.email || "—"}</span>
                  </li>
                </ul>
              )}
            </div>
          </div>


          <div className="org-tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`org-tab ${activeTab === t.key ? "active" : ""}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="org-listArea">
            {listLoading && <div className="org-state">Učitavanje…</div>}
            {!listLoading && listError && (
              <div className="org-state error">⚠ {listError}</div>
            )}

            {!listLoading && !listItems.length && !listError && (
              <div className="org-empty">Nema stavki u ovoj kategoriji.</div>
            )}

            {!listLoading && listItems.length > 0 && (
              <ul className="org-list">
                {activeTab !== "products"
                  ? listItems.map((it) => {
                      const id = it?.id ?? it?.workshopId ?? it?.izlozbaId;
                      const title =
                        it?.title || it?.name || it?.naziv || "Bez naziva";
                      const when =
                        it?.startDateTime ||
                        it?.dateISO ||
                        it?.date ||
                        it?.start ||
                        it?.datum;
                      const location = it?.location || it?.lokacija || it?.address;

                      return (
                        <li key={id || `${title}-${when}`} className="org-listItem">
                          <div className="org-liTitle">{title}</div>
                          <div className="org-liMeta">
                            <span>{formatDateTime(when)}</span>
                            {location ? <span className="org-dot">•</span> : null}
                            {location ? <span>{location}</span> : null}
                          </div>
                        </li>
                      );
                    })
                  : listItems.map((p) => {
                      const id = p?.id ?? p?.productId ?? p?.proizvodId;
                      const name =
                        p?.name || p?.title || p?.naziv || "Proizvod";
                      const price = p?.price ?? p?.cijena;
                      const desc = p?.description || p?.opis;

                      return (
                        <li key={id || name} className="org-listItem product">
                          <div className="org-liRow">
                            <div className="org-liTitle">{name}</div>
                            <div className="org-liPrice">{formatPrice(price)}</div>
                          </div>
                          {desc ? <div className="org-liDesc">{desc}</div> : null}
                        </li>
                      );
                    })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
