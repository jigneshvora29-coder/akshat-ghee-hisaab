"use client";

import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import React from "react";
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
  return (
    <Select.Root value={value} onValueChange={onChange} disabled={disabled}>
      <Select.Trigger 
        className={cn("form-input", className)} 
        style={{ 
          backgroundImage: "none", 
          paddingRight: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          backgroundColor: "#FFFFFF",
          outline: "none"
        }}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon>
          <ChevronDown style={{ width: "16px", height: "16px", color: "#64748B" }} />
        </Select.Icon>
      </Select.Trigger>
      
      <Select.Portal>
        <Select.Content 
          position="popper" 
          sideOffset={4} 
          style={{
            overflow: "hidden",
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            zIndex: 100,
            width: "var(--radix-select-trigger-width)",
            minWidth: "120px"
          }}
        >
          <Select.Viewport style={{ padding: "6px" }}>
            {options.map((opt) => (
              <Select.Item
                key={opt.value}
                value={opt.value}
                style={{
                  position: "relative",
                  display: "flex",
                  width: "100%",
                  cursor: "pointer",
                  userSelect: "none",
                  alignItems: "center",
                  borderRadius: "8px",
                  padding: "10px 12px 10px 32px",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#334155",
                  outline: "none",
                  transition: "background-color 0.15s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#EEF2FF";
                  e.currentTarget.style.color = "#4F46E5";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#334155";
                }}
              >
                <span style={{
                  position: "absolute",
                  left: "8px",
                  display: "flex",
                  height: "16px",
                  width: "16px",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Select.ItemIndicator>
                    <Check style={{ width: "16px", height: "16px", color: "#4F46E5" }} />
                  </Select.ItemIndicator>
                </span>
                <Select.ItemText>{opt.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
