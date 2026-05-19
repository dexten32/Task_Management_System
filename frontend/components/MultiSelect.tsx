
import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";

interface Option {
    id: string;
    name: string;
}

interface MultiSelectProps {
    options: Option[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    placeholder?: string;
    className?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
    options,
    selectedIds,
    onChange,
    placeholder = "Select...",
    className = "",
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToggle = (id: string) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter((sid) => sid !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    const selectedLabels = options
        .filter((opt) => selectedIds.includes(opt.id))
        .map((opt) => opt.name);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div
                className="flex items-center justify-between w-full p-2 border border-border rounded-md bg-card cursor-pointer min-h-[40px]"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex flex-wrap gap-1 text-sm">
                    {selectedLabels.length > 0 ? (
                        selectedLabels.join(", ")
                    ) : (
                        <span className="text-muted-foreground/80">{placeholder}</span>
                    )}
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground opacity-50" />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {options.length > 0 ? (
                        options.map((option) => {
                            const isSelected = selectedIds.includes(option.id);
                            return (
                                <div
                                    key={option.id}
                                    className={`flex items-center px-3 py-2 cursor-pointer text-sm hover:bg-accent ${isSelected ? "bg-primary/10 text-indigo-900" : "text-foreground"
                                        }`}
                                    onClick={() => handleToggle(option.id)}
                                >
                                    <div
                                        className={`flex items-center justify-center w-4 h-4 mr-2 border rounded ${isSelected
                                                ? "bg-primary border-indigo-600"
                                                : "border-border"
                                            }`}
                                    >
                                        {isSelected && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    {option.name}
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-2 text-sm text-muted-foreground text-center">No options</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MultiSelect;
