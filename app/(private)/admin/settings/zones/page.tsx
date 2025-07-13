"use client"

import { useState } from "react"
import ZoneTable from "./ZoneTable"
import { useZones, createZone, updateZone, deleteZone, deleteManyZones } from "@/hooks/zones/useZones"
import { toast } from "sonner"
import dynamic from "next/dynamic"

const ZoneDetailDialog = dynamic(() => import("./ZoneDetailDialog"), { ssr: false })

export default function ZonePage() {
    const { zones, mutate } = useZones()
    const [open, setOpen] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [initialData, setInitialData] = useState<any>(null)
    const [detailOpen, setDetailOpen] = useState(false)
    const [zoneToView, setZoneToView] = useState<any>(null)

    const handleCreate = async (data: any) => {
        await createZone(data)
        mutate()
        toast.success("บันทึกข้อมูลสำเร็จ")
        setOpen(false)
    }

    const handleUpdate = async (data: any) => {
        if (!initialData) return
        await updateZone(initialData.id, data)
        mutate()
        toast.success("แก้ไขข้อมูลสำเร็จ")
        setOpen(false)
        setInitialData(null)
        setEditMode(false)
    }

    const handleDelete = async (id: string) => {
        await deleteZone(id)
        mutate()
        toast.success("ลบข้อมูลสำเร็จ")
    }

    const handleDeleteMany = async (ids: string[]) => {
        await deleteManyZones(ids)
        mutate()
        toast.success("ลบข้อมูลทั้งหมดสำเร็จ")
    }

    const handleEdit = (zone: any) => {
        setInitialData(zone)
        setEditMode(true)
        setOpen(true)
    }

    const handleView = (zone: any) => {
        setZoneToView(zone)
        setDetailOpen(true)
    }

    return (
        <div className="m-6 space-y-4">
            <h2 className="text-xl font-bold">ตั้งค่าพื้นที่โซน</h2>
            <ZoneTable
                zones={zones}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDeleteMany={handleDeleteMany}
                onView={handleView}
                open={open}
                setOpen={setOpen}
                editMode={editMode}
                setEditMode={setEditMode}
                initialData={initialData}
                setInitialData={setInitialData}
                handleCreate={handleCreate}
                handleUpdate={handleUpdate}
            />
            <ZoneDetailDialog
                open={detailOpen}
                onOpenChange={setDetailOpen}
                zone={zoneToView}
            />
        </div>
    )
}
