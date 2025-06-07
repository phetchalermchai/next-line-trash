import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import getCroppedImg from "@/utils/cropImage";

interface Props {
    file: File;
    onDone: (file: File) => void;
    onClose: () => void;
}

const aspectOptions = [
    { label: "1:1", value: "1" },
    { label: "4:3", value: "4/3" },
    { label: "16:9", value: "16/9" },
];

export default function ImageCropperModal({ file, onDone, onClose }: Props) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [aspect, setAspect] = useState<string>("1");

    const onCropAreaComplete = useCallback((_: any, areaPixels: any) => {
        setCroppedAreaPixels(areaPixels);
    }, []);

    const handleCrop = async () => {
        const croppedImageBlob = await getCroppedImg(URL.createObjectURL(file), croppedAreaPixels);
        const croppedFile = new File([croppedImageBlob], file.name, { type: file.type });
        onDone(croppedFile);
        onClose();
    };

    const getAspectValue = () => {
        return eval(aspect);
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-5xl w-full h-[60vh] flex flex-col gap-4">
                <DialogHeader>
                    <DialogTitle>ตัดรูปภาพ</DialogTitle>
                    <DialogDescription>
                        กรุณาปรับขนาดรูปภาพให้เหมาะสมก่อนอัปโหลด <br />
                        ขนาดแนะนำ: อย่างน้อย 800x600px เพื่อให้ภาพคมชัดบนทุกอุปกรณ์
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-2">
                    <span className="text-sm">อัตราส่วน:</span>
                    <Select value={aspect} onValueChange={setAspect}>
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder="เลือกอัตราส่วน" />
                        </SelectTrigger>
                        <SelectContent>
                            {aspectOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="relative flex-1 bg-black rounded overflow-hidden">
                    <Cropper
                        image={URL.createObjectURL(file)}
                        crop={crop}
                        zoom={zoom}
                        aspect={getAspectValue()}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropAreaComplete}
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <Button className="cursor-pointer" variant="secondary" onClick={onClose}>ยกเลิก</Button>
                    <Button className="cursor-pointer" onClick={handleCrop}>บันทึกรูปที่ครอบ</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}