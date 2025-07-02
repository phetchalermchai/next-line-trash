"use client";

import * as React from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2, MoreVertical } from "lucide-react";
import { useMediaQuery } from "@/lib/use-media-query";
import { Complaint } from "@/types/complaint";

interface ActionsDropdownProps {
    complaint: Complaint;
    onView: (c: Complaint) => void;
    onEdit: (c: Complaint) => void;
    onDelete: (c: Complaint) => void;
}

export default function ActionsDropdown({ complaint, onView, onEdit, onDelete }: ActionsDropdownProps) {
    const isMobile = useMediaQuery("(max-width: 768px)");
    if (isMobile) {
        return (
            <div className="flex gap-2">
                <Button className="cursor-pointer" size="icon" variant="outline" onClick={() => onView(complaint)}>
                    <Eye className="w-4 h-4" />
                </Button>
                {onEdit && (
                    <Button className="cursor-pointer" size="icon" variant="outline" onClick={() => onEdit(complaint)}>
                        <Pencil className="w-4 h-4" />
                    </Button>
                )}
                <Button className="cursor-pointer" size="icon" variant="destructive" onClick={() => onDelete(complaint)}>
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button className="cursor-pointer" size="icon" variant="outline">
                    <MoreVertical className="w-4 h-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem className="cursor-pointer" onClick={() => onView(complaint)}>
                    รายละเอียด
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => onEdit(complaint)}>
                    แก้ไข
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => onDelete(complaint)} className="cursor-pointer text-red-600">
                    ลบ
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}