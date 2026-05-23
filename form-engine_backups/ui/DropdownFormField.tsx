





// components/atoms/formfield/ui/DropdownFormField.tsx

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import ClassNames from "classnames";
import { baseClasses } from "../constants/FieldDesignWrapper";
import {
    FormFieldWrapper,
    useResponsiveSize,
    getLocalizedText,
} from "../FormFieldWrapper";
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

// Fonction utilitaire pour créer un slug
const createSlug = (text: string): string => {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
        .replace(/[^a-z0-9\s-]/g, '') // Supprime les caractères spéciaux
        .replace(/\s+/g, '-') // Remplace les espaces par des tirets
        .replace(/-+/g, '-') // Supprime les tirets multiples
        .trim()
        .replace(/^-+|-+$/g, ''); // Supprime les tirets en début et fin
};

const DropdownFormField: React.FC<DropdownFormFieldProps> = ({
    field,
    name,
    defaultValue,
    currentLang = 'fr',
    className,
    dependentFieldNameTransformed
}) => {
    const size = useResponsiveSize();
    const { register, setValue, watch, getValues } = useFormContext();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredOptions, setFilteredOptions] = useState(field.selectOptions || []);
    const [selectedOption, setSelectedOption] = useState<SelectOption | null>(null);
    const [hoveredOptionIndex, setHoveredOptionIndex] = useState<number | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState<{top: number, left: number, width: number} | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const fieldName = name ?? field.fieldName.toString();
    const currentValue = watch(fieldName);

    // 🆕 Vérifier si le champ parent est rempli (pour le filtrage dynamique)
    // Utiliser le nom transformé si fourni (pour les RepeatGroups), sinon le nom original
    // Utiliser getValues() comme fallback pour éviter les problèmes de timing avec watch()
    const dependentFieldNameToWatch = field.dynamicFilterRule 
      ? (dependentFieldNameTransformed || field.dynamicFilterRule.dependentFieldName)
      : null;
    const dependentValueFromWatch = dependentFieldNameToWatch ? watch(dependentFieldNameToWatch) : null;
    const dependentValueFromGetValues = dependentFieldNameToWatch ? getValues(dependentFieldNameToWatch) : null;
    // Utiliser getValues() si watch() retourne undefined/null, car getValues() est plus fiable pour les valeurs synchrones
    const dependentValue = dependentValueFromWatch !== undefined && dependentValueFromWatch !== null && dependentValueFromWatch !== ''
      ? dependentValueFromWatch 
      : (dependentValueFromGetValues !== undefined && dependentValueFromGetValues !== null && dependentValueFromGetValues !== '' ? dependentValueFromGetValues : null);
    
    // Debug logs pour diagnostiquer
    if (field.dynamicFilterRule && dependentFieldNameToWatch) {
      // console.log('🔍 [DropdownFormField] dependentValue check:', {
        // fieldName: field.fieldName,
        // dependentFieldName: field.dynamicFilterRule.dependentFieldName,
        // dependentFieldNameTransformed,
        // dependentFieldNameToWatch,
        // dependentValueFromWatch,
        // dependentValueFromGetValues,
        // finalDependentValue: dependentValue,
        // hasSelectOptions: !!field.selectOptions?.length,
        // optionsCount: field.selectOptions?.length || 0
      // });
    }
    
    // 🆕 Désactiver le champ si le parent est vide ou si les options sont vides
    const isDisabled = field.dynamicFilterRule && (!dependentValue || !field.selectOptions?.length);
    const hasNoOptions = !field.selectOptions || field.selectOptions.length === 0;

    const placeholder = getLocalizedText(field.placeholder, currentLang);
    const label = getLocalizedText(field.label, currentLang);
    
    // 🆕 Placeholder adapté selon l'état
    const effectivePlaceholder = isDisabled && field.dynamicFilterRule
      ? `Sélectionnez d'abord le champ précédent`
      : placeholder || `Sélectionner ${label}`;

    // Initialiser la valeur sélectionnée si defaultValue est fourni
    useEffect(() => {
        if (defaultValue) {
            const option = field.selectOptions?.find(opt => opt.value === defaultValue);
            if (option) {
                setSelectedOption(option);
                setSearchQuery(getLocalizedText(option.label, currentLang));
            }
        }
    }, [defaultValue, field.selectOptions, currentLang]);

    // Mettre à jour la sélection si la valeur change via le formulaire
    useEffect(() => {
        if (currentValue && currentValue !== selectedOption?.value) {
            const option = field.selectOptions?.find(opt => opt.value === currentValue);
            if (option) {
                setSelectedOption(option);
                setSearchQuery(getLocalizedText(option.label, currentLang));
            }
        } else if (!currentValue && selectedOption) {
            setSelectedOption(null);
            setSearchQuery('');
        }
    }, [currentValue, field.selectOptions, currentLang, selectedOption]);

    // Calculer la position du dropdown pour le portal
    const updateDropdownPosition = () => {
        if (!inputRef.current) return;
        
        const rect = inputRef.current.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        setDropdownPosition({
            top: rect.bottom + scrollTop,
            left: rect.left + scrollLeft,
            width: rect.width
        });
    };

    // Mettre à jour la position quand le dropdown s'ouvre
    useEffect(() => {
        if (isOpen && field.enableSearch) {
            updateDropdownPosition();
            
            // Recalculer la position lors du scroll ou resize
            const handleScroll = () => updateDropdownPosition();
            const handleResize = () => updateDropdownPosition();
            
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', handleResize);
            
            return () => {
                window.removeEventListener('scroll', handleScroll, true);
                window.removeEventListener('resize', handleResize);
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
        const filtered = field.selectOptions?.filter(option => {
            const labelText = getLocalizedText(option.label, currentLang);
            const labelSlug = createSlug(labelText);
            return labelSlug.includes(querySlug);
        }) || [];

        setFilteredOptions(filtered);
    }, [searchQuery, field.selectOptions, field.enableSearch, currentLang]);

    // Fermer le dropdown quand on clique à l'extérieur
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            
            // Vérifier si le clic est dans le dropdown principal
            if (dropdownRef.current && dropdownRef.current.contains(target)) {
                return;
            }
            
            // Si enableSearch est true, vérifier aussi dans le portal
            if (field.enableSearch && isOpen) {
                // Chercher si le clic est dans un élément du dropdown portal
                const portalDropdown = document.querySelector('[data-dropdown-portal="true"]');
                if (portalDropdown && portalDropdown.contains(target)) {
                    return;
                }
            }
            
            setIsOpen(false);
            setHoveredOptionIndex(null);
            // Restaurer le texte de l'option sélectionnée si pas de recherche active
            if (selectedOption && field.enableSearch) {
                setSearchQuery(getLocalizedText(selectedOption.label, currentLang));
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [selectedOption, currentLang, field.enableSearch, isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        
        if (field.enableSearch) {
            setIsOpen(true);
            setHoveredOptionIndex(null);
            // Si on efface le texte, effacer aussi la sélection
            if (!value.trim() && selectedOption) {
                setSelectedOption(null);
                setValue(fieldName, '', {
                    shouldValidate: true,
                    shouldTouch: true,
                });
            }
        }
    };

    const handleOptionSelect = (option: SelectOption) => {
        setSelectedOption(option);
        setSearchQuery(getLocalizedText(option.label, currentLang));
        setValue(fieldName, option.value, {
            shouldValidate: true,
            shouldTouch: true,
        });
        setIsOpen(false);
        setHoveredOptionIndex(null);
    };

    const handleInputClick = () => {
        // 🆕 Ne pas ouvrir si le champ est désactivé
        if (isDisabled) {
            return;
        }
        
        if (field.enableSearch) {
            setIsOpen(!isOpen);
            if (selectedOption && !isOpen) {
                // Vider le texte pour permettre la recherche
                setSearchQuery('');
            }
        } else {
            setIsOpen(!isOpen);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // 🆕 Ne pas gérer les touches si le champ est désactivé
        if (isDisabled) {
            return;
        }
        
        if (e.key === 'Escape') {
            setIsOpen(false);
            setHoveredOptionIndex(null);
            if (selectedOption && field.enableSearch) {
                setSearchQuery(getLocalizedText(selectedOption.label, currentLang));
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredOptions.length === 1 && filteredOptions[0]) {
                handleOptionSelect(filteredOptions[0]);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setIsOpen(true);
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleBlur = () => {
        setIsFocused(false);
    };

    // Styles calculés dynamiquement
    const getInputStyles = (): React.CSSProperties => ({
        width: `${size.width}px`,
        height: `${size.height}px`,
        borderRadius: `${size.borderRadius}px`,
        borderWidth: '1.5px',
        borderStyle: 'solid',
        borderColor: isFocused ? '#008080' : '#008080',
        color: '#008080',
        backgroundColor: '#f8fefd',
        padding: '0 12px',
        fontSize: '1rem',
        outline: 'none',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        cursor: field.enableSearch ? 'text' : 'pointer',
        paddingRight: '40px',
        ...(isFocused && {
            boxShadow: '0 0 0 2px #b2dfdf',
        })
    });

    const dropdownStyles: React.CSSProperties = {
        position: 'absolute',
        top: dropdownPosition?.top || 0,
        left: dropdownPosition?.left || 0,
        width: dropdownPosition?.width || size.width,
        backgroundColor: '#f8fefd',
        borderWidth: '1.5px',
        borderStyle: 'solid',
        borderColor: '#008080',
        borderRadius: `${size.borderRadius}px`,
        maxHeight: '200px',
        overflowY: 'auto',
        zIndex: 999999,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    };

    const getOptionStyles = (index: number, isSelected: boolean = false): React.CSSProperties => ({
        padding: '8px 12px',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        fontSize: '1rem',
        color: '#008080',
        borderBottom: '1px solid #e0f2f1',
        transition: 'background-color 0.1s ease',
        backgroundColor: hoveredOptionIndex === index ? '#e0f2f1' : 
                         isSelected ? '#b2dfdf' : 'transparent',
    });

    const arrowStyles: React.CSSProperties = {
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: `translateY(-50%) ${isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}`,
        transition: 'transform 0.2s ease',
        pointerEvents: 'none',
        width: '16px',
        height: '16px',
        color: '#008080',
    };

    const noResultsStyles: React.CSSProperties = {
        padding: '8px 12px',
        color: '#888',
        fontStyle: 'italic',
        fontSize: '1rem',
    };

    // Si la recherche n'est pas activée, utiliser l'ancien comportement avec select natif
    if (!field.enableSearch) {
        return (
            <FormFieldWrapper field={field} currentLang={currentLang}>
                <select
                    {...register(fieldName)}
                    className={ClassNames(baseClasses, className)}
                    disabled={isDisabled}
                    style={{
                        ...getInputStyles(),
                        appearance: 'none',
                        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23008080' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        backgroundSize: '16px',
                        opacity: isDisabled ? 0.6 : 1,
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                    }}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    defaultValue={defaultValue ?? ""}
                    onChange={(e) => {
                        const selectedValue = e.target.value;
                        setValue(fieldName, selectedValue, {
                            shouldValidate: true,
                            shouldTouch: true,
                        });
                    }}
                >
                    <option value="" style={{ color: '#888', fontStyle: 'italic' }}>
                        {effectivePlaceholder}
                    </option>
                    {field.selectOptions?.map((option, index) => (
                        <option
                            key={`${option.value}-${index}`}
                            value={option.value}
                            style={{ backgroundColor: '#f8fefd', color: '#008080' }}
                        >
                            {getLocalizedText(option.label, currentLang)}
                        </option>
                    ))}
                </select>
            </FormFieldWrapper>
        );
    }

    return (
        <FormFieldWrapper field={field} currentLang={currentLang}>
            <div ref={dropdownRef} style={{ position: 'relative' }}>
                <input
                    {...register(fieldName)}
                    ref={inputRef}
                    type="text"
                    className={ClassNames(baseClasses, className)}
                    style={getInputStyles()}
                    value={searchQuery}
                    onChange={handleInputChange}
                    onClick={handleInputClick}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={effectivePlaceholder}
                    autoComplete="off"
                />
                
                {/* Flèche dropdown */}
                <svg
                    style={arrowStyles}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="6,9 12,15 18,9"></polyline>
                </svg>

                {/* Liste déroulante avec Portal pour enableSearch */}
                {isOpen && field.enableSearch && dropdownPosition && createPortal(
                    <div 
                        style={dropdownStyles}
                        data-dropdown-portal="true"
                        onMouseDown={(e) => {
                            // Empêcher la propagation pour éviter que handleClickOutside se déclenche
                            e.stopPropagation();
                        }}
                    >
                        {filteredOptions.length === 0 ? (
                            <div style={noResultsStyles}>
                                Aucun résultat trouvé
                            </div>
                        ) : (
                            filteredOptions.map((option, index) => {
                                const isSelected = selectedOption?.value === option.value;
                                return (
                                    <div
                                        key={`${option.value}-${index}`}
                                        style={getOptionStyles(index, isSelected)}
                                        onMouseDown={(e) => {
                                            // 🆕 Ne pas sélectionner si le champ est désactivé
                                            if (isDisabled) {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                return;
                                            }
                                            // Empêcher la propagation et le comportement par défaut
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleOptionSelect(option);
                                        }}
                                        onMouseEnter={() => setHoveredOptionIndex(index)}
                                        onMouseLeave={() => setHoveredOptionIndex(null)}
                                    >
                                        {getLocalizedText(option.label, currentLang)}
                                    </div>
                                );
                            })
                        )}
                    </div>,
                    document.body
                )}

                {/* Liste déroulante normale pour !enableSearch */}
                {isOpen && !field.enableSearch && (
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: '#f8fefd',
                        borderWidth: '1.5px',
                        borderStyle: 'solid',
                        borderColor: '#008080',
                        borderTop: 'none',
                        borderRadius: `0 0 ${size.borderRadius}px ${size.borderRadius}px`,
                        maxHeight: '200px',
                        overflowY: 'auto',
                        zIndex: 1000,
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    }}>
                        {filteredOptions.length === 0 ? (
                            <div style={noResultsStyles}>
                                Aucun résultat trouvé
                            </div>
                        ) : (
                            filteredOptions.map((option, index) => {
                                const isSelected = selectedOption?.value === option.value;
                                return (
                                    <div
                                        key={`${option.value}-${index}`}
                                        style={getOptionStyles(index, isSelected)}
                                        onClick={() => {
                                            // 🆕 Ne pas sélectionner si le champ est désactivé
                                            if (!isDisabled) {
                                                handleOptionSelect(option);
                                            }
                                        }}
                                        onMouseEnter={() => setHoveredOptionIndex(index)}
                                        onMouseLeave={() => setHoveredOptionIndex(null)}
                                    >
                                        {getLocalizedText(option.label, currentLang)}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </FormFieldWrapper>
    );
};

export default DropdownFormField;