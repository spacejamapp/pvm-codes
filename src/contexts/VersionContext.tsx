"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { VersionInfo, getAvailableVersions } from "@/lib/instructions";

interface VersionContextType {
  selectedVersion: string;
  setSelectedVersion: (version: string) => void;
  versions: VersionInfo[];
}

const VersionContext = createContext<VersionContextType | undefined>(undefined);

export function useVersion() {
  const context = useContext(VersionContext);
  if (context === undefined) {
    throw new Error("useVersion must be used within a VersionProvider");
  }
  return context;
}

interface VersionProviderProps {
  children: ReactNode;
  initialVersion?: string;
}

export function VersionProvider({
  children,
  initialVersion,
}: VersionProviderProps) {
  const [selectedVersion, setSelectedVersion] = useState<string>("0.6.7"); // Default to latest
  const [versions, setVersions] = useState<VersionInfo[]>([]);

  useEffect(() => {
    const loadVersions = async () => {
      const availableVersions = await getAvailableVersions();
      setVersions(availableVersions);

      // Set initial version if provided, otherwise use latest
      if (
        initialVersion &&
        availableVersions.some((v) => v.version === initialVersion)
      ) {
        setSelectedVersion(initialVersion);
      } else if (availableVersions.length > 0) {
        setSelectedVersion(availableVersions[0].version); // First one is latest (sorted newest first)
      }
    };

    loadVersions();
  }, [initialVersion]);

  const value = {
    selectedVersion,
    setSelectedVersion,
    versions,
  };

  return (
    <VersionContext.Provider value={value}>{children}</VersionContext.Provider>
  );
}
