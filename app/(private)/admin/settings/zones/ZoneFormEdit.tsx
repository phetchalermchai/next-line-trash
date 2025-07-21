"use client"

import { useEffect, useRef, useState } from "react"
import { MapContainer, TileLayer, FeatureGroup, Polygon } from "react-leaflet"
import { EditControl } from "react-leaflet-draw"
import L, { LatLngExpression, Polygon as PolygonType } from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet-draw/dist/leaflet.draw.css"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface ZoneFormEditProps {
    onSubmit: (data: {
        name: string
        lineGroupId?: string
        telegramGroupId?: string
        polygon: number[][]
    }) => void
    initialData: {
        name: string
        lineGroupId?: string
        telegramGroupId?: string
        polygon: number[][]
    }
}

function closePolygonIfNeeded(points: number[][]): number[][] {
    if (points.length < 3) return points
    const first = points[0]
    const last = points[points.length - 1]
    if (first[0] !== last[0] || first[1] !== last[1]) {
        return [...points, first]
    }
    return points
}

export default function ZoneFormEdit({ onSubmit, initialData }: ZoneFormEditProps) {
    const [name, setName] = useState(initialData?.name || "")
    const [lineGroupId, setLineGroupId] = useState(initialData?.lineGroupId || "")
    const [telegramGroupId, setTelegramGroupId] = useState(initialData?.telegramGroupId || "")
    const [polygonPoints, setPolygonPoints] = useState<number[][]>(initialData?.polygon || [])
    const [loading, setLoading] = useState(false);

    const mapRef = useRef<L.Map | null>(null)
    const featureGroupRef = useRef<L.FeatureGroup | null>(null)

    useEffect(() => {
        if (
            mapRef.current &&
            polygonPoints.length > 2
        ) {
            const bounds = L.latLngBounds(polygonPoints as LatLngExpression[])
            mapRef.current.fitBounds(bounds)
            mapRef.current.invalidateSize()
        }
    }, [polygonPoints]);

    const handleSubmit = () => {
        if (loading) return;
        if (!name.trim()) {
            toast.error("กรุณากรอกชื่อพื้นที่โซน")
            return
        }

        let latestPolygon: number[][] = []
        if (featureGroupRef.current) {
            featureGroupRef.current.eachLayer((layer: any) => {
                if (layer instanceof L.Polygon) {
                    const latlngs = layer.getLatLngs()[0] as L.LatLng[];
                    latestPolygon = latlngs.map((p: L.LatLng) => [p.lat, p.lng]);
                }
            });
        }

        if (!latestPolygon.length) {
            toast.error("กรุณาวาดหรือแก้ไข Polygon ก่อนบันทึก")
            return
        }

        setLoading(true);
        try {
            const closedPolygon = closePolygonIfNeeded(latestPolygon)
            onSubmit({
                name,
                lineGroupId,
                telegramGroupId,
                polygon: closedPolygon,
            })
        } catch (error) {
            console.error("[Edit Submit] Error:", error);
            toast.error("เกิดข้อผิดพลาดในการบันทึกผล");
        } finally {
            setLoading(false);
        }
    }

    const _onCreated = (e: { layer: PolygonType }) => {
        const layer = e.layer
        if (layer instanceof L.Polygon) {
            const latlngs = layer.getLatLngs()[0] as L.LatLng[]
            const points = latlngs.map(p => [p.lat, p.lng])
            setPolygonPoints(points)
        }
    }

    const _onEdited = (e: any) => {
        let found = false;
        e.layers.eachLayer((layer: any) => {
            if (layer instanceof L.Polygon && !found) {
                const latlngs = layer.getLatLngs()[0] as L.LatLng[];
                const points = latlngs.map((p: L.LatLng) => [p.lat, p.lng]);
                setPolygonPoints(points);
                found = true;
            }
        });
    };

    const _onDeleted = () => {
        setPolygonPoints([])
    }

    return (
        <div className="space-y-4">
            <Input placeholder="ชื่อพื้นที่โซน" value={name} onChange={e => setName(e.target.value)} />
            <Input placeholder="LINE Group ID" value={lineGroupId} onChange={e => setLineGroupId(e.target.value)} />
            <Input placeholder="Telegram Group ID" value={telegramGroupId} onChange={e => setTelegramGroupId(e.target.value)} />
            <div className="w-full h-[270px] sm:h-[350px] md:h-[400px] lg:h-[500px] rounded overflow-hidden">
                <MapContainer
                    center={polygonPoints.length ? polygonPoints[0] as LatLngExpression : [13.7563, 100.5018]}
                    zoom={13}
                    className="h-full w-full z-0"
                    ref={mapRef as any}
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <FeatureGroup
                        ref={featureGroupRef}
                        key={polygonPoints.length > 0 ? JSON.stringify(polygonPoints) : "empty"}
                    >
                        {/* แสดง polygon เดิม */}
                        {polygonPoints.length > 2 && (
                            <Polygon positions={polygonPoints as LatLngExpression[]} pathOptions={{ color: "blue" }} />
                        )}
                        <EditControl
                            position="topright"
                            onCreated={_onCreated}
                            onEdited={_onEdited}
                            onDeleted={_onDeleted}
                            draw={{
                                polygon: !polygonPoints.length,
                                polyline: false,
                                rectangle: false,
                                circle: false,
                                marker: false,
                                circlemarker: false,
                            }}
                            edit={{
                                edit: true,
                                remove: true,
                            }}
                        />
                    </FeatureGroup>
                </MapContainer>
            </div>
            <div className="flex justify-end">
                <Button className="cursor-pointer" onClick={handleSubmit} disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} บันทึก
                </Button>
            </div>
        </div>
    )
}
