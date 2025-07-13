"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { MapContainer, TileLayer, Polygon, useMap } from "react-leaflet"
import { LatLngExpression, LatLngBounds } from "leaflet"
import "leaflet/dist/leaflet.css"
import { formatThaiDatetime } from "@/utils/date"
import { useEffect } from "react"

interface ZoneDetailDialogProps {
    open: boolean
    onOpenChange: (val: boolean) => void
    zone: {
        name: string
        lineGroupId?: string
        telegramGroupId?: string
        polygon: number[][]
        createdAt?: string
        updatedAt?: string
    } | null
}

// Component ย่อย: จัด center map ตาม polygon
function FitPolygon({ polygon }: { polygon: number[][] }) {
    const map = useMap()
    useEffect(() => {
        if (polygon.length > 2) {
            const bounds = new LatLngBounds(polygon as LatLngExpression[])
            map.fitBounds(bounds, { padding: [30, 30] })
        }
    }, [polygon, map])
    return null
}

export default function ZoneDetailDialog({ open, onOpenChange, zone }: ZoneDetailDialogProps) {
    if (!zone) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full !max-w-7xl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold mb-2">รายละเอียดโซน</DialogTitle>
                    <DialogDescription>
                        <div className="mb-4">
                            <div className="mb-2">
                                <span className="font-bold">ชื่อโซน:</span> {zone.name}
                            </div>
                            <div className="mb-2">
                                <span className="font-bold">LINE Group ID:</span> {zone.lineGroupId || "-"}
                            </div>
                            <div className="mb-2">
                                <span className="font-bold">Telegram Group ID:</span> {zone.telegramGroupId || "-"}
                            </div>
                            {zone.createdAt && (
                                <div className="mb-2">
                                    <span className="font-bold">สร้างเมื่อ:</span> {formatThaiDatetime(zone.createdAt)}
                                </div>
                            )}
                            {zone.updatedAt && (
                                <div className="mb-2">
                                    <span className="font-bold">แก้ไขล่าสุด:</span> {formatThaiDatetime(zone.updatedAt)}
                                </div>
                            )}
                        </div>
                        <div className="w-full h-[500px] rounded overflow-hidden">
                            <MapContainer
                                center={zone.polygon.length > 0 ? (zone.polygon[0] as LatLngExpression) : [13.7563, 100.5018]}
                                zoom={14}
                                className="h-full w-full z-0"
                                dragging={true} // เปิดให้ลากได้
                                zoomControl={true}
                                scrollWheelZoom={true}
                                doubleClickZoom={true}
                                attributionControl={false}
                                style={{ pointerEvents: "auto" }} // ลากได้
                            >
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                {zone.polygon.length > 2 && (
                                    <>
                                        <Polygon positions={zone.polygon as LatLngExpression[]} pathOptions={{ color: "blue" }} />
                                        <FitPolygon polygon={zone.polygon} />
                                    </>
                                )}
                            </MapContainer>
                        </div>
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}
