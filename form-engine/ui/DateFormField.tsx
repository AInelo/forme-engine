import React, { useState } from "react";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { FormFieldWrapper } from "../FormFieldWrapper";
import { Popover, PopoverTrigger, PopoverContent } from "../components/ui/popover";
import { Calendar } from "../components/ui/calendar";
import { cn } from "../lib/utils";
import type { FormField } from "../types/formTypeStructure";
import { useFormContext } from "react-hook-form";

interface DateFormField extends FormField {
  fieldType: "date";
}

interface DateFormFieldProps {
  field: DateFormField;
  name?: string;
  currentLang?: string;
  defaultValue?: string;
  className?: string;
}

const formatDate = (date: Date, lang: string): string =>
  date.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const DateFormField: React.FC<DateFormFieldProps> = ({
  field,
  name,
  defaultValue,
  currentLang = "fr",
  className,
}) => {
  const { register, setValue } = useFormContext();
  const fieldName = name ?? field.fieldName.toString();

  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    defaultValue ? new Date(defaultValue) : null
  );

  const handleSelect = (date: Date) => {
    setSelectedDate(date);
    setValue(fieldName, date.toISOString().split("T")[0], {
      shouldValidate: true,
      shouldTouch: true,
    });
    setOpen(false);
  };

  const placeholder = currentLang === "fr" ? "Sélectionner une date" : "Select a date";

  return (
    <FormFieldWrapper field={field} currentLang={currentLang}>
      <input type="hidden" {...register(fieldName)} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2",
              "text-sm transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-[var(--fe-primary)] focus:ring-offset-1 focus:border-[var(--fe-primary)]",
              "disabled:cursor-not-allowed disabled:opacity-50",
              open && "border-[var(--fe-primary)] ring-2 ring-[var(--fe-primary)] ring-offset-1",
              selectedDate ? "text-slate-900" : "text-slate-400",
              className
            )}
          >
            <span className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-slate-400 shrink-0" />
              {selectedDate ? formatDate(selectedDate, currentLang) : placeholder}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-slate-400 shrink-0 transition-transform",
                open && "rotate-180"
              )}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent className="p-0 overflow-hidden">
          <Calendar
            value={selectedDate}
            onChange={handleSelect}
            currentLang={currentLang}
          />
        </PopoverContent>
      </Popover>
    </FormFieldWrapper>
  );
};

export default DateFormField;
