"use client"

import "leaflet/dist/leaflet.css"
import "leaflet-draw/dist/leaflet.draw.css"
import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MapContainer, TileLayer, FeatureGroup } from "react-leaflet"
import L, { FeatureGroup as FeatureGroupType, Polygon as PolygonType, Map as LeafletMap } from "leaflet"
import dynamic from "next/dynamic"
import { toast } from "sonner"

const EditControl = dynamic(() => import("react-leaflet-draw").then(mod => mod.EditControl), {
  ssr: false,
})

interface ZoneFormProps {
  onSubmit: (data: {
    name: string
    lineGroupId?: string
    telegramGroupId?: string
    polygon: number[][]
  }) => void
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

export default function ZoneFormCreate({ onSubmit }: ZoneFormProps) {
  const [name, setName] = useState("")
  const [lineGroupId, setLineGroupId] = useState("")
  const [telegramGroupId, setTelegramGroupId] = useState("")
  const [polygonPoints, setPolygonPoints] = useState<number[][]>([])

  const featureGroupRef = useRef<FeatureGroupType>(null)
  const mapRef = useRef<LeafletMap | null>(null)

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
        const latlngs = layer.getLatLngs()[0] as L.LatLng[]
        const points = latlngs.map(p => [p.lat, p.lng])
        setPolygonPoints(points)
        found = true
      }
    })
  }

  const _onDeleted = () => {
    setPolygonPoints([])
  }

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("กรุณากรอกชื่อพื้นที่โซน")
      return
    }
    if (polygonPoints.length === 0) {
      toast.error("กรุณาวาด Polygon ก่อนบันทึก")
      return
    }
    const closedPolygon = closePolygonIfNeeded(polygonPoints)
    onSubmit({
      name,
      lineGroupId,
      telegramGroupId,
      polygon: closedPolygon,
    })
  }

  return (
    <div className="space-y-4">
      <Input placeholder="ชื่อพื้นที่โซน" value={name} onChange={(e) => setName(e.target.value)} />
      <Input placeholder="LINE Group ID" value={lineGroupId} onChange={(e) => setLineGroupId(e.target.value)} />
      <Input placeholder="Telegram Group ID" value={telegramGroupId} onChange={(e) => setTelegramGroupId(e.target.value)} />
      <div className="w-full h-[270px] sm:h-[350px] md:h-[400px] lg:h-[500px] rounded overflow-hidden">
        <MapContainer
          center={[13.7563, 100.5018]}
          zoom={12}
          ref={mapRef}
          className="h-full w-full z-0"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FeatureGroup ref={featureGroupRef} pathOptions={{ color: "blue" }}>
            <EditControl
              position="topright"
              onCreated={_onCreated}
              onEdited={_onEdited}
              onDeleted={_onDeleted}
              draw={{ polygon: true, polyline: false, rectangle: false, circle: false, marker: false, circlemarker: false }}
              edit={{ edit: true, remove: true }}
            />
          </FeatureGroup>
        </MapContainer>
      </div>
      <div className="flex justify-end">
        <Button className="cursor-pointer" onClick={handleSubmit} disabled={polygonPoints.length === 0}>บันทึก</Button>
      </div>
    </div>
  )
}
