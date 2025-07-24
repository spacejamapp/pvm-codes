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
          {/* Basic Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Type
              </div>
              <span className="text-sm">{opcode.categoryDescription}</span>
            </div>
          </div>

          {/* Arguments Details */}
          {opcode.argumentTypes.length > 0 && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Arguments ({opcode.argumentTypes.length})
              </div>
              <div className="grid gap-2">
                {opcode.argumentTypes.map((argType, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 bg-background rounded border"
                  >
                    <div className="bg-muted px-2 py-1 rounded text-xs font-medium w-6 text-center">
                      {index + 1}
                    </div>
                    <div
                      className={`font-medium ${getArgumentColor(
                        argType.type
                      )} min-w-24`}
                    >
                      {formatArgumentType(argType)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getArgumentDescription(argType.type)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Usage Example */}
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">
              Usage
            </div>
            <div className="bg-muted p-3 rounded font-mono text-sm border">
              {opcode.name}
              {opcode.argumentTypes.length > 0 && (
                <span className="text-muted-foreground">
                  {" "}
                  {opcode.argumentTypes.map((argType, index) => (
                    <span
                      key={index}
                      className={getArgumentColor(argType.type)}
                    >
                      {Array.from(
                        { length: argType.count },
                        (_, i) =>
                          getArgumentPlaceholder(argType.type) +
                          (i > 0 ? (i + 1).toString() : "")
                      ).join(", ")}
                      {index < opcode.argumentTypes.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </span>
              )}
            </div>
          </div>
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
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800";
      case "immediate":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800";
      case "offset":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800";
      case "extended-immediate":
        return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800";
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
    return `${arg.type} ^ ${arg.count}`;
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
