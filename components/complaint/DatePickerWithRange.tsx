"use client";

import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

interface Props {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
}

function formatThaiDate(date: Date) {
  const thaiYear = date.getFullYear() + 543;
  return format(date, "dd MMM yyyy", { locale: th }).replace(`${date.getFullYear()}`, `${thaiYear}`);
}

export function DatePickerWithRange({ value, onChange }: Props) {
  const formatted =
    value?.from && value?.to
      ? `${formatThaiDate(value.from)} - ${formatThaiDate(value.to)}`
      : "เลือกช่วงวันที่";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatted}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={value}
          onSelect={onChange}
          numberOfMonths={2}
          locale={th}
          captionLayout="dropdown" 
          
        />
      </PopoverContent>
    </Popover>
  );
}
