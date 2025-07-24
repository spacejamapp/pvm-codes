export interface Opcode {
  name: string;
  description: string;
  opcode: number;
}

export interface InstructionCategory {
  description: string;
  register: number;
  immediate: number;
  offset: number;
  'extended-immediate': number;
  opcodes: Opcode[];
}

export interface InstructionSet {
  [key: string]: InstructionCategory;
}

export interface ArgumentType {
  type: string;
  count: number;
}

export interface ProcessedOpcode extends Opcode {
  category: string;
  categoryDescription: string;
  argumentTypes: ArgumentType[];
  hexOpcode: string;
  mutations: string;
}

export interface VersionInfo {
  version: string;
  file: string;
  count: number;
}

export interface VersionsManifest {
  versions: VersionInfo[];
  lastUpdated: string;
}

// Client-side data fetching functions
export async function getAvailableVersions(): Promise<VersionInfo[]> {
  try {
    const response = await fetch('/instr/versions.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch versions: ${response.statusText}`);
    }
    const manifest: VersionsManifest = await response.json();
    return manifest.versions.sort((a, b) => b.version.localeCompare(a.version)); // Sort newest first
  } catch (error) {
    console.error('Error fetching available versions:', error);
    return [];
  }
}

export async function getInstructionSetByVersion(version: string): Promise<ProcessedOpcode[]> {
  try {
    const response = await fetch(`/instr/v${version}.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch instructions for version ${version}: ${response.statusText}`);
    }
    const instructions: ProcessedOpcode[] = await response.json();
    return instructions;
  } catch (error) {
    console.error(`Error fetching instructions for version ${version}:`, error);
    return [];
  }
}

// Server-side functions for SSR/SSG (fallback to latest version)
export function getInstructionSet(): ProcessedOpcode[] {
  // This function is now deprecated in favor of client-side fetching
  // Return empty array as fallback
  console.warn('getInstructionSet() is deprecated, use getInstructionSetByVersion() instead');
  return [];
}

// Keep for backward compatibility
export function parseInstructionSet(): ProcessedOpcode[] {
  return getInstructionSet();
} 