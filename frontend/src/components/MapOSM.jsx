import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/mapOSM.css";

/* === Fix: default marker ikone (često ne rade u bundlerima) === */
const defaultIcon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

/* === Recenter helper: kad promijeniš lat/lng, karta se centrira === */
function Recenter({ lat, lng, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.setView([lat, lng], zoom, { animate: true });
  }, [lat, lng, zoom, map]);
  return null;
}

/**
 * Props:
 * - lat, lng (brojevi) — obavezno
 * - label (string) — tekst u popupu
 * - zoom (broj) — default 14
 * - ratio (bool) — ako je true, koristi aspect-ratio umjesto fiksne visine
 * - className (string) — dodatne klase po želji
 */
export default function MapOSM({
  lat,
  lng,
  label = "",
  zoom = 14,
  ratio = false,
  className = "",
}) {
  const center = useMemo(() => [lat, lng], [lat, lng]);

  return (
    <div className={`map-osm ${ratio ? "map-osm--ratio" : ""} ${className}`}>
      <div className="map-shell">


        <MapContainer
          center={center}
          zoom={zoom}
          className="map-osm__container"
          scrollWheelZoom={true}
          preferCanvas={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <Marker position={center}>
            <Popup>Unska 3, Zagreb</Popup>
          </Marker>

          <Recenter lat={lat} lng={lng} zoom={zoom} />
        </MapContainer>
      </div>
    </div>
  );
}
