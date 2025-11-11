import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

export default function MapOSM({ lat, lng, label }) {
  return (
    <div style={{ width: '100%', height: 400, borderRadius: 12, overflow: 'hidden' }}>
      <MapContainer center={[lat, lng]} zoom={15} style={{ width: '100%', height: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <Marker position={[lat, lng]}>
          <Popup>{label}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
