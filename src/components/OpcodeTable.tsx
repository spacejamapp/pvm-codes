"use client";

import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ProcessedOpcode,
  ArgumentType,
  getInstructionSetByVersion,
} from "@/lib/instructions";
import { useVersion } from "@/contexts/VersionContext";
import katex from "katex";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface OpcodeTableProps {}

interface OpcodeRowProps {
  opcode: ProcessedOpcode;
  onClick: () => void;
  getArgumentBadgeColor: (argType: string) => string;
  formatArgumentType: (arg: ArgumentType) => string;
}

interface OpcodeExpandedDetailsProps {
  opcode: ProcessedOpcode;
  getArgumentColor: (argType: string) => string;
  getArgumentDescription: (argType: string) => string;
  getArgumentPlaceholder: (argType: string) => string;
  formatArgumentType: (arg: ArgumentType) => string;
}

interface OpcodeTableItemProps {
  opcode: ProcessedOpcode;
  isExpanded: boolean;
  onToggle: () => void;
  getArgumentBadgeColor: (argType: string) => string;
  getArgumentColor: (argType: string) => string;
  getArgumentDescription: (argType: string) => string;
  getArgumentPlaceholder: (argType: string) => string;
  formatArgumentType: (arg: ArgumentType) => string;
}

function OpcodeRow({
  opcode,
  onClick,
  getArgumentBadgeColor,
  formatArgumentType,
}: OpcodeRowProps) {
  return (
    <tr className="border-b opcode-table-row cursor-pointer" onClick={onClick}>
      <td className="p-2 sm:p-3">
        <code className="opcode-hex text-xs sm:text-sm">
          {opcode.hexOpcode}
        </code>
      </td>
      <td className="p-2 sm:p-3">
        <code className="opcode-name text-xs sm:text-sm">{opcode.name}</code>
      </td>
      <td className="p-2 sm:p-3 text-sm hidden sm:table-cell">
        {opcode.description}
      </td>
      <td className="p-2 sm:p-3">
        <div className="flex flex-wrap gap-1">
          {opcode.argumentTypes.length === 0 ? (
            <span className="text-xs text-muted-foreground">None</span>
          ) : (
            opcode.argumentTypes.map((argType, index) => (
              <span
                key={index}
                className={`px-2 py-1 rounded-full text-xs font-medium border ${getArgumentBadgeColor(
                  argType.type
                )}`}
              >
                {formatArgumentType(argType)}
              </span>
            ))
          )}
        </div>
      </td>
    </tr>
  );
}

