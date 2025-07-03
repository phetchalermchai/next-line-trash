// ComplaintImages.tsx
import { useState } from "react";
import Image from "next/image";
import ImageGalleryModal from "@/components/ImageGalleryModal";

export const ComplaintImages = ({
    imageBefore = [],
    imageAfter = [],
}: {
    imageBefore: string[];
    imageAfter: string[];
}) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [modalImages, setModalImages] = useState<string[]>([]);
    const [startIndex, setStartIndex] = useState(0);

    const openGallery = (images: string[], index: number) => {
        setModalImages(images);
        setStartIndex(index);
        setModalOpen(true);
    };

    const renderImageGrid = (images: string[], label: string) => {
        const validImages = images.filter((url) => url && url.trim() !== "");
        if (validImages.length === 0) return null;
        return (
            <div>
                <p className="text-sm font-semibold mb-2">{label}</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {validImages.map((url, idx) => (
                        <div
                            key={url}
                            className="relative border rounded overflow-hidden aspect-square cursor-pointer group"
                            onClick={() => openGallery(validImages, idx)}
                        >
                            <Image
                                src={url}
                                alt={`${label}-${idx}`}
                                fill
                                className="object-cover"
                            />
                        </div>
                    ))}
                </div>
            </div>
        )
    };

    return (
        <div className="space-y-6">
            {renderImageGrid(imageBefore, "ภาพก่อน")}
            {renderImageGrid(imageAfter, "ภาพหลัง")}
            {/* Modal */}
            {modalOpen && (
                <ImageGalleryModal
                    images={modalImages}
                    initialIndex={startIndex}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </div>
    );
};
