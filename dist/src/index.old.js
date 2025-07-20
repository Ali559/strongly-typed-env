'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.config = config;
const fs_1 = __importDefault(require('fs'));
// new ENV variable example: NUMBER AGE=25
const regex = /^(\w+)\s+(\w+)\s=\s(.)$/i;
const variableNamingRegex = /[a-zA-Z][a-zA-Z0-9]/;
const findVarType = (line) => line.split(' ')[0];
const findKey = (lineArray) => {
  const rawKey = lineArray[1].split('=')[0];
  if (!variableNamingRegex.test(rawKey))
    throw new Error('Invalid variable name ' + rawKey + 'in' + lineArray);
  return rawKey;
};
const stripQuotationMarks = (value) => value.replace(/"/g, '');
const findValue = (line) => line.split('=')[1];
function typeImplication(varType, value) {
  try {
    let returnValue;
    switch (varType) {
      case 'NUMBER':
        returnValue = Number(value);
        break;
      case 'STRING':
        returnValue = stripQuotationMarks(value);
        break;
      case 'BOOL':
        returnValue = Boolean(value);
        break;
      case 'ARRAY':
        returnValue = JSON.parse(value);
        break;
      case 'OBJ':
        returnValue = JSON.parse(value);
        break;
      default:
        throw new Error('Invalid variable type ' + varType);
    }
    return returnValue;
  } catch (error) {
    throw new Error(
      (error === null || error === void 0 ? void 0 : error.message) || error,
    );
  }
}
function config(options) {
  const file = fs_1.default.readFileSync(
    (options === null || options === void 0 ? void 0 : options.path) || '.env',
    {
      encoding:
        (options === null || options === void 0 ? void 0 : options.encoding) ||
        'utf-8',
    },
  );
  if (!file) console.error('.env file not found');
  const parsedENV = {};
  const lines = file.split('\n');
  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('#')) return;
    if (!regex.test(trimmedLine)) return;
    const lineArray = trimmedLine.split(' ');
    const varType = findVarType(trimmedLine);
    const key = findKey(lineArray);
    const value = findValue(trimmedLine);
    parsedENV[key] = typeImplication(varType, value);
  });
  return { parsedEnv: parsedENV };
}
config();
