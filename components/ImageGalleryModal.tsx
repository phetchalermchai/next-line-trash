"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useState } from "react";

interface Props {
    images: string[];
    initialIndex: number;
    onClose: () => void;
}

export default function ImageGalleryModal({ images, initialIndex, onClose }: Props) {
    const [index, setIndex] = useState(initialIndex);

    const handlePrev = () => {
        setIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const handleNext = () => {
        setIndex((prev) => (prev + 1) % images.length);
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent showCloseButton={false} className="w-full max-w-5xl p-0 overflow-hidden bg-black">
                <DialogHeader>
                    <DialogTitle className="sr-only">ดูรูปภาพ</DialogTitle>
                    <DialogDescription className="sr-only">คุณสามารถเลื่อนดูรูปทั้งหมด และปิดเมื่อไม่ต้องการดูแล้ว</DialogDescription>
                </DialogHeader>

                <div className="relative w-full h-[80vh] flex items-center justify-center">
                    <Image src={images[index]} alt={`image-${index}`} fill className="object-contain" />

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    onClick={onClose}
                                    className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>ปิด</TooltipContent>
                        </Tooltip>

                        {images.length > 1 && (
                            <>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            onClick={handlePrev}
                                            className="absolute left-4 bg-black/60 hover:bg-black/80 text-white cursor-pointer"
                                        >
                                            <ArrowLeft className="w-5 h-5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>ก่อนหน้า</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            onClick={handleNext}
                                            className="absolute right-4 bg-black/60 hover:bg-black/80 text-white cursor-pointer"
                                        >
                                            <ArrowRight className="w-5 h-5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>ถัดไป</TooltipContent>
                                </Tooltip>
                            </>
                        )}
                    </TooltipProvider>
                </div>
            </DialogContent>
        </Dialog>
    );
}