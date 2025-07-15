"use client";

import { useRef, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, RefreshCcw,  Search } from "lucide-react";

// default icon fix for leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png"
});

interface MapPickerProps {
    location?: { lat: number; lng: number };
    drawer?: boolean;
    onChange?: (pos: { lat: number; lng: number }) => void;
}

export default function MapPicker({ location, drawer = false , onChange }: MapPickerProps) {
    const [position, setPosition] = useState<{ lat: number; lng: number } | null>(location || null);
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(location || { lat: 13.861954, lng: 100.5131757 }); 
    const mapRef = useRef<any>(null);

    // Update center if location prop changes
    useEffect(() => {
        if (location) setMapCenter(location);
        if (location) setPosition(location);
    }, [location]);

    // Move map center
    function FlyTo({ center }: { center: { lat: number; lng: number } }) {
        const map = useMap();
        useEffect(() => {
            if (center) map.flyTo([center.lat, center.lng], map.getZoom());
        }, [center, map]);
        return null;
    }

    // Current Location
    const handleUseCurrent = async () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const { latitude, longitude } = pos.coords;
                setMapCenter({ lat: latitude, lng: longitude });
                setPosition({ lat: latitude, lng: longitude });
                onChange?.({ lat: latitude, lng: longitude });
            });
        }
    };

    // Reset position
    const handleReset = () => {
        setPosition(null);
        setMapCenter({ lat: 13.861954, lng: 100.5131757 });
        setSearch("");
        setSearchResults([]);
        onChange?.(null as any);
    };

    // Map click to pick position
    function LocationMarker() {
        const map = useMap();
        useEffect(() => {
            const onClick = (e: any) => {
                setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
                onChange?.({ lat: e.latlng.lat, lng: e.latlng.lng });
            };
            map.on("click", onClick);
            return () => {
                map.off("click", onClick);
            };
        }, [map]);
        return position ? <Marker position={[position.lat, position.lng]} /> : null;
    }

    // Search location (Nominatim)
    useEffect(() => {
        let active = true;
        if (!search) {
            setSearchResults([]);
            setSearchLoading(false);
            return;
        }

        setSearchLoading(true);
        const handler = setTimeout(async () => {
            try {
                const q = encodeURIComponent(search.trim());
                const url = `/api/search-location?q=${q}`;
                const res = await fetch(url, {
                    headers: { "User-Agent": "nonthaburi-complaint-system" }
                });
                const data = await res.json();
                if (active) {
                    setSearchResults(data);
                    setSearchLoading(false);
                }
            } catch (err) {
                if (active) {
                    setSearchResults([]);
                    setSearchLoading(false);
                }
            }
        }, 400);

        return () => {
            active = false;
            clearTimeout(handler);
        };
    }, [search]);

    // Handle search select
    const handleSelectSearch = (item: any) => {
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        setMapCenter({ lat, lng });
        setPosition({ lat, lng });
        setSearch(item.display_name);
        setSearchResults([]);
        setSearchLoading(false);
        onChange?.({ lat, lng });
    };

    return (
        <div className="relative w-full h-[320px] md:h-[400px] rounded-xl border overflow-hidden">
            {/* Search Input */}
            <div className={`absolute top-3 left-1/2 -translate-x-1/2 z-50 w-[70%] ${drawer === false ? "lg:w-[400px]" : ""}`}>
                <div className="relative">
                    <Input
                        className="pl-10 pr-2 py-2 rounded-xl shadow bg-white/90 border dark:bg-neutral-900/80 dark:text-white dark:placeholder:text-neutral-400 dark:border-neutral-700 backdrop-blur-sm"
                        placeholder="ค้นหาสถานที่… เช่น วัด เทศบาล ถนน"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                </div>
                {/* Search dropdown */}
                {searchResults.length > 0 && (
                    <div className="absolute top-12 left-0 right-0 bg-white shadow rounded-xl z-50 max-h-60 overflow-auto dark:bg-neutral-900/90 dark:text-white dark:border-neutral-700">
                        {searchResults.map(item => (
                            <div
                                key={item.place_id}
                                className="px-4 py-2 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 text-sm"
                                onClick={() => handleSelectSearch(item)}
                            >
                                {item.display_name}
                            </div>
                        ))}
                    </div>
                )}
                {/* Loading */}
                {searchLoading && searchResults.length === 0 && (
                    <div className="absolute top-12 left-0 right-0 bg-white shadow rounded-xl z-50 p-3 text-center text-xs text-muted-foreground dark:bg-neutral-900/90 dark:text-white">
                        กำลังค้นหา…
                    </div>
                )}
            </div>

            {/* Map */}
            <div className="w-full h-[320px] md:h-[400px] rounded-xl overflow-hidden">
                <MapContainer
                    center={[mapCenter.lat, mapCenter.lng]}
                    zoom={15}
                    scrollWheelZoom
                    className="w-full h-full z-10"
                    ref={mapRef}
                >
                    <TileLayer
                        attribution="&copy; OpenStreetMap contributors"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <FlyTo center={mapCenter} />
                    <LocationMarker />
                </MapContainer>
            </div>

            {/* Action Buttons */}
            <TooltipProvider>
                <div className="absolute bottom-5 right-3 flex flex-col gap-2 z-50">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                variant="secondary"
                                onClick={handleUseCurrent}
                                className="shadow bg-white/80 hover:bg-neutral-100 dark:bg-neutral-800/80 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-primary dark:text-white"
                                aria-label="ใช้ตำแหน่งปัจจุบัน"
                            >
                                <LocateFixed className="w-5 h-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>ใช้ตำแหน่งฉัน</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                variant="secondary"
                                onClick={handleReset}
                                className="shadow bg-white/80 hover:bg-neutral-100 dark:bg-neutral-800/80 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-primary dark:text-white"
                                aria-label="รีเซตตำแหน่ง"
                            >
                                <RefreshCcw className="w-5 h-5"/>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>รีเซต</TooltipContent>
                    </Tooltip>
                </div>
            </TooltipProvider>
        </div>
    );
}
