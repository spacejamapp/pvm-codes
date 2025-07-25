const fs = require("fs");
const path = require("path");
const TOML = require("@iarna/toml");

// Mutation mapping from TeX specification
const mutationMapping = {
  0x00: "\\varepsilon = \\panic",
  0x01: "", // fallthrough has no mutation
  0x0A: "\\varepsilon = \\host \\times \\immed_X",
  0x14: "\\reg'_A = \\immed_X",
  0x1E: "\\memwr_{\\immed_X} = \\immed_Y \\bmod 2^8",
  0x1F: "\\memwr_{\\immed_X\\dots+2} = \\se_2(\\immed_Y \\bmod 2^{16})",
  0x20: "\\memwr_{\\immed_X\\dots+4} = \\se_4(\\immed_Y \\bmod 2^{32})",
  0x21: "\\memwr_{\\immed_X\\dots+8} = \\se_8(\\immed_Y)",
  0x28: "\\token{branch}(\\immed_X, \\top)",
  0x32: "\\token{djump}((\\reg_A + \\immed_X) \\bmod 2^{32})",
  0x33: "\\reg'_A = \\immed_X",
  0x34: "\\reg'_A = \\memr_{\\immed_X}",
  0x35: "\\reg'_A = \\sext_1(\\memr_{\\immed_X})",
  0x36: "\\reg'_A = \\de_2(\\memr_{\\immed_X\\dots+2})",
  0x37: "\\reg'_A = \\sext_2(\\de_2(\\memr_{\\immed_X\\dots+2}))",
  0x38: "\\reg'_A = \\de_4(\\memr_{\\immed_X\\dots+4})",
  0x39: "\\reg'_A = \\sext_4(\\de_4(\\memr_{\\immed_X\\dots+4}))",
  0x3A: "\\reg'_A = \\de_8(\\memr_{\\immed_X\\dots+8})",
  0x3B: "\\memwr_{\\immed_X} = \\reg_A \\bmod 2^8",
  0x3C: "\\memwr_{\\immed_X\\dots+2} = \\se_2(\\reg_A \\bmod 2^{16})",
  0x3D: "\\memwr_{\\immed_X\\dots+4} = \\se_4(\\reg_A \\bmod 2^{32})",
  0x3E: "\\memwr_{\\immed_X\\dots+8} = \\se_8(\\reg_A)",
  0x46: "\\memwr_{\\reg_A + \\immed_X} = \\immed_Y \\bmod 2^8",
  0x47: "\\memwr_{\\reg_A + \\immed_X \\dots+ 2} = \\se_2(\\immed_Y \\bmod 2^{16})",
  0x48: "\\memwr_{\\reg_A + \\immed_X \\dots+ 4} = \\se_4(\\immed_Y \\bmod 2^{32})",
  0x49: "\\memwr_{\\reg_A + \\immed_X \\dots+ 8} = \\se_8(\\immed_Y)",
  0x50: "\\token{branch}(\\immed_Y, \\top)\\ ,\\qquad \\reg_A' = \\immed_X",
  0x51: "\\token{branch}(\\immed_Y, \\reg_A = \\immed_X)",
  0x52: "\\token{branch}(\\immed_Y, \\reg_A \\ne \\immed_X)",
  0x53: "\\token{branch}(\\immed_Y, \\reg_A < \\immed_X)",
  0x54: "\\token{branch}(\\immed_Y, \\reg_A \\le \\immed_X)",
  0x55: "\\token{branch}(\\immed_Y, \\reg_A \\ge \\immed_X)",
  0x56: "\\token{branch}(\\immed_Y, \\reg_A > \\immed_X)",
  0x57: "\\token{branch}(\\immed_Y, \\signed{\\reg_A} < \\signed{\\immed_X})",
  0x58: "\\token{branch}(\\immed_Y, \\signed{\\reg_A} \\le \\signed{\\immed_X})",
  0x59: "\\token{branch}(\\immed_Y, \\signed{\\reg_A} \\ge \\signed{\\immed_X})",
  0x5A: "\\token{branch}(\\immed_Y, \\signed{\\reg_A} > \\signed{\\immed_X})",
  0x64: "\\reg'_D = \\reg_A",
  0x65: "\\reg'_D \\equiv \\min(x \\in \\N_R): x \\ge h, \\N_{x\\dots+\\reg_A} \\not\\subseteq \\mathbb{V}_{\\memory}, \\N_{x\\dots+\\reg_A} \\subseteq \\mathbb{V}^*_{\\memory'}",
  0x66: "\\displaystyle\\reg'_D = \\sum_{i = 0}^{63}\\bitsfunc{8}(\\reg_A)_i",
  0x67: "\\displaystyle\\reg'_D = \\sum_{i = 0}^{31}\\bitsfunc{4}(\\reg_A \\bmod 2^{32})_i",
  0x68: "\\displaystyle\\reg'_D = \\max(n \\in \\N_{65})\\ \\where \\sum_{i = 0}^{i < n} \\revbitsfunc{8}(\\reg_A)_i = 0",
  0x69: "\\displaystyle\\reg'_D = \\max(n \\in \\N_{33})\\ \\where \\sum_{i = 0}^{i < n} \\revbitsfunc{4}(\\reg_A \\bmod 2^{32})_i = 0",
  0x6A: "\\displaystyle\\reg'_D = \\max(n \\in \\N_{65})\\ \\where \\sum_{i = 0}^{i < n} \\bitsfunc{8}(\\reg_A)_{i} = 0",
  0x6B: "\\displaystyle\\reg'_D = \\max(n \\in \\N_{33})\\ \\where \\sum_{i = 0}^{i < n} \\bitsfunc{4}(\\reg_A \\bmod 2^{32})_{i} = 0",
  0x6C: "\\reg'_D = \\unsigned{\\signedn{1}{\\reg_A \\bmod 2^8}}",
  0x6D: "\\reg'_D = \\unsigned{\\signedn{2}{\\reg_A \\bmod 2^{16}}}",
  0x6E: "\\reg'_D = \\reg_A \\bmod 2^{16}",
  0x6F: "\\forall i \\in \\N_8 : \\se_8(\\reg'_D)_i = \\se_8(\\reg_A)_{7-i}",
  0x78: "\\memwr_{\\reg_B + \\immed_X} = \\reg_A \\bmod 2^8",
  0x79: "\\memwr_{\\reg_B + \\immed_X \\dots+ 2} = \\se_2(\\reg_A \\bmod 2^{16})",
  0x7A: "\\memwr_{\\reg_B + \\immed_X \\dots+ 4} = \\se_4(\\reg_A \\bmod 2^{32})",
  0x7B: "\\memwr_{\\reg_B + \\immed_X \\dots+ 8} = \\se_8(\\reg_A)",
  0x7C: "\\reg'_A = \\memr_{\\reg_B + \\immed_X}",
  0x7D: "\\reg'_A = \\unsigned{\\signedn{1}{\\memr_{\\reg_B + \\immed_X}}}",
  0x7E: "\\reg'_A = \\de_2(\\memr_{\\reg_B + \\immed_X\\dots+2})",
  0x7F: "\\reg'_A = \\unsigned{\\signedn{2}{\\de_2(\\memr_{\\reg_B + \\immed_X\\dots+2})}}",
  0x80: "\\reg'_A = \\de_4(\\memr_{\\reg_B + \\immed_X\\dots+4})",
  0x81: "\\reg'_A = \\unsigned{\\signedn{4}{\\de_4(\\memr_{\\reg_B + \\immed_X\\dots+4})}}",
  0x82: "\\reg'_A = \\de_8(\\memr_{\\reg_B + \\immed_X\\dots+8})",
  0x83: "\\reg'_A = \\sext_4((\\reg_B + \\immed_X) \\bmod 2^{32})",
  0x84: "\\forall i \\in \\N_{64} : \\bits{\\reg'_A}_i = \\bits{\\reg_B}_i \\wedge \\bits{\\immed_X}_i",
  0x85: "\\forall i \\in \\N_{64} : \\bits{\\reg'_A}_i = \\bits{\\reg_B}_i \\oplus \\bits{\\immed_X}_i",
  0x86: "\\forall i \\in \\N_{64} : \\bits{\\reg'_A}_i = \\bits{\\reg_B}_i \\vee \\bits{\\immed_X}_i",
  0x87: "\\reg'_A = \\sext_4((\\reg_B \\cdot \\immed_X) \\bmod 2^{32})",
  0x88: "\\reg'_A = \\reg_B < \\immed_X",
  0x89: "\\reg'_A = \\signed{\\reg_B} < \\signed{\\immed_X}",
  0x8A: "\\reg'_A = \\sext_4((\\reg_B \\cdot 2^{\\immed_X \\bmod 32}) \\bmod 2^{32})",
  0x8B: "\\reg'_A = \\sext_4(\\floor{\\reg_B \\bmod 2^{32} \\div 2^{\\immed_X \\bmod 32}})",
  0x8C: "\\reg'_A = \\unsigned{\\floor{\\signedn{4}{\\reg_B \\bmod 2^{32} } \\div 2^{\\immed_X \\bmod 32}}}",
  0x8D: "\\reg'_A = \\sext_4((\\immed_X + 2^{32} - \\reg_B) \\bmod 2^{32})",
  0x8E: "\\reg'_A = \\reg_B > \\immed_X",
  0x8F: "\\reg'_A = \\signed{\\reg_B} > \\signed{\\immed_X}",
  0x90: "\\reg'_A = \\sext_4((\\immed_X \\cdot 2^{\\reg_B \\bmod 32}) \\bmod 2^{32})",
  0x91: "\\reg'_A = \\sext_4(\\floor{\\immed_X \\bmod 2^{32} \\div 2^{\\reg_B \\bmod 32}})",
  0x92: "\\reg'_A = \\unsigned{\\floor{\\signedn{4}{\\immed_X \\bmod 2^{32}} \\div 2^{\\reg_B \\bmod 32}}}",
  0x93: "\\reg'_A = \\begin{cases} \\immed_X &\\when \\reg_B = 0\\\\ \\reg_A &\\otherwise \\end{cases}",
  0x94: "\\reg'_A = \\begin{cases} \\immed_X &\\when \\reg_B \\ne 0\\\\ \\reg_A &\\otherwise \\end{cases}",
  0x95: "\\reg'_A = (\\reg_B + \\immed_X) \\bmod 2^{64}",
  0x96: "\\reg'_A = (\\reg_B \\cdot \\immed_X) \\bmod 2^{64}",
  0x97: "\\reg'_A = \\sext_8((\\reg_B \\cdot 2^{\\immed_X \\bmod 64}) \\bmod 2^{64})",
  0x98: "\\reg'_A = \\sext_8(\\floor{\\reg_B \\div 2^{\\immed_X \\bmod 64}})",
  0x99: "\\reg'_A = \\unsigned{\\floor{\\signed{\\reg_B} \\div 2^{\\immed_X \\bmod 64}}}",
  0x9A: "\\reg'_A = (\\immed_X + 2^{64} - \\reg_B) \\bmod 2^{64}",
  0x9B: "\\reg'_A = (\\immed_X \\cdot 2^{\\reg_B \\bmod 64}) \\bmod 2^{64}",
  0x9C: "\\reg'_A = \\floor{\\immed_X \\div 2^{\\reg_B \\bmod 64}}",
  0x9D: "\\reg'_A = \\unsigned{\\floor{\\signed{\\immed_X} \\div 2^{\\reg_B \\bmod 64}}}",
  0x9E: "\\forall i \\in \\N_{64} : \\bitsfunc{8}(\\reg'_A)_i = \\bitsfunc{8}(\\reg_B)_{(i + \\immed_X) \\bmod 64}",
  0x9F: "\\forall i \\in \\N_{64} : \\bitsfunc{8}(\\reg'_A)_i = \\bitsfunc{8}(\\immed_X)_{(i + \\reg_B) \\bmod 64}",
  0xA0: "\\reg'_A = \\sext_4(x) \\ \\where x \\in \\N_{2^{32}}, \\forall i \\in \\N_{32} : \\bitsfunc{4}(x)_i = \\bitsfunc{4}(\\reg_B)_{(i + \\immed_X) \\bmod 32}",
  0xA1: "\\reg'_A = \\sext_4(x) \\ \\where x \\in \\N_{2^{32}}, \\forall i \\in \\N_{32} : \\bitsfunc{4}(x)_i = \\bitsfunc{4}(\\immed_X)_{(i + \\reg_B) \\bmod 32}",
  0xAA: "\\token{branch}(\\immed_X, \\reg_A = \\reg_B)",
  0xAB: "\\token{branch}(\\immed_X, \\reg_A \\ne \\reg_B)",
  0xAC: "\\token{branch}(\\immed_X, \\reg_A < \\reg_B)",
  0xAD: "\\token{branch}(\\immed_X, \\signed{\\reg_A} < \\signed{\\reg_B})",
  0xAE: "\\token{branch}(\\immed_X, \\reg_A \\ge \\reg_B)",
  0xAF: "\\token{branch}(\\immed_X, \\signed{\\reg_A} \\ge \\signed{\\reg_B})",
  0xB4: "\\token{djump}((\\reg_B + \\immed_Y) \\bmod 2^{32}) \\ ,\\qquad \\reg_A' = \\immed_X",
  0xBE: "\\reg'_D = \\sext_4((\\reg_A + \\reg_B) \\bmod 2^{32})",
  0xBF: "\\reg'_D = \\sext_4((\\reg_A + 2^{32} - (\\reg_B \\bmod 2^{32})) \\bmod 2^{32})",
  0xC0: "\\reg'_D = \\sext_4((\\reg_A \\cdot \\reg_B) \\bmod 2^{32})",
  0xC1: "\\reg'_D = \\begin{cases} 2^{64} - 1 &\\when \\reg_B \\bmod 2^{32} = 0\\\\ \\sext_4(\\floor{(\\reg_A \\bmod 2^{32}) \\div (\\reg_B \\bmod 2^{32})}) &\\otherwise \\end{cases}",
  0xC2: "\\reg'_D = \\begin{cases} 2^{64} - 1 &\\when b = 0\\\\ \\unsigned{a} &\\when a = -2^{31} \\wedge b = -1\\\\ \\unsigned{\\rtz(a \\div b)} &\\otherwise \\end{cases} \\quad \\where a = \\signedn{4}{\\reg_A \\bmod 2^{32}}, b = \\signedn{4}{\\reg_B \\bmod 2^{32}}",
  0xC3: "\\reg'_D = \\begin{cases} \\sext_4(\\reg_A \\bmod 2^{32}) &\\when \\reg_B \\bmod 2^{32} = 0\\\\ \\sext_4((\\reg_A \\bmod 2^{32}) \\bmod (\\reg_B \\bmod 2^{32})) &\\otherwise \\end{cases}",
  0xC4: "\\reg'_D = \\begin{cases} 0 &\\when a = -2^{31} \\wedge b = -1 \\\\ \\unsigned{\\smod(a, b)} &\\otherwise \\end{cases} \\quad \\where a = \\signedn{4}{\\reg_A \\bmod 2^{32}}, b = \\signedn{4}{\\reg_B \\bmod 2^{32}}",
  0xC5: "\\reg'_D = \\sext_4((\\reg_A \\cdot 2^{\\reg_B \\bmod 32}) \\bmod 2^{32})",
  0xC6: "\\reg'_D = \\sext_4(\\floor{(\\reg_A \\bmod 2^{32}) \\div 2^{\\reg_B \\bmod 32}})",
  0xC7: "\\reg'_D = \\unsigned{\\floor{\\signedn{4}{\\reg_A \\bmod 2^{32}} \\div 2^{\\reg_B \\bmod 32}}}",
  0xC8: "\\reg'_D = (\\reg_A + \\reg_B) \\bmod 2^{64}",
  0xC9: "\\reg'_D = (\\reg_A + 2^{64} - \\reg_B) \\bmod 2^{64}",
  0xCA: "\\reg'_D = (\\reg_A \\cdot \\reg_B) \\bmod 2^{64}",
  0xCB: "\\reg'_D = \\begin{cases} 2^{64} - 1 &\\when \\reg_B = 0\\\\ \\floor{\\reg_A \\div \\reg_B} &\\otherwise \\end{cases}",
  0xCC: "\\reg'_D = \\begin{cases} 2^{64} - 1 &\\when \\reg_B = 0\\\\ \\reg_A &\\when \\signed{\\reg_A} = -2^{63} \\wedge \\signed{\\reg_B} = -1\\\\ \\unsigned{\\rtz(\\signed{\\reg_A} \\div \\signed{\\reg_B})} &\\otherwise \\end{cases}",
  0xCD: "\\reg'_D = \\begin{cases} \\reg_A &\\when \\reg_B = 0\\\\ \\reg_A \\bmod \\reg_B &\\otherwise \\end{cases}",
  0xCE: "\\reg'_D = \\begin{cases} 0 &\\when \\signed{\\reg_A} = -2^{63} \\wedge \\signed{\\reg_B} = -1\\\\ \\unsigned{\\smod(\\signed{\\reg_A}, \\signed{\\reg_B})} &\\otherwise \\end{cases}",
  0xCF: "\\reg'_D = (\\reg_A \\cdot 2^{\\reg_B \\bmod 64}) \\bmod 2^{64}",
  0xD0: "\\reg'_D = \\floor{\\reg_A \\div 2^{\\reg_B \\bmod 64}}",
  0xD1: "\\reg'_D = \\unsigned{\\floor{\\signed{\\reg_A} \\div 2^{\\reg_B \\bmod 64}}}",
  0xD2: "\\forall i \\in \\N_{64} : \\bits{\\reg'_D}_i = \\bits{\\reg_A}_i \\wedge \\bits{\\reg_B}_i",
  0xD3: "\\forall i \\in \\N_{64} : \\bits{\\reg'_D}_i = \\bits{\\reg_A}_i \\oplus \\bits{\\reg_B}_i",
  0xD4: "\\forall i \\in \\N_{64} : \\bits{\\reg'_D}_i = \\bits{\\reg_A}_i \\vee \\bits{\\reg_B}_i",
  0xD5: "\\reg'_D = \\unsigned{\\floor{(\\signed{\\reg_A} \\cdot \\signed{\\reg_B}) \\div 2^{64}}}",
  0xD6: "\\reg'_D = \\floor{(\\reg_A \\cdot \\reg_B) \\div 2^{64}}",
  0xD7: "\\reg'_D = \\unsigned{\\floor{(\\signed{\\reg_A} \\cdot \\reg_B) \\div 2^{64}}}",
  0xD8: "\\reg'_D = \\reg_A < \\reg_B",
  0xD9: "\\reg'_D = \\signed{\\reg_A} < \\signed{\\reg_B}",
  0xDA: "\\reg'_D = \\begin{cases} \\reg_A &\\when \\reg_B = 0\\\\ \\reg_D &\\otherwise \\end{cases}",
  0xDB: "\\reg'_D = \\begin{cases} \\reg_A &\\when \\reg_B \\ne 0\\\\ \\reg_D &\\otherwise \\end{cases}",
  0xDC: "\\forall i \\in \\N_{64} : \\bitsfunc{8}(\\reg'_D)_{(i + \\reg_B) \\bmod 64} = \\bitsfunc{8}(\\reg_A)_i",
  0xDD: "\\reg'_D = \\sext_4(x)\\ \\where x \\in \\N_{2^{32}}, \\forall i \\in \\N_{32} : \\bitsfunc{4}(x)_{(i + \\reg_B) \\bmod 32} = \\bitsfunc{4}(\\reg_A)_i",
  0xDE: "\\forall i \\in \\N_{64} : \\bitsfunc{8}(\\reg'_D)_i = \\bitsfunc{8}(\\reg_A)_{(i + \\reg_B) \\bmod 64}",
  0xDF: "\\reg'_D = \\sext_4(x)\\ \\where x \\in \\N_{2^{32}}, \\forall i \\in \\N_{32} : \\bitsfunc{4}(x)_i = \\bitsfunc{4}(\\reg_A)_{(i + \\reg_B) \\bmod 32}",
  0xE0: "\\forall i \\in \\N_{64} : \\bits{\\reg'_D}_i = \\bits{\\reg_A}_i \\wedge \\lnot \\bits{\\reg_B}_i",
  0xE1: "\\forall i \\in \\N_{64} : \\bits{\\reg'_D}_i = \\bits{\\reg_A}_i \\vee \\lnot \\bits{\\reg_B}_i",
  0xE2: "\\forall i \\in \\N_{64} : \\bits{\\reg'_D}_i = \\lnot ( \\bits{\\reg_A}_i \\oplus \\bits{\\reg_B}_i )",
  0xE3: "\\reg'_D = \\unsigned{\\max ( \\signed{\\reg_A}, \\signed{\\reg_B} )}",
  0xE4: "\\reg'_D = \\max ( \\reg_A, \\reg_B )",
  0xE5: "\\reg'_D = \\unsigned{\\min ( \\signed{\\reg_A}, \\signed{\\reg_B} )}",
  0xE6: "\\reg'_D = \\min ( \\reg_A, \\reg_B )"
};

