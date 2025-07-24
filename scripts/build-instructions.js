const fs = require("fs");
const path = require("path");
const TOML = require("@iarna/toml");

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

        processedOpcodes.push({
          ...opcode,
          category,
          categoryDescription: categoryData.description,
          argumentTypes,
          hexOpcode: `0x${opcode.opcode
            .toString(16)
            .toUpperCase()
            .padStart(2, "0")}`,
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
