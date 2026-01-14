import { useMemo, useState } from "react";
import useAuth from "../hooks/useAuth";
import "../styles/shopProductAdd.css";

export default function ShopProductAdd({ open, onClose, onCreated }) {
  const { user } = useAuth();
  const [opisProizvod, setOpisProizvod] = useState("");
  const [cijenaProizvod, setCijenaProizvod] = useState("");
  const [kategorijaProizvod, setKategorijaProizvod] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const previewUrl = useMemo(() => {
    if (!imageFile) return "";
    return URL.createObjectURL(imageFile);
  }, [imageFile]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      // multipart/form-data (za file upload)
      const fd = new FormData();
      if (!user?.id) throw new Error("Niste prijavljeni kao organizator.");
      fd.append("userId", String(user.id));
      fd.append("opisProizvod", opisProizvod);
      fd.append("cijenaProizvod", String(Number(cijenaProizvod)));
      fd.append("kategorijaProizvod", kategorijaProizvod);
      if (imageFile) fd.append("image", imageFile); // "image" uskladi s backendom

      const res = await fetch("/api/products", {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `HTTP ${res.status}`);
      }

      // reset
      setOpisProizvod("");
      setCijenaProizvod("");
      setKategorijaProizvod("");
      setImageFile(null);

      onClose?.();
      onCreated?.(); // refresha iz baze
    } catch (e2) {
      setError(e2?.message || "Greška kod spremanja");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <h2>Dodaj proizvod</h2>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Zatvori">
            ✕
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Opis proizvoda</label>
            <textarea
              placeholder="Npr. ručno rađena keramička vaza..."
              value={opisProizvod}
              onChange={(e) => setOpisProizvod(e.target.value)}
              required
            />
          </div>

          <div className="row-2">
            <div className="field">
              <label>Cijena (€)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Npr. 29.99"
                value={cijenaProizvod}
                onChange={(e) => setCijenaProizvod(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Kategorija</label>
              <input
                placeholder="Npr. Vaze"
                value={kategorijaProizvod}
                onChange={(e) => setKategorijaProizvod(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="upload">
            <div className="upload-top">
              <p className="upload-hint">Slika proizvoda (JPG/PNG)</p>
            </div>

            <input
              className="file-input"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />

            {imageFile && (
              <div className="preview">
                <img src={previewUrl} alt="Preview" />
                <div className="preview-meta">
                  <div className="preview-name">{imageFile.name}</div>
                  <div className="preview-size">
                    {(imageFile.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && <p className="error">{error}</p>}

          <div className="modal-actions">
            <button className="btn" type="button" onClick={onClose} disabled={saving}>
              Odustani
            </button>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Spremanje..." : "Spremi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
