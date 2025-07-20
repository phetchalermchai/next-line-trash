"use client"

import { Card, CardContent } from "../ui/card"
import { Input } from "../ui/input"
import { toast } from "sonner";
import { AlertTriangle, ClipboardCopy, KeyRound, Loader2, Plus, Trash2, Undo2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react";
import axios from "axios";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { th } from "date-fns/locale";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";

interface ApiKey {
    id: string;
    name: string;
    key?: string;
    createdAt: string;
    revokedAt: string | null;
    expiresAt: string | null;
}

const MAX_KEYS = 5;

const AccountApiKeySection = () => {
    const { data: session } = useSession();
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [apiKeyName, setApiKeyName] = useState("");
    const [expiresAt, setExpiresAt] = useState<Date | undefined>();
    const [creating, setCreating] = useState(false);
    const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
    const [newKey, setNewKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchApiKeys = async () => {
        if (!session?.user?.id) return;
        const res = await axios.get("/api/user/api-keys");
        setApiKeys(res.data);
    };

    useEffect(() => {
        fetchApiKeys();
    }, [session]);

    const handleCreateApiKey = async () => {
        if (apiKeys.length >= MAX_KEYS)
            return toast.error(`สร้างได้สูงสุด ${MAX_KEYS} คีย์`);

        if (!apiKeyName.trim()) return toast.error("กรุณาระบุชื่อ API Key");

        setCreating(true);
        try {
            const res = await axios.post("/api/user/api-keys", {
                name: apiKeyName,
                expiresAt: expiresAt?.toISOString() ?? null,
            });
            setNewKey(res.data.key); // key คืนกลับมาจาก backend
            toast.success("สร้าง API Key สำเร็จ");
            setApiKeyName("");
            setExpiresAt(undefined);
            fetchApiKeys();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "สร้างไม่สำเร็จ");
        } finally {
            setCreating(false);
        }
    };

    const handleCopy = async (key: string) => {
        try {
            await navigator.clipboard.writeText(key);
            toast.success("คัดลอก API Key แล้ว");
        } catch {
            toast.error("ไม่สามารถคัดลอกได้");
        }
    };

    const handleRevokeApiKey = async () => {
        if (loading) return;
        if (!confirmRevokeId) return;
        setLoading(true);
        try {
            await axios.delete(`/api/user/api-keys/${confirmRevokeId}`);
            toast.success("ยกเลิก API Key สำเร็จ");
            fetchApiKeys();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "ยกเลิกไม่สำเร็จ");
        } finally {
            setLoading(false);
            setConfirmRevokeId(null);
        }
    };

    const handleRestoreApiKey = async (id: string) => {
        try {
            await axios.post(`/api/user/api-keys/${id}/restore`);
            toast.success("ย้อนกลับการยกเลิกสำเร็จ");
            fetchApiKeys();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "ย้อนกลับไม่สำเร็จ");
        }
    };

    const handlePermanentDelete = async (id: string) => {
        if (loading) return;
        setLoading(true);
        try {
            await axios.delete(`/api/user/api-keys/${id}/permanent`);
            toast.success("ลบถาวรเรียบร้อยแล้ว");
            fetchApiKeys();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "ลบถาวรไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">API Key ของคุณ</h2>
            {newKey && (
                <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded mb-4">
                    <p className="font-medium">API Key ที่สร้างใหม่ (แสดงเพียงครั้งเดียว):</p>
                    <div className="flex items-center mt-2 gap-2">
                        <code className="text-sm break-all bg-white px-2 py-1 border rounded w-full">{newKey}</code>
                        <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => handleCopy(newKey)}>
                            <ClipboardCopy className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
            <Card>
                <CardContent className="space-y-4 p-6">
                    <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
                        <Input
                            value={apiKeyName}
                            onChange={(e) => setApiKeyName(e.target.value)}
                            placeholder="ตั้งชื่อ API Key เช่น สำหรับแอปมือถือ"
                            className="w-full md:w-[320px]"
                        />
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full md:w-[200px] justify-start text-left cursor-pointer"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {expiresAt ? format(expiresAt, "PPP") : "วันหมดอายุ (ไม่จำเป็น)"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={expiresAt}
                                    onSelect={setExpiresAt}
                                    locale={th}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <Button className="cursor-pointer" onClick={handleCreateApiKey} disabled={creating || apiKeys.length >= MAX_KEYS}>
                            <Plus className="w-4 h-4 mr-1" /> สร้างใหม่
                        </Button>
                    </div>

                    {apiKeys.length === 0 ? (
                        <p className="text-sm text-muted-foreground">ยังไม่มี API Key</p>
                    ) : (
                        <ul className="text-sm space-y-2">
                            {apiKeys.map((key) => (
                                <li key={key.id} className="flex justify-between items-center border p-2 rounded">
                                    <div>
                                        <div className="font-medium flex items-center gap-2">
                                            <KeyRound className="w-4 h-4 text-muted-foreground" /> {key.name} {key.revokedAt && (<span className="text-red-500">ถูกยกเลิกแล้ว</span>)}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            สร้างเมื่อ {new Date(key.createdAt).toLocaleString()}
                                            {key.expiresAt && (
                                                <span> • หมดอายุ {new Date(key.expiresAt).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                    </div>
                                    {key.revokedAt && (
                                        <div className="flex gap-2 mt-1">
                                            <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => handleRestoreApiKey(key.id)} disabled={loading}>
                                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Undo2 className="w-4 h-4" />}
                                            </Button>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        className="ml-2 cursor-pointer"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </DialogTrigger>

                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle className="flex items-center gap-2 text-destructive">
                                                            <AlertTriangle className="w-5 h-5" /> ยืนยันการลบถาวร
                                                        </DialogTitle>
                                                    </DialogHeader>

                                                    <p className="text-sm text-muted-foreground">
                                                        คุณต้องการลบ API Key นี้ถาวรหรือไม่? ข้อมูลจะไม่สามารถกู้คืนได้
                                                    </p>

                                                    <DialogFooter className="mt-4">
                                                        <DialogClose asChild>
                                                            <Button className="cursor-pointer" variant="secondary">ยกเลิก</Button>
                                                        </DialogClose>
                                                        <Button
                                                            className="cursor-pointer"
                                                            variant="destructive"
                                                            onClick={() => handlePermanentDelete(key.id)}
                                                            disabled={loading}
                                                        >
                                                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} ยืนยัน
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    )}

                                    {!key.revokedAt && (

                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="cursor-pointer" onClick={() => setConfirmRevokeId(key.id)}>
                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle className="flex items-center gap-2 text-destructive">
                                                        <AlertTriangle className="w-5 h-5" /> ยืนยันการยกเลิก
                                                    </DialogTitle>
                                                </DialogHeader>
                                                <p>คุณแน่ใจหรือไม่ว่าต้องการยกเลิก API Key นี้?</p>
                                                <DialogFooter className="mt-4">
                                                    <DialogClose asChild>
                                                        <Button className="cursor-pointer" variant="secondary" onClick={() => setConfirmRevokeId(null)}>
                                                            ยกเลิก
                                                        </Button>
                                                    </DialogClose>
                                                    <Button className="cursor-pointer" variant="destructive" onClick={handleRevokeApiKey} disabled={loading}>
                                                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} ยืนยัน
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AccountApiKeySection;