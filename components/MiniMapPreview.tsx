"use client";

import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import dynamic from "next/dynamic";

const FlyToMap = dynamic(() => import("./FlyToMap"), { ssr: false });

interface Props {
    location: string;
}

const markerIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

export default function MiniMapPreview({ location }: Props) {
    const [lat, lng] = location.split(",").map(Number) as [number, number];

    return (
        <div className="relative z-0 h-[160px] w-full overflow-hidden rounded border">
            <MapContainer
                key={`${lat},${lng}`}
                center={[lat, lng]}
                zoom={16}
                scrollWheelZoom={false}
                dragging={false}
                doubleClickZoom={false}
                touchZoom={false}
                zoomControl={false}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[lat, lng]} icon={markerIcon} />
                <FlyToMap center={[lat, lng]} />
            </MapContainer>
        </div>
    );
}