// Input and output directories
const inputDir = path.join(__dirname, "..", "instr");
const outputDir = path.join(__dirname, "..", "public", "instr");

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function processInstructionFile(filePath, outputPath) {
  try {
    // Read and parse TOML file
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const instructionSet = TOML.parse(fileContent);

    const processedOpcodes = [];

    Object.entries(instructionSet).forEach(([category, categoryData]) => {
      categoryData.opcodes.forEach((opcode) => {
        const argumentTypes = [];

        // Build argument type array with count information
        if (categoryData.register > 0) {
          argumentTypes.push({
            type: "register",
            count: categoryData.register
          });
        }
        if (categoryData.immediate > 0) {
          argumentTypes.push({
            type: "immediate", 
            count: categoryData.immediate
          });
        }
        if (categoryData.offset > 0) {
          argumentTypes.push({
            type: "offset",
            count: categoryData.offset
          });
        }
        if (categoryData["extended-immediate"] > 0) {
          argumentTypes.push({
            type: "extended-immediate",
            count: categoryData["extended-immediate"]
          });
        }

        const mutations = mutationMapping[opcode.opcode] || null;
        
        processedOpcodes.push({
          ...opcode,
          category,
          categoryDescription: categoryData.description,
          argumentTypes,
          hexOpcode: `0x${opcode.opcode
            .toString(16)
            .toUpperCase()
            .padStart(2, "0")}`,
          mutations,
        });
      });
    });

    // Sort by opcode value
    processedOpcodes.sort((a, b) => a.opcode - b.opcode);

    // Write JSON file
    fs.writeFileSync(outputPath, JSON.stringify(processedOpcodes, null, 2));

    return processedOpcodes.length;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

function buildAllInstructions() {
  try {
    // Find all v*.toml files in the input directory
    const files = fs.readdirSync(inputDir);
    const tomlFiles = files.filter((file) => file.match(/^v.*\.toml$/));

    if (tomlFiles.length === 0) {
      console.log("⚠️  No v*.toml files found in instr/ directory");
      return;
    }

    console.log(
      `🔍 Found ${tomlFiles.length} instruction file(s): ${tomlFiles.join(
        ", "
      )}`
    );

    let totalInstructions = 0;
    const processedVersions = [];

    tomlFiles.forEach((file) => {
      const inputPath = path.join(inputDir, file);
      const outputFile = file.replace(".toml", ".json");
      const outputPath = path.join(outputDir, outputFile);

      console.log(`📝 Processing ${file}...`);
      const instructionCount = processInstructionFile(inputPath, outputPath);

      if (instructionCount > 0) {
        totalInstructions += instructionCount;
        const version = file.replace(/^v(.*)\.toml$/, "$1");
        processedVersions.push({
          version,
          file: outputFile,
          count: instructionCount,
        });
        console.log(`  ✅ ${instructionCount} instructions → ${outputFile}`);
      }
    });

    // Create a versions manifest file
    const manifestPath = path.join(outputDir, "versions.json");
    fs.writeFileSync(
      manifestPath,
      JSON.stringify(
        {
          versions: processedVersions,
          lastUpdated: new Date().toISOString(),
        },
        null,
        2
      )
    );

    console.log(
      `\n🎉 Successfully processed ${processedVersions.length} version(s)`
    );
    console.log(`📊 Total instructions: ${totalInstructions}`);
    console.log(`📄 Output directory: ${outputDir}`);
    console.log(`📄 Versions manifest: ${manifestPath}`);
  } catch (error) {
    console.error("❌ Error building instructions:", error);
    process.exit(1);
  }
}

// Run the conversion
buildAllInstructions();
