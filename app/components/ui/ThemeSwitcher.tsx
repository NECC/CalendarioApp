"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "./ThemeContext";
import { Button } from "./Button";
import { clsx, type ClassValue } from "clsx";

function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

type Theme = "light" | "dark" | "mocha";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const themes: { label: string; value: Theme }[] = [
    { label: "Light", value: "light" },
    { label: "Dark", value: "dark" },
    { label: "Mocha", value: "mocha" },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)}>
        {theme.charAt(0).toUpperCase() + theme.slice(1)}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-28 origin-top-right rounded-md bg-background border border-border shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1">
            {themes.map((t) => (
              <button
                key={t.value}
                className={cn(
                  "block w-full text-left px-4 py-2 text-sm hover:bg-accent/10 transition-colors",
                  theme === t.value && "bg-accent/10 font-bold text-accent"
                )}
                onClick={() => {
                  setTheme(t.value);
                  setIsOpen(false);
                }}
              >
                {t.label}
              </button>
            ))}
          </div >
        </div >
      )}
    </div >
  );
}
