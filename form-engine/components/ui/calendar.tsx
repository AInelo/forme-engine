import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

interface CalendarProps {
  value?: Date | null;
  onChange: (date: Date) => void;
  currentLang?: string;
  className?: string;
}

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const start = new Date(firstDay);
  start.setDate(start.getDate() - firstDay.getDay());
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

const Calendar: React.FC<CalendarProps> = ({
  value,
  onChange,
  currentLang = "fr",
  className,
}) => {
  const [currentMonth, setCurrentMonth] = React.useState(value ?? new Date());

  const months = currentLang === "fr" ? MONTHS_FR : MONTHS_EN;
  const daysOfWeek = currentLang === "fr" ? DAYS_FR : DAYS_EN;
  const todayLabel = currentLang === "fr" ? "Aujourd'hui" : "Today";

  const navigate = (dir: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(prev.getMonth() + (dir === "next" ? 1 : -1));
      return d;
    });
  };

  const today = new Date();
  const todayStr = today.toDateString();
  const selectedStr = value?.toDateString();

  return (
    <div className={cn("w-72 select-none", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--fe-primary-light)] border-b border-slate-100">
        <button
          type="button"
          onClick={() => navigate("prev")}
          className="p-1.5 rounded-md hover:bg-white/70 transition-colors text-[var(--fe-primary-dark)]"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-[var(--fe-primary-dark)]">
          {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <button
          type="button"
          onClick={() => navigate("next")}
          className="p-1.5 rounded-md hover:bg-white/70 transition-colors text-[var(--fe-primary-dark)]"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100">
        {daysOfWeek.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-slate-500">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 p-2 gap-0.5">
        {getDaysInMonth(currentMonth).map((date, i) => {
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
          const isToday = date.toDateString() === todayStr;
          const isSelected = selectedStr && date.toDateString() === selectedStr;

          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(date)}
              className={cn(
                "h-8 w-8 mx-auto flex items-center justify-center text-sm rounded-md transition-all",
                !isCurrentMonth && "text-slate-300",
                isCurrentMonth && !isSelected && !isToday && "text-slate-700 hover:bg-slate-100",
                isToday && !isSelected && "bg-blue-500 text-white font-semibold",
                isSelected && "bg-[var(--fe-primary)] text-white font-semibold shadow-sm",
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 p-2">
        <button
          type="button"
          onClick={() => {
            const t = new Date();
            setCurrentMonth(t);
            onChange(t);
          }}
          className="w-full text-sm font-medium py-1.5 px-3 rounded-md transition-colors text-[var(--fe-primary)] hover:bg-[var(--fe-primary-light)]"
        >
          {todayLabel}
        </button>
      </div>
    </div>
  );
};

export { Calendar };
