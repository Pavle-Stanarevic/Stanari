// frontend/src/pages/detaljiIzlozbe.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import "../styles/detaljiIzlozbe.css";
import {
  listExhibitions,
  applyToExhibition,
  getReservedExhibitionIds,
  getExhibitionApplications,
  listExhibitionComments,
  createExhibitionComment,
  // NEW (organizer)
  listExhibitionApplicationsByExhibition,
  decideExhibitionApplication,
} from "../api/exhibitions";

const API = import.meta.env.VITE_API_URL || "";

/* ---------- calendar helpers ---------- */
function toGoogleCalDateUtc(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
}

function buildGoogleCalendarUrl({ title, details, location, start, end }) {
  if (!start || !end) return null;
  const dates = `${toGoogleCalDateUtc(start)}/${toGoogleCalDateUtc(end)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title || "Izložba",
    details: details || "",
    location: location || "",
    dates,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/* ---------- existing helpers ---------- */
function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const time = d.toTimeString().slice(0, 5);
  return `${day}.${month}.${year}. - ${time}h`;
}

function getISO(x) {
  return x?.startDateTime ?? x?.dateTime ?? x?.date ?? x?.start ?? null;
}

function getImages(x) {
  const raw =
    x?.images ??
    x?.imageUrls ??
    x?.photos ??
    x?.slike ??
    x?.gallery ??
    x?.artworks ??
    [];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => (typeof v === "string" ? v : v?.url ?? v?.imageUrl ?? v?.path ?? null))
    .map((v) => {
      if (!v) return null;
      if (v.startsWith("http://") || v.startsWith("https://")) return v;
      if (v.startsWith("/")) return `${API}${v}`;
      return v;
    })
    .filter(Boolean);
}

function getDescription(x) {
  const v = x?.description ?? x?.opis ?? x?.opisIzlozbe ?? "";
  return typeof v === "string" ? v.trim() : "";
}

/* end time calc (if no duration, default 2h) */
function calcEndDate(exh) {
  const startIso = getISO(exh);
  if (!startIso) return null;
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return null;

  const durMin =
    Number(exh?.durationMinutes ?? exh?.duration ?? exh?.trajanjeMinuta ?? 0) || 0;

  const minutes = durMin > 0 ? durMin : 120;
  return new Date(start.getTime() + minutes * 60 * 1000);
}

function formatTimeOnly(d) {
  if (!d) return "—";
  return `${d.toTimeString().slice(0, 5)}h`;
}

/* organizer helpers */
function normStatus(s) {
  if (!s) return "pending";
  const v = String(s).toLowerCase();
  if (v.includes("accept")) return "accepted";
  if (v.includes("reject")) return "rejected";
  if (v.includes("pend")) return "pending";
  return v;
}

function appDisplayName(a) {
  const fn = a?.firstName ?? a?.ime ?? "";
  const ln = a?.lastName ?? a?.prezime ?? "";
  const name = `${fn} ${ln}`.trim();
  return name || a?.name || a?.email || "—";
}

export default function DetaljiIzlozbe() {
  const { id } = useParams();
  const exhId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const userId = user?.id ?? user?.idKorisnik ?? user?.userId ?? null;
  const isPolaznik = user?.userType === "polaznik";

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [exh, setExh] = useState(null);

  const [reserved, setReserved] = useState(false);
  const [appStatus, setAppStatus] = useState("");
  const [applying, setApplying] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentPosting, setCommentPosting] = useState(false);
  const [commentError, setCommentError] = useState("");

  /* NEW: organizer applications */
  const [appsOpen, setAppsOpen] = useState(false);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState("");
  const [applications, setApplications] = useState([]);
  const [decisionBusy, setDecisionBusy] = useState({}); // { [applicationId]: true }

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const data = await listExhibitions();
        const arr = Array.isArray(data) ? data : [];
        const found =
          arr.find((x) => Number(x?.id ?? x?.idIzlozba ?? x?.exhibitionId) === exhId) || null;
        if (!alive) return;
        setExh(found);
        if (!found) setErr("Izložba nije pronađena.");
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "Greška pri dohvaćanju izložbe.");
      } finally {
        alive && setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [exhId]);

  const isPast = useMemo(() => {
    const iso = getISO(exh);
    if (!iso) return false;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return false;
    return d < new Date();
  }, [exh]);

  const isOrganizer = useMemo(() => {
    const ownerId = exh?.organizerId ?? exh?.organizatorId ?? exh?.idKorisnik ?? null;
    return userId != null && ownerId != null && Number(userId) === Number(ownerId);
  }, [userId, exh]);

  /* participant reserved/app status */
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isPolaznik || !userId) return;
      try {
        const ids = await getReservedExhibitionIds(userId);
        if (!alive) return;
        setReserved(Array.isArray(ids) ? ids.map(Number).includes(Number(exhId)) : false);

        const apps = await getExhibitionApplications(userId);
        if (!alive) return;
        const found = Array.isArray(apps)
          ? apps.find((a) => Number(a?.exhibitionId) === Number(exhId))
          : null;
        setAppStatus(found?.status || "");
      } catch {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, [isPolaznik, userId, exhId]);

  /* comments */
  useEffect(() => {
    let alive = true;
    if (!exhId) return () => { alive = false; };

    (async () => {
      setCommentsLoading(true);
      setCommentsError("");
      try {
        const data = await listExhibitionComments(exhId);
        if (!alive) return;
        setComments(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!alive) return;
        setComments([]);
        setCommentsError(e?.message || "Komentari trenutno nisu dostupni.");
      } finally {
        alive && setCommentsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [exhId]);

  const canComment = Boolean(isPast && normStatus(appStatus) === "accepted" && userId);

  const onSubmitComment = async (e) => {
    e.preventDefault();
    if (!canComment) {
      return;
    }

    const text = String(commentText || "").trim();
    if (!text) {
      setCommentError("Unesite komentar.");
      return;
    }

    setCommentPosting(true);
    setCommentError("");
    try {
      const created = await createExhibitionComment(exhId, userId, text);
      setComments((prev) => [created, ...prev]);
      setCommentText("");
    } catch (e2) {
      setCommentError(e2?.message || "Ne mogu spremiti komentar.");
    } finally {
      setCommentPosting(false);
    }
  };

  const onApply = async () => {
    try {
      if (!userId) throw new Error("Prijavi se za prijavu na izložbu.");
      if (isOrganizer) return;
      if (!isPolaznik) throw new Error("Samo polaznici se mogu prijaviti na izložbu.");
      if (isPast) throw new Error("Ne možeš se prijaviti na prošlu izložbu.");
      if (!exh) return;

      if (String(exh.id).startsWith("900")) {
        throw new Error("Ovo je demo izložba (placeholder) — prijava nije dostupna.");
      }

      setApplying(true);
      await applyToExhibition(exh.id, userId);

      setReserved(true);
      setAppStatus("pending");
    } catch (e) {
      alert(e.message || "Neuspješna prijava.");
    } finally {
      setApplying(false);
    }
  };

  const imgs = getImages(exh);
  const cover = imgs[0] || null;
  const rest = imgs.slice(1);
  const description = getDescription(exh);

  const calendarUrl = useMemo(() => {
    if (!exh) return null;
    const startIso = getISO(exh);
    if (!startIso) return null;

    const start = new Date(startIso);
    if (Number.isNaN(start.getTime())) return null;

    const end = calcEndDate(exh) || start;

    const title = exh.title || "Izložba";
    const location = exh.location || "";

    const details =
      `Izložba: ${title}\n` +
      `Vrijeme: ${formatDateTime(startIso)}${end ? ` - ${formatTimeOnly(end)}` : ""}\n` +
      (location ? `Lokacija: ${location}\n` : "") +
      (description ? `\n${description}` : "");

    return buildGoogleCalendarUrl({ title, details, location, start, end });
  }, [exh, description]);

  const showCalendarBtn = isPolaznik && !isPast && (reserved || appStatus === "pending") && !!calendarUrl;

  /* -------- organizer: load applications -------- */
  const loadApplications = async () => {
    if (!isOrganizer || !userId) return;
    setAppsLoading(true);
    setAppsError("");
    try {
      const data = await listExhibitionApplicationsByExhibition(exhId, userId);
      setApplications(Array.isArray(data) ? data : []);
    } catch (e) {
      setApplications([]);
      setAppsError(e?.message || "Ne mogu dohvatiti prijave.");
    } finally {
      setAppsLoading(false);
    }
  };

  const toggleApplications = async () => {
    const next = !appsOpen;
    setAppsOpen(next);
    if (next) await loadApplications();
  };

  const decide = async (applicationId, decision) => {
    if (!isOrganizer || !userId) return;
    setDecisionBusy((s) => ({ ...s, [applicationId]: true }));
    setAppsError("");
    try {
      await decideExhibitionApplication(exhId, applicationId, userId, decision); // "ACCEPT" | "REJECT"
      // update list locally after backend confirms
      setApplications((prev) =>
        (prev || []).map((a) => {
          const idA = a?.applicationId ?? a?.id ?? a?._id;
          if (String(idA) !== String(applicationId)) return a;
          return { ...a, status: decision === "ACCEPT" ? "accepted" : "rejected" };
        })
      );
    } catch (e) {
      setAppsError(e?.message || "Ne mogu spremiti odluku.");
    } finally {
      setDecisionBusy((s) => {
        const copy = { ...s };
        delete copy[applicationId];
        return copy;
      });
    }
  };

  return (
    <div className="ed-page">
      <div className="ed-topbar">
        <button className="ed-back" onClick={() => navigate(-1)}>
          ← Natrag
        </button>

        <div style={{ display: "inline-flex", gap: 10, alignItems: "center" }}>
          {isOrganizer && !loading && exh ? (
            <button className="ed-back" onClick={toggleApplications}>
              {appsOpen ? "Sakrij prijave" : "Prijave"}
            </button>
          ) : null}

          {exh && (
            <span className={`ed-badge ${isPast ? "past" : "upcoming"}`}>
              {isPast ? "Prošla" : "Nadolazeća"}
            </span>
          )}
        </div>
      </div>

      <main className="ed-wrap">
        {loading && <div className="ed-info">Učitavanje…</div>}
        {!!err && !loading && <div className="ed-error">{err}</div>}

        {!loading && exh && (
          <>
            <header className="ed-header">
              <div className="ed-titleRow">
                <h1 className="ed-title">{exh.title || "Bez naziva"}</h1>

                {isPolaznik && (
                  <div className="ed-actions">
                    <button
                      className={`ed-primary ${appStatus === "pending" ? "is-pending" : ""}`}
                      disabled={reserved || isPast || applying || isOrganizer || normStatus(appStatus) === "rejected"}
                      onClick={onApply}
                      title={isPast ? "Izložba je prošla." : ""}
                    >
                      {(() => {
                        if (isOrganizer) return "Vaša izložba";
                        if (isPast) return "Izložba završena";
                        if (normStatus(appStatus) === "rejected") return "Odbijeni ste";
                        if (normStatus(appStatus) === "accepted") return "Prijavljen";
                        if (appStatus === "pending") return "Prijava se obrađuje";
                        if (reserved) return "Prijavljen";
                        if (applying) return "Prijavljujem...";
                        return "Prijava";
                      })()}
                    </button>

                    {showCalendarBtn ? (
                      <a
                        className="ed-calendarBtn"
                        href={calendarUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Otvori Google Kalendar i dodaj događaj"
                      >
                        + Dodaj u kalendar
                      </a>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="ed-meta">
                <span>
                  <strong>Datum:</strong> {formatDateTime(getISO(exh))}
                </span>
                <span className="dot">•</span>
                <span>
                  <strong>Lokacija:</strong> {exh.location || "—"}
                </span>
              </div>

              {description ? (
                <section className="ed-desc">
                  <h2 className="ed-descTitle">Opis izložbe</h2>
                  <p className="ed-descText">{description}</p>
                </section>
              ) : (
                <div className="ed-descEmpty">Opis nije dostupan.</div>
              )}
            </header>

            {/* ORGANIZER: applications list */}
            {isOrganizer && appsOpen && (
              <section className="ed-comments" style={{ borderTop: "none", marginTop: 14, paddingTop: 0 }}>
                <h2 className="ed-comments-title">Prijavljeni polaznici</h2>

                <div className="ed-comments-info" style={{ marginBottom: 10 }}>
                  Ovdje prihvaćaš (✓) ili odbijaš (✕) prijave.
                </div>

                {appsError ? <div className="ed-comments-error">{appsError}</div> : null}

                {appsLoading ? (
                  <div className="ed-comments-info">Učitavanje prijava…</div>
                ) : applications.length === 0 ? (
                  <div className="ed-comments-empty">Trenutno nema prijava.</div>
                ) : (
                  <ul className="ed-comments-list" style={{ maxHeight: 320 }}>
                    {applications.map((a, i) => {
                      const applicationId = a?.applicationId ?? a?.id ?? a?._id ?? `app-${i}`;
                      const st = normStatus(a?.status);
                      const busy = !!decisionBusy[applicationId];

                      return (
                        <li
                          key={String(applicationId)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 10,
                          }}
                        >
                          <div style={{ display: "grid", gap: 2 }}>
                            <div style={{ fontWeight: 800, color: "#111827" }}>
                              {appDisplayName(a)}
                            </div>
                            <div style={{ fontSize: 13 }}>
                              {a?.email ? a.email : null}{" "}
                              <span style={{ marginLeft: 8, fontWeight: 800 }}>
                                {st === "pending"
                                  ? "(na čekanju)"
                                  : st === "accepted"
                                  ? "(prihvaćen)"
                                  : st === "rejected"
                                  ? "(odbijen)"
                                  : `(${st})`}
                              </span>
                            </div>
                          </div>

                          {st === "pending" ? (
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                className="ed-primary"
                                onClick={() => decide(applicationId, "ACCEPT")}
                                disabled={busy}
                                title="Prihvati"
                                style={{ padding: "8px 12px" }}
                              >
                                ✓
                              </button>
                              <button
                                className="ed-back"
                                onClick={() => decide(applicationId, "REJECT")}
                                disabled={busy}
                                title="Odbij"
                                style={{ padding: "8px 12px" }}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="ed-comments-info" style={{ whiteSpace: "nowrap" }}>
                              Odluka donesena
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                <div style={{ marginTop: 10 }}>
                  <button className="ed-back" onClick={loadApplications} disabled={appsLoading}>
                    {appsLoading ? "Osvježavam…" : "Osvježi listu"}
                  </button>
                </div>
              </section>
            )}

            <section className="ed-gallery">
              <h2>Radovi na izložbi</h2>

              {!cover && imgs.length === 0 ? (
                <div className="ed-empty">Nema slika.</div>
              ) : (
                <>
                  {cover && (
                    <div className="ed-cover">
                      <img src={cover} alt={exh.title || "Izložba"} />
                    </div>
                  )}

                  {rest.length > 0 && (
                    <div className="ed-grid">
                      {rest.map((src, i) => (
                        <div className="ed-thumb" key={`${src}-${i}`}>
                          <img src={src} alt={`Rad ${i + 1}`} loading="lazy" />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>

            <section className="ed-comments">
              <h2 className="ed-comments-title">Komentari</h2>

              {canComment && (
                <form className="ed-commentForm" onSubmit={onSubmitComment}>
                  <textarea
                    className="ed-commentInput"
                    rows={3}
                    placeholder="Napišite komentar..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  {commentError ? <div className="ed-comments-error">{commentError}</div> : null}
                  <button className="ed-commentBtn" type="submit" disabled={commentPosting}>
                    {commentPosting ? "Spremam..." : "Objavi komentar"}
                  </button>
                </form>
              )}

              {/* Removed info message for non-eligible commenters */}

              {commentsLoading && <div className="ed-comments-info">Učitavanje komentara…</div>}
              {!commentsLoading && commentsError && (
                <div className="ed-comments-error">{commentsError}</div>
              )}

              {!commentsLoading && !commentsError && comments.length === 0 && (
                <div className="ed-comments-empty">Još nema komentara.</div>
              )}

              {!commentsLoading && !commentsError && comments.length > 0 && (
                <ul className="ed-comments-list">
                  {comments.map((c, i) => (
                    <li key={c?.id ?? `c-${i}`}>{c?.text || ""}</li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
