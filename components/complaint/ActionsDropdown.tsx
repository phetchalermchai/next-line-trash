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
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

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
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button className="cursor-pointer" size="icon" variant="ghost" onClick={() => onView(complaint)}>
                            <Eye className="w-4 h-4  text-violet-600 dark:text-violet-400" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>ดูรายละเอียด</TooltipContent>
                </Tooltip>
                {onEdit && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button className="cursor-pointer" size="icon" variant="ghost" onClick={() => onEdit(complaint)}>
                                <Pencil className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>แก้ไขเรื่องร้องเรียน</TooltipContent>
                    </Tooltip>
                )}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button className="cursor-pointer" size="icon" variant="ghost" onClick={() => onDelete(complaint)}>
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>ลบเรื่องร้องเรียน</TooltipContent>
                </Tooltip>
            </div>
        );
    }

    return (
        <DropdownMenu>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <Button className="cursor-pointer" size="icon" variant="ghost">
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>เมนูเพิ่มเติม</TooltipContent>
            </Tooltip>
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