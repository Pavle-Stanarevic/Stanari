import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { createWorkshop } from "../api/workshops"; // ⬅️ API poziv
import "../styles/organizacijaRadionica.css";

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function buildMonthMatrix(year, month) {
  const first = new Date(year, month, 1);
  const startDay = (first.getDay() + 6) % 7; // pon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = startDay;
  const totalCells = Math.ceil((prevMonthDays + daysInMonth) / 7) * 7;

  const cells = [];
  for (let i = 0; i < totalCells; i++) {
    const date = new Date(year, month, i - prevMonthDays + 1);
    cells.push(date);
  }
  return cells;
}

function formatDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function Calendar({ value, onChange }) {
  const [cursor, setCursor] = useState(() => (value ? new Date(value) : new Date()));
  const matrix = useMemo(() => buildMonthMatrix(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const monthLabel = cursor.toLocaleString(undefined, { month: "long", year: "numeric" });
  const todayKey = formatDateKey(new Date());
  const selectedKey = value ? formatDateKey(value) : null;

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button type="button" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
          <ChevronLeft size={18} />
        </button>
        <div className="month-label">{monthLabel}</div>
        <button type="button" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="calendar-days">
        {["P", "U", "S", "Č", "P", "S", "N"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="calendar-grid">
        {matrix.map((d) => {
          const inMonth = d.getMonth() === cursor.getMonth();
          const key = formatDateKey(d);
          const isToday = key === todayKey;
          const isSelected = key === selectedKey;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange?.(d)}
              className={classNames(
                "calendar-day",
                inMonth ? "in-month" : "out-month",
                isSelected ? "selected" : "",
                isToday && !isSelected ? "today" : ""
              )}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function OrganizacijaRadionica() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    title: "",
    capacity: "",
    price: "",
    description: "",
    duration: "60",      // minute
    startTime: "18:30",
    date: new Date(),
    location: "",        // ⬅️ POTREBNO za bazu
    images: [],
  });

  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const handleFiles = (e) => set("images", Array.from(e.target.files || []));

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setSubmitting(true);
    try {
      // spoji datum i vrijeme u ISO (TIMESTAMPTZ)
      const [h, m] = String(form.startTime || "00:00").split(":").map(Number);
      const when = new Date(form.date || new Date());
      when.setHours(h || 0, m || 0, 0, 0);

      // TODO: organizerId uzmi iz auth/sessiona; za test stavi 1
      const organizerId = 1;

      // minimalna validacija
      if (!form.title?.trim()) throw new Error("Unesi naziv radionice.");
      if (!form.location?.trim()) throw new Error("Unesi lokaciju radionice.");
      if (!form.capacity) throw new Error("Unesi broj slobodnih mjesta.");
      if (!form.price) throw new Error("Unesi cijenu.");

      await createWorkshop({
        title: form.title,
        description: form.description,
        durationMinutes: Number(form.duration),
        dateISO: when.toISOString(),
        location: form.location,
        capacity: Number(form.capacity),
        price: Number(form.price),
        organizerId,
      });

      // nakon uspjeha prebacujemo na listu
      navigate("/pregledRadionica");
    } catch (e) {
      setErr(e.message || "Greška prilikom spremanja radionice.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="organize-page">
      <main className="main-content">
        <h1>Organiziraj svoju radionicu</h1>

        {err ? <div className="error">{err}</div> : null}

        <section className="form-section">
          <h2>Osnovni podaci radionice</h2>

          <form onSubmit={onSubmit} className="form-grid">
            <div className="form-left">
              <label>Naziv radionice</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />

              <label>Lokacija</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="npr. Ulica 1, Zagreb"
              />

              <label>Broj slobodnih mjesta</label>
              <input
                type="number"
                min={0}
                value={form.capacity}
                onChange={(e) => set("capacity", e.target.value)}
              />

              <label>Cijena</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
              />

              <label>Kratak opis radionice</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />

              <label>Trajanje</label>
              <select value={form.duration} onChange={(e) => set("duration", e.target.value)}>
                <option value="30">30 min</option>
                <option value="60">1h</option>
                <option value="90">1h 30min</option>
                <option value="120">2h</option>
                <option value="150">2h 30min</option>
                <option value="180">3h</option>
              </select>

              <label>Vrijeme početka</label>
              <select value={form.startTime} onChange={(e) => set("startTime", e.target.value)}>
                {Array.from({ length: 48 }).map((_, i) => {
                  const h = String(Math.floor(i / 2)).padStart(2, "0");
                  const m = i % 2 === 0 ? "00" : "30";
                  const label = `${h}:${m}`;
                  return (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-middle">
              <label>Datum</label>
              <Calendar value={form.date} onChange={(d) => set("date", d)} />
            </div>

            <div className="form-right">
              <label>Dodajte fotografije</label>
              <label className="file-upload">
                <input type="file" accept="image/*" multiple onChange={handleFiles} />
                <Upload />
                <span>Povuci i ispusti ili klikni za odabir</span>
                {form.images?.length ? <span>{form.images.length} datoteka odabrano</span> : null}
              </label>
            </div>

            <div className="form-submit">
              <button type="submit" disabled={submitting}>
                {submitting ? "Spremam..." : "Potvrdi"}
              </button>
            </div>
          </form>
        </section>
      </main>

      <footer className="footer">© {new Date().getFullYear()} ClayPlay</footer>
    </div>
  );
}
