"use client";

import { useState } from "react";
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

  const filteredItems = items.filter((item) =>
    renderItem(item).toLowerCase().includes(search.toLowerCase())
  );

  const selectedItem = items.find((item) => item.id === selectedId);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-cream">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 bg-coffee-dark border border-coffee-medium rounded-lg text-left text-cream hover:bg-coffee-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber"
        >
          {selectedItem ? renderItem(selectedItem) : placeholder}
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-coffee-dark border border-coffee-medium rounded-lg shadow-lg max-h-[50vh] overflow-hidden">
            <div className="p-2 border-b border-coffee-medium">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full px-3 py-2 bg-espresso text-cream border border-coffee-medium rounded focus:outline-none focus:ring-2 focus:ring-amber"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto max-h-[40vh]">
              {filteredItems.length === 0 ? (
                <div className="px-4 py-3 text-cream-dark text-sm">
                  No results found
                </div>
              ) : (
                filteredItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelect(item);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-coffee-medium transition-colors text-sm ${
                      item.id === selectedId
                        ? "bg-coffee-medium text-amber"
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
