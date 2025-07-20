'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.generateTypes = generateTypes;
exports.config = config;
exports.validateEnv = validateEnv;
exports.createTypedConfig = createTypedConfig;
const fs_1 = __importDefault(require('fs'));
const path_1 = __importDefault(require('path'));
const regex = /^(\w+)\s+(\w+)\s*=\s*(.*)$/i;
const variableNamingRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const findVarType = (line) => line.split(' ')[0];
/**
 * Extracts and validates the key from a line array.
 * @param lineArray - An array of strings representing parts of a line from an environment file.
 * @returns The validated key as a string.
 * @throws Will throw an error if the extracted key does not match the expected variable naming convention.
 */
const findKey = (lineArray) => {
  const rawKey = lineArray[1].split('=')[0].trim();
  if (!variableNamingRegex.test(rawKey)) {
    throw new Error(
      `Invalid variable name '${rawKey}' in line: ${lineArray.join(' ')}`,
    );
  }
  return rawKey;
};
const stripQuotationMarks = (value) => value.replace(/^"|"$/g, '');
const findValue = (line) => line.split('=').slice(1).join('=').trim();
/**
 * Converts a string value to a specified type.
 *
 * @param varType - The type to which the value should be converted. Supported types are:
 *                  'NUMBER', 'STRING', 'BOOL', 'ARRAY', 'OBJ'.
 * @param value - The string representation of the value to be converted.
 * @returns The value converted to the specified type.
 * @throws Will throw an error if the value cannot be converted to the specified type
 *         or if the varType is invalid.
 */
function typeImplication(varType, value) {
  try {
    let returnValue;
    switch (varType) {
      case 'NUMBER':
        const numValue = Number(value);
        if (isNaN(numValue)) throw new Error(`Invalid number value: ${value}`);
        returnValue = numValue;
        break;
      case 'STRING':
        returnValue = stripQuotationMarks(value);
        break;
      case 'BOOL':
        const lowerValue = value.toLowerCase();
        if (!['true', 'false'].includes(lowerValue)) {
          throw new Error(
            `Invalid boolean value: ${value}. Use 'true' or 'false'`,
          );
        }
        returnValue = lowerValue === 'true';
        break;
      case 'ARRAY':
        returnValue = JSON.parse(value);
        if (!Array.isArray(returnValue)) {
          throw new Error(`Value is not an array: ${value}`);
        }
        break;
      case 'OBJ':
        returnValue = JSON.parse(value);
        if (
          Array.isArray(returnValue) ||
          typeof returnValue !== 'object' ||
          returnValue === null
        ) {
          throw new Error(`Value is not an object: ${value}`);
        }
        break;
      default:
        throw new Error(
          `Invalid variable type: ${varType}. Supported types: NUMBER, STRING, BOOL, ARRAY, OBJ`,
        );
    }
    return returnValue;
  } catch (error) {
    // const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(error);
  }
}
/**
 * Parse an environment file and return an array of objects with the key, type and value of each variable.
 * @param envPath The path to the environment file.
 * @returns An array of objects with the key, type and value of each variable.
 */