function OpcodeExpandedDetails({
  opcode,
  getArgumentColor,
  getArgumentDescription,
  getArgumentPlaceholder,
  formatArgumentType,
}: OpcodeExpandedDetailsProps) {
  return (
    <tr className="bg-muted/30">
      <td colSpan={4} className="p-0">
        {/* Show description on mobile since it's hidden in the main row */}
        <div className="sm:hidden p-3 border-b bg-muted/20">
          <div className="text-sm text-muted-foreground mb-1">Description</div>
          <div className="text-sm">{opcode.description}</div>
        </div>
        <div className="p-3 sm:p-4 space-y-4">
          {/* Description */}
          <div className="mb-4">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Description
            </div>
            <p className="text-sm">{opcode.description}</p>
          </div>

          {/* Basic Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Opcode
              </div>
              <code className="opcode-hex">{opcode.hexOpcode}</code>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Decimal
              </div>
              <span className="font-mono">{opcode.opcode}</span>
            </div>
          </div>

          {/* Arguments Details */}
          {opcode.argumentTypes.length > 0 && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Arguments (
                {opcode.argumentTypes.reduce(
                  (total, arg) => total + arg.count,
                  0
                )}
                )
              </div>
              <div className="grid gap-2">
                {opcode.argumentTypes.flatMap((argType, typeIndex) =>
                  Array.from({ length: argType.count }, (_, countIndex) => {
                    const globalIndex =
                      opcode.argumentTypes
                        .slice(0, typeIndex)
                        .reduce((sum, prevArg) => sum + prevArg.count, 0) +
                      countIndex +
                      1;

                    return (
                      <div
                        key={`${typeIndex}-${countIndex}`}
                        className="flex items-center gap-3 p-2 bg-background rounded border"
                      >
                        <div className="bg-muted px-2 py-1 rounded text-xs font-medium w-6 text-center">
                          {globalIndex}
                        </div>
                        <div
                          className={`font-medium ${getArgumentColor(
                            argType.type
                          )} min-w-24`}
                        >
                          {argType.type}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {getArgumentDescription(argType.type)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Mutations */}
          {opcode.mutations && opcode.mutations.trim() !== "" && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Mutations
              </div>
              <div className="bg-muted p-3 rounded text-sm border">
                <div
                  className="katex-display"
                  dangerouslySetInnerHTML={{
                    __html: (() => {
                      try {
                        const rendered = katex.renderToString(
                          opcode.mutations,
                          {
                            displayMode: true,
                            throwOnError: false,
                            errorColor: "#cc0000",
                            macros: {
                              // Core PVM macros from tex specification
                              "\\panic": "\\text{panic}",
                              "\\host": "\\text{host}",
                              "\\immed": "\\nu",
                              "\\immed_X": "\\nu_X",
                              "\\immed_Y": "\\nu_Y",
                              "\\reg": "\\omega",
                              "\\reg_A": "\\omega_A",
                              "\\reg_B": "\\omega_B",
                              "\\reg_D": "\\omega_D",
                              "\\reg'_A": "\\omega'_A",
                              "\\reg'_B": "\\omega'_B",
                              "\\reg'_D": "\\omega'_D",
                              "\\mem": "\\text{mem}",
                              "\\memory": "\\text{mem}",
                              "\\memwr": "\\mu^{\\circlearrowright}",
                              "\\memr": "\\mu^{\\circlearrowleft}",
                              "\\branch": "\\text{branch}",
                              "\\djump": "\\text{djump}",

                              // Sign extension functions
                              "\\sext": "\\chi",
                              "\\sext_1": "\\chi_1",
                              "\\sext_2": "\\chi_2",
                              "\\sext_4": "\\chi_4",
                              "\\sext_8": "\\chi_8",

                              // Bit manipulation functions from tex
                              "\\bits": "\\mathcal{B}",
                              "\\bitsfunc": "\\mathcal{B}_{#1}",
                              "\\revbitsfunc":
                                "\\overleftarrow{\\mathcal{B}}_{#1}",
                              "\\unbitsfunc": "\\mathcal{B}_{#1}^{-1}",
                              "\\revunbitsfunc":
                                "\\overleftarrow{\\mathcal{B}}_{#1}^{-1}",

                              // Sign conversion functions
                              "\\signed": "\\mathcal{Z}",
                              "\\unsigned": "\\mathcal{Z}^{-1}",
                              "\\signedn": "\\mathcal{Z}_{#1}",
                              "\\unsignedn": "\\mathcal{Z}_{#1}^{-1}",
                              "\\signfunc": "\\mathcal{Z}_{#1}",
                              "\\unsignfunc": "\\mathcal{Z}_{#1}^{-1}",

                              // Encoding/decoding functions
                              "\\de": "\\mathcal{E}",
                              "\\de_1": "\\mathcal{E}_1",
                              "\\de_2": "\\mathcal{E}_2",
                              "\\de_4": "\\mathcal{E}_4",
                              "\\de_8": "\\mathcal{E}_8",
                              "\\se": "\\mathcal{E}",
                              "\\se_1": "\\mathcal{E}_1",
                              "\\se_2": "\\mathcal{E}_2",
                              "\\se_4": "\\mathcal{E}_4",
                              "\\se_8": "\\mathcal{E}_8",

                              // Special functions
                              "\\rtz": "\\text{rtz}",
                              "\\smod": "\\text{smod}",
                              "\\deblob": "\\text{deblob}",

                              // VM state symbols
                              "\\varepsilon": "\\epsilon",
                              "\\continue": "\\blacktriangleright",
                              "\\instructions": "\\zeta",
                              "\\basicblocks": "\\varpi",
                              "\\gas": "\\text{gas}_\\Delta",
                              "\\instrlen": "\\ell",

                              // Memory and register notations
                              "\\ram": "\\mathbb{M}",
                              "\\regs": "\\text{regs}",
                              "\\registers": "\\text{regs}",
                              "\\mathbb{V}": "\\mathbb{V}",
                              "\\mathbb{V}^*": "\\mathbb{V}^*",
                              "\\N_R": "\\mathbb{N}_R",
                              "\\N": "\\mathbb{N}",
                              "\\Z": "\\mathbb{Z}",
                              "\\mathbb{B}": "\\mathbb{B}",

                              // Token definitions
                              "\\token": "\\text{#1}",
                              "\\RA": "\\text{RA}",
                              "\\SP": "\\text{SP}",
                              "\\T": "\\text{T}",
                              "\\S": "\\text{S}",
                              "\\A": "\\text{A}",

                              // Mathematical operators and relations
                              "\\floor": "\\lfloor #1 \\rfloor",
                              "\\ceil": "\\lceil #1 \\rceil",
                              "\\when": "\\text{ when }",
                              "\\otherwise": "\\text{ otherwise }",
                              "\\where": "\\text{ where }",
                              "\\dots": "\\ldots",
                              // Custom text macros
                              "\\using": "\\text{using }",
                              "\\nicefrac": "\\frac{#1}{#2}",
                              "\\ffrac":
                                "\\left\\lfloor\\frac{#1}{#2}\\right\\rfloor",
                            },
                          }
                        );

                        // Debug log for successful renders
                        if (
                          opcode.name.includes("store") &&
                          !rendered.includes("katex-error")
                        ) {
                          console.log(
                            "Successfully rendered mutation for",
                            opcode.name,
                            ":",
                            opcode.mutations
                          );
                        }

                        return rendered;
                      } catch (error) {
                        console.error(
                          "KaTeX rendering error for opcode",
                          opcode.name + ":",
                          opcode.mutations,
                          error
                        );
                        return `<div style="color: red; font-family: monospace; font-size: 12px; padding: 8px; background: #fee; border: 1px solid #f99;">
                          <div><strong>KaTeX Error for ${
                            opcode.name
                          }:</strong></div>
                          <div>LaTeX: ${opcode.mutations}</div>
                          <div>Error: ${
                            error instanceof Error
                              ? error.message
                              : "Unknown error"
                          }</div>
                        </div>`;
                      }
                    })(),
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

function OpcodeTableItem({
  opcode,
  isExpanded,
  onToggle,
  getArgumentBadgeColor,
  getArgumentColor,
  getArgumentDescription,
  getArgumentPlaceholder,
  formatArgumentType,
}: OpcodeTableItemProps) {
  const rows = [
    <OpcodeRow
      key={`${opcode.opcode}-main`}
      opcode={opcode}
      onClick={onToggle}
      getArgumentBadgeColor={getArgumentBadgeColor}
      formatArgumentType={formatArgumentType}
    />,
  ];

  if (isExpanded) {
    rows.push(
      <OpcodeExpandedDetails
        key={`${opcode.opcode}-details`}
        opcode={opcode}
        getArgumentColor={getArgumentColor}
        getArgumentDescription={getArgumentDescription}
        getArgumentPlaceholder={getArgumentPlaceholder}
        formatArgumentType={formatArgumentType}
      />
    );
  }

  return rows;
}

export function OpcodeTable({}: OpcodeTableProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedOpcode, setExpandedOpcode] = useState<number | null>(null);
  const [opcodes, setOpcodes] = useState<ProcessedOpcode[]>([]);

  const { selectedVersion } = useVersion();

  // Load instructions when version changes
  useEffect(() => {
    if (!selectedVersion) return;

    const loadInstructions = async () => {
      const instructions = await getInstructionSetByVersion(selectedVersion);
      setOpcodes(instructions);
    };

    loadInstructions();
  }, [selectedVersion]);

  const categories = useMemo(() => {
    const cats = [...new Set(opcodes.map((op) => op.category))];
    return cats.sort();
  }, [opcodes]);

  const filteredOpcodes = useMemo(() => {
    return opcodes.filter((opcode) => {
      const matchesSearch =
        search === "" ||
        opcode.name.toLowerCase().includes(search.toLowerCase()) ||
        opcode.description.toLowerCase().includes(search.toLowerCase()) ||
        opcode.hexOpcode.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || opcode.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [opcodes, search, selectedCategory]);

  const getArgumentBadgeColor = (argType: string) => {
    switch (argType) {
      case "register":
        return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700";
      case "immediate":
        return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700";
      case "offset":
        return "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-700";
      case "extended-immediate":
        return "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-700";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-200 dark:border-gray-700";
    }
  };

  const getArgumentColor = (argType: string) => {
    switch (argType) {
      case "register":
        return "text-blue-600 dark:text-blue-400";
      case "immediate":
        return "text-green-600 dark:text-green-400";
      case "offset":
        return "text-purple-600 dark:text-purple-400";
      case "extended-immediate":
        return "text-orange-600 dark:text-orange-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getArgumentDescription = (argType: string): string => {
    switch (argType) {
      case "register":
        return "A register identifier (e.g., r0, r1, ...)";
      case "immediate":
        return "An immediate value embedded in the instruction";
      case "offset":
        return "A branch/jump offset value";
      case "extended-immediate":
        return "An extended-width immediate value";
      default:
        return "Unknown argument type";
    }
  };

  const getArgumentPlaceholder = (argType: string): string => {
    switch (argType) {
      case "register":
        return "reg";
      case "immediate":
        return "imm";
      case "offset":
        return "offset";
      case "extended-immediate":
        return "ext_imm";
      default:
        return "arg";
    }
  };

  const formatArgumentType = (arg: ArgumentType): string => {
    if (arg.count === 1) {
      return arg.type;
    }
    // Use Unicode superscript characters
    const superscriptMap: { [key: string]: string } = {
      "0": "⁰",
      "1": "¹",
      "2": "²",
      "3": "³",
      "4": "⁴",
      "5": "⁵",
      "6": "⁶",
      "7": "⁷",
      "8": "⁸",
      "9": "⁹",
    };
    const superscriptCount = arg.count
      .toString()
      .split("")
      .map((digit) => superscriptMap[digit] || digit)
      .join("");
    return `${arg.type}${superscriptCount}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">
          PVM Opcodes
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          PolkaVM Instruction Set Reference
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 flex-col sm:flex-row">
        <div className="flex-1 min-w-0">
          <Input
            placeholder="Search opcodes, names, or descriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full search-input"
          />
        </div>

        <div className="flex-shrink-0">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Opcode Table */}
      <Card>
        <CardHeader>
          <CardTitle>OpCode</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b table-header">
                  <th className="text-left p-2 sm:p-3 font-medium text-sm">
                    Opcode
                  </th>
                  <th className="text-left p-2 sm:p-3 font-medium text-sm">
                    Name
                  </th>
                  <th className="text-left p-2 sm:p-3 font-medium text-sm hidden sm:table-cell">
                    Description
                  </th>
                  <th className="text-left p-2 sm:p-3 font-medium text-sm">
                    Arguments
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOpcodes.map((opcode) => (
                  <OpcodeTableItem
                    key={opcode.opcode}
                    opcode={opcode}
                    isExpanded={expandedOpcode === opcode.opcode}
                    onToggle={() => {
                      setExpandedOpcode(
                        expandedOpcode === opcode.opcode ? null : opcode.opcode
                      );
                    }}
                    getArgumentBadgeColor={getArgumentBadgeColor}
                    getArgumentColor={getArgumentColor}
                    getArgumentDescription={getArgumentDescription}
                    getArgumentPlaceholder={getArgumentPlaceholder}
                    formatArgumentType={formatArgumentType}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
