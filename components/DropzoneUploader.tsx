"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

interface DropzoneUploaderProps {
    field: string;
    label: string;
    files: File[];
    previewUrls?: string[];
    setFiles: (files: File[]) => void;
    onCrop?: (file: File, done: (cropped: File) => void) => void;
    onPreview?: (urls: string[], index: number) => void;
    setPreviewUrls?: (urls: string[]) => void;
}

export default function DropzoneUploader({ field, label, files, previewUrls, setFiles, onCrop, onPreview, setPreviewUrls }: DropzoneUploaderProps) {
    const totalImages = (previewUrls?.length || 0) + files.length;
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (totalImages + acceptedFiles.length > 5) {
                toast.error("สามารถอัปโหลดได้สูงสุด 5 รูป");
                return;
            }

            for (const file of acceptedFiles) {
                if (file.size > 3 * 1024 * 1024) {
                    toast.error(`ไฟล์ ${file.name} มีขนาดเกิน 3MB`);
                    continue;
                }

                if (onCrop) {
                    onCrop(file, (croppedFile) => {
                        setFiles([...files, croppedFile]);
                    });
                } else {
                    setFiles([...files, file]);
                }
            }
        },
        [files, setFiles, onCrop, totalImages]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "image/*": [] },
        multiple: true,
        maxFiles: 5,
    });

    const handleRemove = (index: number) => {
        const updated = [...files];
        updated.splice(index, 1);
        setFiles(updated);
    };

    const handleRemovePreviewUrl = (index: number) => {
        if (!previewUrls || !setPreviewUrls) return;
        const updated = [...previewUrls];
        updated.splice(index, 1);
        setPreviewUrls(updated);
    };

    const fileUrls = files.map((f) => URL.createObjectURL(f));
    const allPreviewUrls = [...(previewUrls || []), ...fileUrls];

    return (
        <div className="space-y-2">
            <div className="grid w-full items-center gap-2">
                <Label htmlFor={`input-${field}`}>{label}</Label>
                <div
                    {...getRootProps()}
                    className={`flex items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer transition bg-muted/10 text-muted-foreground text-sm gap-2 ${isDragActive ? "bg-muted/30 border-blue-500" : "hover:bg-muted/20"
                        }`}
                >
                    <UploadCloud className="w-5 h-5" />
                    <span>คลิกหรือลากรูปเพื่อเพิ่ม (สูงสุด 5 รูป)</span>
                    <input {...getInputProps({ id: `input-${field}` })} />
                </div>
            </div>

            <p className="text-sm text-muted-foreground">
                {totalImages} ไฟล์ / สูงสุด 5 รูป, ไม่เกิน 3MB ต่อไฟล์
            </p>

            {allPreviewUrls.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-2">
                    {allPreviewUrls.map((url, idx) => {
                        const isFromFile = idx >= (previewUrls?.length || 0);
                        const fileIdx = idx - (previewUrls?.length || 0);

                        return (
                            <div
                                key={url}
                                className="relative group border rounded overflow-hidden aspect-square cursor-pointer"
                                onClick={() => onPreview?.(allPreviewUrls, idx)}
                            >
                                <Image
                                    src={url}
                                    alt={`preview-${idx}`}
                                    fill
                                    className="object-cover"
                                />

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (isFromFile) {
                                            handleRemove(fileIdx);
                                            URL.revokeObjectURL(url);
                                        } else {
                                            handleRemovePreviewUrl(idx);
                                        }
                                    }}
                                    className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 text-xs"
                                    title="ลบ"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
