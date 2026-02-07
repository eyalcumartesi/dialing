"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import type { MachineData, GrinderData } from "@/lib/types";

interface EquipmentSelectProps<T> {
  label: string;
  items: T[];
  selectedId: string | null;
  onSelect: (item: T) => void;
  renderItem: (item: T) => string;
  placeholder?: string;
}

export function EquipmentSelect<T extends { id: string }>({
  label,
  items,
  selectedId,
  onSelect,
  renderItem,
  placeholder = "Select...",
}: EquipmentSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listboxRef = useRef<HTMLDivElement>(null);

  // Memoize filtered items to avoid recalculating on every render
  const filteredItems = useMemo(
    () =>
      items.filter((item) =>
        renderItem(item).toLowerCase().includes(search.toLowerCase())
      ),
    [items, search, renderItem]
  );

  // Reset active index when filtered items change
  useEffect(() => {
    setActiveIndex(0);
  }, [filteredItems]);

  // Scroll active item into view
  useEffect(() => {
    if (!isOpen || !listboxRef.current || filteredItems.length === 0) return;

    const activeElement = document.getElementById(`option-${label}-${filteredItems[activeIndex]?.id}`);
    if (activeElement) {
      activeElement.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [activeIndex, isOpen, filteredItems, label]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setSearch("");
          break;
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) => Math.min(prev + 1, filteredItems.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Home":
          e.preventDefault();
          setActiveIndex(0);
          break;
        case "End":
          e.preventDefault();
          setActiveIndex(filteredItems.length - 1);
          break;
        case "Enter":
          e.preventDefault();
          if (filteredItems[activeIndex]) {
            onSelect(filteredItems[activeIndex]);
            setIsOpen(false);
            setSearch("");
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeIndex, filteredItems, onSelect]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId),
    [items, selectedId]
  );

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-cream" id={`${label}-label`}>{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={`${label}-label`}
          aria-controls={`${label}-listbox`}
          className="w-full px-4 py-3 bg-coffee-dark border border-coffee-medium rounded-lg text-left text-cream hover:bg-coffee-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber"
        >
          {selectedItem ? renderItem(selectedItem) : placeholder}
        </button>

        {isOpen && (
          <div
            id={`${label}-listbox`}
            ref={listboxRef}
            className="absolute z-50 w-full mt-2 bg-coffee-dark border border-coffee-medium rounded-lg shadow-lg max-h-[50vh] overflow-hidden"
            role="listbox"
            aria-label={`${label} options`}
            aria-activedescendant={filteredItems[activeIndex] ? `option-${label}-${filteredItems[activeIndex].id}` : undefined}
          >
            <div className="p-2 border-b border-coffee-medium">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                aria-label={`Search ${label}`}
                aria-controls={`${label}-listbox`}
                className="w-full px-3 py-2 bg-espresso text-cream border border-coffee-medium rounded focus:outline-none focus:ring-2 focus:ring-amber"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto max-h-[40vh]">
              {filteredItems.length === 0 ? (
                <div className="px-4 py-3 text-cream-dark text-sm" role="status">
                  No results found
                </div>
              ) : (
                filteredItems.map((item, index) => (
                  <button
                    key={item.id}
                    id={`option-${label}-${item.id}`}
                    type="button"
                    role="option"
                    aria-selected={item.id === selectedId}
                    onClick={() => {
                      onSelect(item);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-coffee-medium transition-colors text-sm ${
                      item.id === selectedId
                        ? "bg-coffee-medium text-amber"
                        : index === activeIndex
                        ? "bg-coffee-medium/50 text-cream"
                        : "text-cream"
                    }`}
                  >
                    {renderItem(item)}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Specific instances for Machine and Grinder
export function MachineSelect({
  machines,
  selectedId,
  onSelect,
}: {
  machines: MachineData[];
  selectedId: string | null;
  onSelect: (machine: MachineData) => void;
}) {
  return (
    <EquipmentSelect
      label="Espresso Machine"
      items={machines}
      selectedId={selectedId}
      onSelect={onSelect}
      renderItem={(machine) => `${machine.brand} ${machine.model}`}
      placeholder="Select your espresso machine"
    />
  );
}

export function GrinderSelect({
  grinders,
  selectedId,
  onSelect,
}: {
  grinders: GrinderData[];
  selectedId: string | null;
  onSelect: (grinder: GrinderData) => void;
}) {
  return (
    <EquipmentSelect
      label="Grinder"
      items={grinders}
      selectedId={selectedId}
      onSelect={onSelect}
      renderItem={(grinder) => `${grinder.brand} ${grinder.model}`}
      placeholder="Select your grinder"
    />
  );
}
