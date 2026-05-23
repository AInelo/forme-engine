import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { FormFieldWrapper, getLocalizedText } from "../FormFieldWrapper";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Input } from "../components/ui/input";
import { cn } from "../lib/utils";
import type { FormField, SelectOption } from "../types/formTypeStructure";
import { useFormContext } from "react-hook-form";

interface DropdownFormField extends FormField {
  fieldType: "dropdown";
  selectOptions: SelectOption[];
  enableSearch?: boolean;
}

interface DropdownFormFieldProps {
  field: DropdownFormField;
  name?: string;
  defaultValue?: string;
  currentLang?: string;
  className?: string;
  dependentFieldNameTransformed?: string;
}

const createSlug = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .replace(/^-+|-+$/g, "");

const DropdownFormField: React.FC<DropdownFormFieldProps> = ({
  field,
  name,
  defaultValue,
  currentLang = "fr",
  className,
  dependentFieldNameTransformed,
}) => {
  const { setValue, watch, getValues } = useFormContext();
  const fieldName = name ?? field.fieldName.toString();
  const currentValue = watch(fieldName);

  const dependentFieldNameToWatch = field.dynamicFilterRule
    ? dependentFieldNameTransformed || field.dynamicFilterRule.dependentFieldName
    : null;
  const dependentValueFromWatch = dependentFieldNameToWatch
    ? watch(dependentFieldNameToWatch)
    : null;
  const dependentValueFromGetValues = dependentFieldNameToWatch
    ? getValues(dependentFieldNameToWatch)
    : null;
  const dependentValue =
    dependentValueFromWatch != null && dependentValueFromWatch !== ""
      ? dependentValueFromWatch
      : dependentValueFromGetValues != null && dependentValueFromGetValues !== ""
      ? dependentValueFromGetValues
      : null;

  const isDisabled =
    field.dynamicFilterRule && (!dependentValue || !field.selectOptions?.length);

  const placeholder = getLocalizedText(field.placeholder, currentLang);
  const label = getLocalizedText(field.label, currentLang);
  const effectivePlaceholder =
    isDisabled && field.dynamicFilterRule
      ? "Sélectionnez d'abord le champ précédent"
      : placeholder || `Sélectionner ${label}`;

  // ── Search mode state ──────────────────────────────────────────────────────
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(field.selectOptions || []);
  const [selectedOption, setSelectedOption] = useState<SelectOption | null>(null);
  const [hoveredOptionIndex, setHoveredOptionIndex] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (defaultValue) {
      const option = field.selectOptions?.find((opt) => opt.value === defaultValue);
      if (option) {
        setSelectedOption(option);
        setSearchQuery(getLocalizedText(option.label, currentLang));
      }
    }
  }, [defaultValue, field.selectOptions, currentLang]);

  useEffect(() => {
    if (currentValue && currentValue !== selectedOption?.value) {
      const option = field.selectOptions?.find((opt) => opt.value === currentValue);
      if (option) {
        setSelectedOption(option);
        setSearchQuery(getLocalizedText(option.label, currentLang));
      }
    } else if (!currentValue && selectedOption) {
      setSelectedOption(null);
      setSearchQuery("");
    }
  }, [currentValue, field.selectOptions, currentLang, selectedOption]);

  const updateDropdownPosition = () => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    setDropdownPosition({ top: rect.bottom + scrollTop, left: rect.left + scrollLeft, width: rect.width });
  };

  useEffect(() => {
    if (isOpen && field.enableSearch) {
      updateDropdownPosition();
      window.addEventListener("scroll", updateDropdownPosition, true);
      window.addEventListener("resize", updateDropdownPosition);
      return () => {
        window.removeEventListener("scroll", updateDropdownPosition, true);
        window.removeEventListener("resize", updateDropdownPosition);
      };
    }
  }, [isOpen, field.enableSearch]);

  useEffect(() => {
    if (!field.enableSearch) {
      setFilteredOptions(field.selectOptions || []);
      return;
    }
    if (!searchQuery.trim()) {
      setFilteredOptions(field.selectOptions || []);
      return;
    }
    const querySlug = createSlug(searchQuery);
    setFilteredOptions(
      field.selectOptions?.filter((option) =>
        createSlug(getLocalizedText(option.label, currentLang)).includes(querySlug)
      ) || []
    );
  }, [searchQuery, field.selectOptions, field.enableSearch, currentLang]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current?.contains(target)) return;
      if (field.enableSearch && isOpen) {
        const portalDropdown = document.querySelector('[data-dropdown-portal="true"]');
        if (portalDropdown?.contains(target)) return;
      }
      setIsOpen(false);
      setHoveredOptionIndex(null);
      if (selectedOption && field.enableSearch) {
        setSearchQuery(getLocalizedText(selectedOption.label, currentLang));
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedOption, currentLang, field.enableSearch, isOpen]);

  const handleOptionSelect = (option: SelectOption) => {
    setSelectedOption(option);
    setSearchQuery(getLocalizedText(option.label, currentLang));
    setValue(fieldName, option.value, { shouldValidate: true, shouldTouch: true });
    setIsOpen(false);
    setHoveredOptionIndex(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (field.enableSearch) {
      setIsOpen(true);
      setHoveredOptionIndex(null);
      if (!value.trim() && selectedOption) {
        setSelectedOption(null);
        setValue(fieldName, "", { shouldValidate: true, shouldTouch: true });
      }
    }
  };

  // ── Non-search mode: Radix Select ─────────────────────────────────────────
  if (!field.enableSearch) {
    return (
      <FormFieldWrapper field={field} currentLang={currentLang}>
        <Select
          value={currentValue || ""}
          onValueChange={(val) =>
            setValue(fieldName, val, { shouldValidate: true, shouldTouch: true })
          }
          disabled={!!isDisabled}
        >
          <SelectTrigger className={cn("w-full", className)}>
            <SelectValue placeholder={effectivePlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {field.selectOptions?.map((option, index) => (
              <SelectItem key={`${option.value}-${index}`} value={option.value}>
                {getLocalizedText(option.label, currentLang)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormFieldWrapper>
    );
  }

  // ── Search mode: custom input + portal ────────────────────────────────────
  return (
    <FormFieldWrapper field={field} currentLang={currentLang}>
      <div ref={dropdownRef} className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onClick={() => {
            if (isDisabled) return;
            setIsOpen((v) => !v);
            if (selectedOption && !isOpen) setSearchQuery("");
          }}
          onKeyDown={(e) => {
            if (isDisabled) return;
            if (e.key === "Escape") {
              setIsOpen(false);
              if (selectedOption) setSearchQuery(getLocalizedText(selectedOption.label, currentLang));
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (filteredOptions.length === 1 && filteredOptions[0]) {
                handleOptionSelect(filteredOptions[0]);
              }
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              setIsOpen(true);
            }
          }}
          placeholder={effectivePlaceholder}
          autoComplete="off"
          disabled={!!isDisabled}
          className={cn("pr-10", className)}
        />
        <ChevronDown
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none transition-transform",
            isOpen && "rotate-180"
          )}
        />

        {isOpen && dropdownPosition &&
          createPortal(
            <div
              data-dropdown-portal="true"
              style={{
                position: "absolute",
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
                zIndex: 999999,
              }}
              className="rounded-md border border-slate-200 bg-white shadow-lg max-h-52 overflow-y-auto"
              onMouseDown={(e) => e.stopPropagation()}
            >
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-slate-400 italic">
                  Aucun résultat trouvé
                </div>
              ) : (
                filteredOptions.map((option, index) => (
                  <div
                    key={`${option.value}-${index}`}
                    className={cn(
                      "px-3 py-2 text-sm cursor-pointer border-b border-slate-100 last:border-0 transition-colors",
                      hoveredOptionIndex === index ? "bg-teal-50 text-teal-800" : "text-slate-700",
                      selectedOption?.value === option.value && "font-medium text-teal-700"
                    )}
                    onMouseDown={(e) => {
                      if (isDisabled) return;
                      e.preventDefault();
                      e.stopPropagation();
                      handleOptionSelect(option);
                    }}
                    onMouseEnter={() => setHoveredOptionIndex(index)}
                    onMouseLeave={() => setHoveredOptionIndex(null)}
                  >
                    {getLocalizedText(option.label, currentLang)}
                  </div>
                ))
              )}
            </div>,
            document.body
          )}
      </div>
    </FormFieldWrapper>
  );
};

export default DropdownFormField;
