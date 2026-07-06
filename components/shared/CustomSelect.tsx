"use client";

import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { Command } from "cmdk";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  label: string;
  value: string;
}

interface CustomSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CustomSelect({ value, onChange, options, placeholder, className, disabled }: CustomSelectProps) {
  const [open, setOpen] = React.useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn("form-input", className)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            backgroundColor: disabled ? "#F8FAFC" : "#FFFFFF",
            outline: "none",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.7 : 1,
            width: "100%",
            textAlign: "left",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", color: selectedOption ? "#0F172A" : "#94A3B8" }}>
            {selectedOption ? selectedOption.label : (placeholder || "Select...")}
          </span>
          <ChevronDown style={{ width: "16px", height: "16px", color: "#64748B", flexShrink: 0 }} />
        </button>
      </Popover.Trigger>
      
      <Popover.Portal>
        <Popover.Content
          sideOffset={4}
          align="start"
          style={{
            zIndex: 100,
            width: "var(--radix-popover-trigger-width)",
            minWidth: "200px",
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            overflow: "hidden"
          }}
        >
          <Command
            style={{ display: "flex", flexDirection: "column", width: "100%" }}
            filter={(val, search) => {
              const label = options.find(o => o.value === val)?.label || "";
              if (label.toLowerCase().includes(search.toLowerCase())) return 1;
              return 0;
            }}
          >
            <div style={{ display: "flex", alignItems: "center", padding: "8px 12px", borderBottom: "1px solid #F1F5F9" }}>
              <Search style={{ width: "16px", height: "16px", color: "#94A3B8", marginRight: "8px", flexShrink: 0 }} />
              <Command.Input
                placeholder="Search..."
                style={{
                  border: "none",
                  outline: "none",
                  width: "100%",
                  fontSize: "0.875rem",
                  color: "#0F172A",
                  backgroundColor: "transparent"
                }}
              />
            </div>
            
            <Command.List style={{ maxHeight: "250px", overflowY: "auto", padding: "6px" }}>
              <Command.Empty style={{ padding: "16px", textAlign: "center", fontSize: "0.875rem", color: "#94A3B8" }}>
                No options found.
              </Command.Empty>
              
              {options.map((opt) => (
                <Command.Item
                  key={opt.value}
                  value={opt.value}
                  onSelect={(val) => {
                    onChange?.(val);
                    setOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 12px 8px 32px",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    position: "relative",
                    color: value === opt.value ? "#4F46E5" : "#334155",
                    backgroundColor: value === opt.value ? "#EEF2FF" : "transparent",
                    transition: "all 0.15s"
                  }}
                  onMouseEnter={(e) => {
                    if (value !== opt.value) {
                      e.currentTarget.style.backgroundColor = "#F8FAFC";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (value !== opt.value) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  {value === opt.value && (
                    <span style={{ position: "absolute", left: "10px", display: "flex", alignItems: "center" }}>
                      <Check style={{ width: "16px", height: "16px", color: "#4F46E5" }} />
                    </span>
                  )}
                  {opt.label}
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
