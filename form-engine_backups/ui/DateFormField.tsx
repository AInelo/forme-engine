import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import ClassNames from "classnames";
import { baseClasses } from "../constants/FieldDesignWrapper";
import {
    FormFieldWrapper,
    useResponsiveSize,
} from "../FormFieldWrapper";
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

const DateFormField: React.FC<DateFormFieldProps> = ({
    field,
    name,
    defaultValue,
    currentLang = 'fr',
    className
}) => {
    const size = useResponsiveSize();
    const {
        register,
        setValue,
        // watch
    } = useFormContext();
    const fieldName = name ?? field.fieldName.toString();
    // const currentValue = watch(fieldName);

    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(
        defaultValue ? new Date(defaultValue) : null
    );
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [popupRect, setPopupRect] = useState<{ top: number; left: number; width: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);

    const teal = "#008080";
    const tealLight = "#e6f7f7";
    const tealDark = "#006666";

    // Fermer le calendrier quand on clique à l'extérieur
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                (containerRef.current && containerRef.current.contains(target)) ||
                (calendarRef.current && calendarRef.current.contains(target))
            ) {
                return;
            }
            setIsOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const updatePopupPosition = useCallback(() => {
        if (typeof window === "undefined") return;
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setPopupRect({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
        });
    }, []);

    useEffect(() => {
        if (isOpen) {
            updatePopupPosition();
        }
    }, [currentMonth, isOpen, updatePopupPosition]);

    const months = currentLang === 'fr'
        ? ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
           'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
        : ['January', 'February', 'March', 'April', 'May', 'June',
           'July', 'August', 'September', 'October', 'November', 'December'];

    const daysOfWeek = currentLang === 'fr'
        ? ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const formatDate = (date: Date | null) => {
        if (!date) return '';
        return currentLang === 'fr'
            ? date.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            })
            : date.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
    };


    const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + i);
        days.push(day);
    }
    return days;
};


    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        // setValue(fieldName, date.toISOString().split('T')[0]);
         setValue(fieldName, date.toISOString().split('T')[0], {
            shouldValidate: true,
            shouldTouch: true, // ✅ ici !
             });

        setIsOpen(false);
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentMonth(prev => {
            const newMonth = new Date(prev);
            newMonth.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
            return newMonth;
        });
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isSameMonth = (date: Date, month: Date) => {
        return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear();
    };

    const isSelected = (date: Date) => {
        return selectedDate && date.toDateString() === selectedDate.toDateString();
    };

    // Fonction pour déterminer la taille du calendrier selon l'écran
    const getCalendarWidth = () => {
        if (typeof window === 'undefined') return 320;

        const windowWidth = window.innerWidth;

        if (windowWidth <= 320) { // mobile-s
            return Math.min(250, windowWidth - 90);
        } else if (windowWidth <= 375) { // mobile-m
            return 280;
        } else if (windowWidth <= 425) { // mobile-l
            return 300;
        } else if (windowWidth <= 768) { // tablet
            return 330;
        } else if (windowWidth <= 1024) { // laptop
            return 370;
        } else if (windowWidth <= 1440) { // laptop-l
            return 400;
        } else if (windowWidth <= 1920) { // desktop
            return 430;
        } else { // 4k-screen
            return 4700;
        }
    };

    // Fonction pour déterminer la taille des cellules du calendrier
    const getCellSize = () => {
        if (typeof window === 'undefined') return { padding: '0.5rem', fontSize: '0.875rem' };

        const windowWidth = window.innerWidth;

        if (windowWidth <= 320) { // mobile-s
            return { padding: '0.4rem', fontSize: '0.75rem' };
        } else if (windowWidth <= 375) { // mobile-m
            return { padding: '0.5rem', fontSize: '0.8rem' };
        } else if (windowWidth <= 425) { // mobile-l
            return { padding: '0.6rem', fontSize: '0.875rem' };
        } else if (windowWidth <= 768) { // tablet
            return { padding: '0.7rem', fontSize: '0.875rem' };
        } else if (windowWidth <= 1024) { // laptop
            return { padding: '0.75rem', fontSize: '0.9rem' };
        } else if (windowWidth <= 1440) { // laptop-l
            return { padding: '0.8rem', fontSize: '0.95rem' };
        } else if (windowWidth <= 1920) { // desktop
            return { padding: '0.85rem', fontSize: '1rem' };
        } else { // 4k-screen
            return { padding: '1rem', fontSize: '1.1rem' };
        }
    };

    const cellSize = getCellSize();

    const inputStyles = {
        width: `${size.width}px`,
        height: `${size.height}px`,
        borderRadius: `${size.borderRadius}px`,
    };

    return (
        <FormFieldWrapper field={field} currentLang={currentLang}>
            <div ref={containerRef} className="relative">
                {/* Input caché pour react-hook-form */}
                <input
                    type="hidden"
                    {...register(fieldName)}
                />

                {/* Bouton d'affichage de la date */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={ClassNames(baseClasses, className, "flex items-center justify-between cursor-pointer group hover:shadow-lg transition-all duration-300")}
                    style={{
                        ...inputStyles,
                        border: `2px solid ${isOpen ? tealDark : teal}`,
                        background: isOpen ? tealLight : "#fff",
                        padding: "0.75em 1em",
                        fontSize: "0.95em",
                        fontWeight: "500",
                        color: selectedDate ? teal : "#999",
                        boxShadow: isOpen ? `0 0 0 3px ${teal}20` : "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                >
                    <span className="flex items-center gap-2">
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="opacity-70"
                        >
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        {selectedDate ? formatDate(selectedDate) :
                         (currentLang === 'fr' ? 'Sélectionner une date' : 'Select a date')}
                    </span>
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    >
                        <polyline points="6,9 12,15 18,9"/>
                    </svg>
                </button>

                {isOpen && popupRect && typeof document !== "undefined" &&
                    createPortal(
                        <div
                            ref={calendarRef}
                            className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
                            style={{
                                position: "absolute",
                                top: popupRect.top,
                                left: popupRect.left,
                                width: Math.max(getCalendarWidth(), popupRect.width),
                                zIndex: 1000,
                                animation: "slideDown 0.2s ease-out",
                            }}
                        >
                            {/* Header du calendrier */}
                            <div
                                className="flex items-center justify-between border-b border-gray-100"
                                style={{
                                    backgroundColor: tealLight,
                                    padding: `${cellSize.padding} ${parseFloat(cellSize.padding) * 1.5}rem`,
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => navigateMonth('prev')}
                                    className="rounded-lg hover:bg-white/50 transition-colors"
                                    style={{
                                        color: teal,
                                        padding: parseFloat(cellSize.padding) * 0.8 + 'rem',
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="15,18 9,12 15,6" />
                                    </svg>
                                </button>

                                <h3
                                    className="font-semibold"
                                    style={{
                                        color: tealDark,
                                        fontSize: parseFloat(cellSize.fontSize.replace('rem', '')) * 1.2 + 'rem',
                                    }}
                                >
                                    {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                                </h3>

                                <button
                                    type="button"
                                    onClick={() => navigateMonth('next')}
                                    className="rounded-lg hover:bg-white/50 transition-colors"
                                    style={{
                                        color: teal,
                                        padding: parseFloat(cellSize.padding) * 0.8 + 'rem',
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="9,18 15,12 9,6" />
                                    </svg>
                                </button>
                            </div>

                            {/* Jours de la semaine */}
                            <div className="grid grid-cols-7 gap-0 p-2 bg-gray-50">
                                {daysOfWeek.map((day) => (
                                    <div key={day} className="text-center text-sm font-medium text-gray-600 p-2">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Grille des jours */}
                            <div className="grid grid-cols-7 gap-0 p-2">
                                {getDaysInMonth(currentMonth).map((date, index) => {
                                    const isCurrentMonthValue = isSameMonth(date, currentMonth);
                                    const isDateToday = isToday(date);
                                    const isDateSelected = isSelected(date);

                                    return (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => handleDateSelect(date)}
                                            className={ClassNames(
                                                "p-2 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105",
                                                {
                                                    'text-gray-400': !isCurrentMonthValue,
                                                    'text-gray-700 hover:bg-gray-100': isCurrentMonthValue && !isDateSelected && !isDateToday,
                                                    'text-white font-bold': isDateSelected,
                                                    'bg-blue-500 text-white': isDateToday && !isDateSelected,
                                                    'ring-2 ring-blue-300': isDateToday && !isDateSelected,
                                                }
                                            )}
                                            style={{
                                                backgroundColor: isDateSelected ? teal : undefined,
                                                color: isDateSelected ? 'white' : undefined,
                                            }}
                                        >
                                            {date.getDate()}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Footer avec bouton aujourd'hui */}
                            <div className="border-t border-gray-100 p-3">
                                <button
                                    type="button"
                                    onClick={() => handleDateSelect(new Date())}
                                    className="w-full text-sm font-medium py-2 px-3 rounded-lg transition-colors hover:bg-gray-100"
                                    style={{ color: teal }}
                                >
                                    {currentLang === 'fr' ? "Aujourd'hui" : "Today"}
                                </button>
                            </div>
                        </div>,
                        document.body
                    )}
            </div>

            <style>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </FormFieldWrapper>
    );
};

export default DateFormField;