function parseEnvFile(envPath) {
  if (!fs_1.default.existsSync(envPath)) {
    throw new Error(`Environment file not found: ${envPath}`);
  }
  const file = fs_1.default.readFileSync(envPath, { encoding: 'utf-8' });
  const lines = file.split('\n');
  const envVars = [];
  lines.forEach((line, lineNumber) => {
    const trimmedLine = line.trim();
    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('#')) return;
    // Skip lines that don't match our format
    if (!regex.test(trimmedLine)) {
      console.warn(`Skipping invalid line ${lineNumber + 1}: ${line}`);
      return;
    }
    try {
      const lineArray = trimmedLine.split(' ');
      const varType = findVarType(trimmedLine);
      const key = findKey(lineArray);
      const rawValue = findValue(trimmedLine);
      const value = typeImplication(varType, rawValue);
      // Check for duplicate keys
      if (envVars.some((v) => v.key === key)) {
        console.warn(
          `Duplicate environment variable: ${key}. Using last occurrence.`,
        );
        const existingIndex = envVars.findIndex((v) => v.key === key);
        envVars[existingIndex] = { key, type: varType, value };
      } else {
        envVars.push({ key, type: varType, value });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Error parsing line ${lineNumber + 1}: ${errorMessage}`);
    }
  });
  return envVars;
}
/**
 * Generate TypeScript types for environment variables from a .env file.
 * The generated file contains a single interface with the same name as the
 * interfaceName option, and a type guard function isEnvKey to check if a
 * key exists in the environment config.
 * @param {string} [envPath='.env'] Path to the .env file to generate types from.
 * @param {string} [outputPath='./src/types/env-types.ts'] Path to the file to write the generated types to.
 * @param {object} [options] Options to customize the generated types.
 * @param {string} [options.interfaceName='EnvConfig'] Name of the generated interface.
 * @param {boolean} [options.includeComments=true] Whether to include comments in the generated file.
 * @param {boolean} [options.exportSchema=true] Whether to export the schema as a constant.
 * @returns {void}
 */
function generateTypes(
  envPath = '.env',
  outputPath = './src/types/env-types.ts',
  options = {},
) {
  const {
    interfaceName = 'EnvConfig',
    includeComments = true,
    exportSchema = true,
  } = options;
  try {
    const envVars = parseEnvFile(envPath);
    if (envVars.length === 0) {
      console.warn('No environment variables found in .env file');
      return;
    }
    // Create output directory if it doesn't exist
    const outputDir = path_1.default.dirname(outputPath);
    if (!fs_1.default.existsSync(outputDir)) {
      fs_1.default.mkdirSync(outputDir, { recursive: true });
    }
    // Generate TypeScript interface
    let content = '';
    if (includeComments) {
      content += `/**
 * Auto-generated TypeScript types for environment variables
 * Generated from: ${envPath}
 * Generated at: ${new Date().toISOString()}
 * 
 * DO NOT EDIT THIS FILE MANUALLY
 * Run generateTypes() to regenerate when .env changes
 */

`;
    }
    // Add the main interface
    content += `export interface ${interfaceName} {\n`;
    envVars.forEach(({ key, type }) => {
      const tsType = {
        NUMBER: 'number',
        STRING: 'string',
        BOOL: 'boolean',
        ARRAY: 'any[]',
        OBJ: 'Record<string, any>',
      }[type];
      if (includeComments) {
        content += `  /** Type: ${type} */\n`;
      }
      content += `  ${key}: ${tsType};\n`;
    });
    content += `}\n\n`;
    // Export schema if requested
    if (exportSchema) {
      const schema = envVars.reduce((acc, { key, type }) => {
        acc[key] = type;
        return acc;
      }, {});
      content += `export const envSchema = ${JSON.stringify(schema, null, 2)} as const;\n\n`;
    }
    // Add helper type for runtime validation
    content += `export type EnvKey = keyof ${interfaceName};\n`;
    content += `export type EnvType = ${envVars.map((v) => `'${v.type}'`).join(' | ')};\n\n`;
    // Add utility functions
    content += `// Utility function to get environment variable keys
export const envKeys: EnvKey[] = ${JSON.stringify(envVars.map((v) => v.key))};\n\n`;
    content += `// Type guard to check if a key exists in the environment config
export function isEnvKey(key: string): key is EnvKey {
  return envKeys.includes(key as EnvKey);
}\n`;
    fs_1.default.writeFileSync(outputPath, content);
    console.log(
      `✅ Generated TypeScript types for ${envVars.length} environment variables`,
    );
    console.log(`📁 Output: ${outputPath}`);
    console.log(`🔧 Interface: ${interfaceName}`);
    if (includeComments) {
      console.log('\n📋 Environment Variables:');
      envVars.forEach(({ key, type }) => {
        console.log(`   ${key}: ${type}`);
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error generating types: ${errorMessage}`);
    throw error;
  }
}
/**
 * Parses environment variables from a file and returns them as a typed object.
 * @param options - Options for parsing the environment file.
 * @param options.path - Path to the environment file. Defaults to '.env'.
 * @param options.encoding - Encoding of the environment file. Defaults to 'utf8'.
 * @param options.strict - If true, throws an error if the environment file is missing or invalid. Defaults to false.
 * @returns An object with the parsed environment variables.
 */
function config(options) {
  const envPath =
    (options === null || options === void 0 ? void 0 : options.path) || '.env';
  const strict =
    (options === null || options === void 0 ? void 0 : options.strict) || false;
  try {
    const envVars = parseEnvFile(envPath);
    const parsedENV = envVars.reduce((acc, { key, value }) => {
      acc[key] = value;
      return acc;
    }, {});
    return { parsedEnv: parsedENV };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (strict) {
      throw error;
    } else {
      console.error(`⚠️  Error reading environment file: ${errorMessage}`);
      return { parsedEnv: {} };
    }
  }
}
/**
 * Validates that the environment variables match the specified schema.
 *
 * This function checks if all required keys in the schema are present in the
 * environment and logs an error if any are missing. It also warns about any
 * extra keys in the environment that are not part of the schema.
 *
 * @template T - A type extending Record<string, EnvValue> representing the validated environment.
 * @param {Record<string, EnvValue>} env - The environment variables to validate.
 * @param {Record<string, EnvType>} schema - The schema against which the environment is validated.
 * @returns {boolean} - Returns true if the environment matches the schema; false otherwise.
 */
function validateEnv(env, schema) {
  const schemaKeys = Object.keys(schema);
  const envKeys = Object.keys(env);
  // Check for missing keys
  const missingKeys = schemaKeys.filter((key) => !(key in env));
  if (missingKeys.length > 0) {
    console.error(
      `❌ Missing environment variables: ${missingKeys.join(', ')}`,
    );
    return false;
  }
  // Check for extra keys
  const extraKeys = envKeys.filter((key) => !(key in schema));
  if (extraKeys.length > 0) {
    console.warn(
      `⚠️  Extra environment variables (not in schema): ${extraKeys.join(', ')}`,
    );
  }
  // Type validation would require runtime type checking
  // This is a basic structural validation
  return missingKeys.length === 0;
}
// Utility to create a typed config function
function createTypedConfig() {
  return function (options) {
    return config(options);
  };
}
