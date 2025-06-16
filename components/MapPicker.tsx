"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin, Crosshair, RotateCcw, Check } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

const DEFAULT_POSITION: [number, number] = [13.7563, 100.5018];

const markerIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

function MapAutoCenter({ position }: { position: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(position, 16);
    }, [position, map]);
    return null;
}

export default function MapPicker({
    location,
    onChange,
}: {
    location: string;
    onChange: (val: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [tempPosition, setTempPosition] = useState<[number, number]>(DEFAULT_POSITION);

    useEffect(() => {
        if (location) {
            const [latStr, lngStr] = location.split(",");
            const lat = parseFloat(latStr);
            const lng = parseFloat(lngStr);
            if (!isNaN(lat) && !isNaN(lng)) {
                setTempPosition([lat, lng]);
            }
        }
    }, [location]);

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition((pos) => {
            const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
            setTempPosition(coords);
        });
    };

    const handleReset = () => {
        setTempPosition(DEFAULT_POSITION);
    };

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="cursor-pointer">
                                <MapPin className="w-4 h-4 mr-1" />
                                ปักหมุด
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="max-w-4xl w-full overflow-hidden p-0 z-50">
                            <DialogHeader className="p-4">
                                <DialogTitle>เลือกตำแหน่ง</DialogTitle>
                                <DialogDescription>
                                    ลากหมุดเพื่อเลือกพิกัดที่ต้องการ แล้วกดบันทึก
                                </DialogDescription>
                            </DialogHeader>

                            <div className="h-[400px]">
                                <MapContainer
                                    center={tempPosition}
                                    zoom={16}
                                    style={{ height: "100%", width: "100%" }}
                                    scrollWheelZoom
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <MapAutoCenter position={tempPosition} />
                                    <Marker
                                        draggable
                                        position={tempPosition}
                                        eventHandlers={{
                                            dragend: (e) => {
                                                const pos = e.target.getLatLng();
                                                setTempPosition([pos.lat, pos.lng]);
                                            },
                                        }}
                                        icon={markerIcon}
                                    />
                                </MapContainer>
                            </div>
                            <DialogFooter className="p-4 flex flex-wrap gap-2 justify-between items-center border-t">
                                <div className="flex gap-2">
                                    <Button variant="secondary" onClick={handleUseCurrentLocation} className="cursor-pointer">
                                        <Crosshair className="w-4 h-4 mr-1" />
                                        ใช้ตำแหน่งปัจจุบัน
                                    </Button>
                                    <Button variant="secondary" onClick={handleReset} className="cursor-pointer">
                                        <RotateCcw className="w-4 h-4 mr-1" />
                                        รีเซตตำแหน่ง
                                    </Button>
                                </div>
                                <Button
                                    className="cursor-pointer"
                                    onClick={() => {
                                        onChange(`${tempPosition[0]},${tempPosition[1]}`);
                                        setOpen(false);
                                    }}
                                >
                                    <Check className="w-4 h-4 mr-1" />
                                    บันทึกตำแหน่งนี้
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </TooltipTrigger>
            <TooltipContent>เปิดแผนที่เพื่อเลือกตำแหน่ง</TooltipContent>
        </Tooltip>
    );
}
