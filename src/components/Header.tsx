"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useVersion } from "@/contexts/VersionContext";

export function Header() {
  const { selectedVersion, setSelectedVersion, versions } = useVersion();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Hide header when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);

      // Clear existing timeout
      clearTimeout(scrollTimeout);

      // Show header when user stops scrolling
      scrollTimeout = setTimeout(() => {
        setIsVisible(true);
      }, 150);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [lastScrollY]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="container flex h-14 items-center justify-between px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Left side - Logo/Title */}
        <div className="flex items-center">
          <h1 className="text-base sm:text-lg font-semibold">PVM Codes</h1>
        </div>

        {/* Right side - Controls */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <Select value={selectedVersion} onValueChange={setSelectedVersion}>
            <SelectTrigger className="w-20 sm:w-28 text-sm">
              <SelectValue placeholder="Version" />
            </SelectTrigger>
            <SelectContent>
              {versions.map((version) => (
                <SelectItem key={version.version} value={version.version}>
                  v{version.version}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
