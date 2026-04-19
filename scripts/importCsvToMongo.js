const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { parse } = require("csv-parse/sync");
const { MongoClient } = require("mongodb");

dotenv.config();

function resolveConfigPath(inputPath) {
  if (!inputPath) {
    throw new Error("Provide a config path. Example: node scripts/importCsvToMongo.js data/import-config.example.json");
  }

  return path.isAbsolute(inputPath)
    ? inputPath
    : path.join(process.cwd(), inputPath);
}

function parseValue(value, type) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  switch (type) {
    case "number":
      return Number(value);
    case "date":
      return new Date(value);
    case "boolean":
      return String(value).toLowerCase() === "true";
    default:
      return value;
  }
}

function transformRecord(record, fieldTypes = {}) {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, parseValue(value, fieldTypes[key])])
  );
}

async function importCollection(db, entry, rootDir) {
  const filePath = path.isAbsolute(entry.file)
    ? entry.file
    : path.join(rootDir, entry.file);
  const csvContent = fs.readFileSync(filePath, "utf8");
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  const transformedRecords = records.map((record) =>
    transformRecord(record, entry.fieldTypes)
  );
  const collection = db.collection(entry.collection);

  if (entry.clearExisting) {
    await collection.deleteMany({});
  }

  if (transformedRecords.length) {
    await collection.insertMany(transformedRecords);
  }

  console.log(
    `Imported ${transformedRecords.length} rows into "${entry.collection}" from ${filePath}`
  );
}

async function main() {
  const configPath = resolveConfigPath(process.argv[2]);
  const configDir = path.dirname(configPath);
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

  if (!process.env.MONGODB_URI || !process.env.MONGODB_DB) {
    throw new Error("Set MONGODB_URI and MONGODB_DB in your .env file before importing.");
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);

    for (const entry of config.imports) {
      await importCollection(db, entry, configDir);
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
