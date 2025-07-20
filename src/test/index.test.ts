import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import {
  config,
  generateTypes,
  validateEnv,
  createTypedConfig,
  EnvType,
  EnvValue,
} from '../index';

// Mock fs module
vi.mock('fs');
const mockedFs = vi.mocked(fs);

describe('ENV Parser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('config() - Basic functionality', () => {
    it('should parse a valid .env file with all data types', () => {
      const envContent = `NUMBER AGE=25
STRING NAME="Ali Barznji"
BOOL IS_OLD_ENOUGH=true
ARRAY EXPERIENCE=[{"test": false, "test1":true}, {"test": false, "test1":true}]
OBJ EXTRA={"test": ["Test0", "test0"], "test1":["Test", "test"]}`;

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(envContent);

      const { parsedEnv } = config();

      expect(parsedEnv).toEqual({
        AGE: 25,
        NAME: 'Ali Barznji',
        IS_OLD_ENOUGH: true,
        EXPERIENCE: [
          { test: false, test1: true },
          { test: false, test1: true },
        ],
        EXTRA: { test: ['Test0', 'test0'], test1: ['Test', 'test'] },
      });
    });

    it('should handle empty lines and comments', () => {
      const envContent = `# This is a comment
NUMBER AGE=25

# Another comment
STRING NAME="Test"

# Empty lines above should be ignored`;

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(envContent);

      const { parsedEnv } = config();

      expect(parsedEnv).toEqual({
        AGE: 25,
        NAME: 'Test',
      });
    });

    it('should skip invalid lines and warn about them', () => {
      const envContent = `NUMBER AGE=25
INVALID LINE WITHOUT EQUALS
STRING NAME="Test"
ANOTHER_INVALID_LINE`;

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(envContent);

      const { parsedEnv } = config();

      expect(parsedEnv).toEqual({
        AGE: 25,
        NAME: 'Test',
      });
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Skipping invalid line'),
      );
    });

    it('should handle custom file path and encoding', () => {
      const envContent = 'STRING TEST="value"';

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(envContent);

      config({ path: '.env.test', encoding: 'utf8' });

      expect(mockedFs.readFileSync).toHaveBeenCalledWith('.env.test', {
        encoding: 'utf-8',
      });
    });
  });

  describe('Type parsing', () => {
    describe('NUMBER type', () => {
      it('should parse valid numbers', () => {
        const envContent = `NUMBER INT_VAL=42
NUMBER FLOAT_VAL=3.14
NUMBER NEGATIVE=-10`;

        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readFileSync.mockReturnValue(envContent);

        const { parsedEnv } = config();

        expect(parsedEnv).toEqual({
          INT_VAL: 42,
          FLOAT_VAL: 3.14,
          NEGATIVE: -10,
        });
      });

      it('should throw error for invalid numbers', () => {
        const envContent = 'NUMBER INVALID=not_a_number';

        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readFileSync.mockReturnValue(envContent);

        expect(() => config({ strict: true })).toThrowError();
      });
    });

    describe('STRING type', () => {
      it('should parse strings with and without quotes', () => {
        const envContent = `STRING QUOTED="Hello World"
STRING UNQUOTED=Hello World`;

        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readFileSync.mockReturnValue(envContent);

        const { parsedEnv } = config();

        expect(parsedEnv).toEqual({
          QUOTED: 'Hello World',
          UNQUOTED: 'Hello World',
        });
      });

      it('should handle strings with equals signs in value', () => {
        const envContent = 'STRING URL="https://example.com?param=value"';

        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readFileSync.mockReturnValue(envContent);

        const { parsedEnv }: { parsedEnv: { URL: string } } = config();
        expect(parsedEnv.URL).toBe('https://example.com?param=value');
      });
    });

    describe('BOOL type', () => {
      it('should parse boolean values correctly', () => {
        const envContent = `BOOL TRUE_VAL=true
BOOL FALSE_VAL=false
BOOL TRUE_UPPER=TRUE
BOOL FALSE_UPPER=FALSE`;

        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readFileSync.mockReturnValue(envContent);

        const { parsedEnv } = config();

        expect(parsedEnv).toEqual({
          TRUE_VAL: true,
          FALSE_VAL: false,
          TRUE_UPPER: true,
          FALSE_UPPER: false,
        });
      });

      it('should throw error for invalid boolean values', () => {
        const envContent = 'BOOL INVALID=yes';

        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readFileSync.mockReturnValue(envContent);

        expect(() => config({ strict: true })).toThrowError();
      });
    });

    describe('ARRAY type', () => {
      it('should parse valid JSON arrays', () => {
        const envContent = `ARRAY SIMPLE=[1,2,3]
ARRAY COMPLEX=[{"name":"John","age":30},{"name":"Jane","age":25}]`;

        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readFileSync.mockReturnValue(envContent);

        const { parsedEnv } = config();

        expect(parsedEnv).toEqual({
          SIMPLE: [1, 2, 3],
          COMPLEX: [
            { name: 'John', age: 30 },
            { name: 'Jane', age: 25 },
          ],
        });
      });

      it('should throw error for invalid JSON arrays', () => {
        const envContent = 'ARRAY INVALID=[invalid json}';

        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readFileSync.mockReturnValue(envContent);

        expect(() => config({ strict: true })).toThrowError();
      });

      it('should throw error when value is not an array', () => {
        const envContent = 'ARRAY NOT_ARRAY={"key": "value"}';

        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readFileSync.mockReturnValue(envContent);

        expect(() => config({ strict: true })).toThrowError();
      });
    });

    describe('OBJ type', () => {
      it('should parse valid JSON objects', () => {
        const envContent =
          'OBJ CONFIG={"database":{"host":"localhost","port":5432},"debug":true}';

        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readFileSync.mockReturnValue(envContent);

        const { parsedEnv }: { parsedEnv: { CONFIG: Record<string, any> } } =
          config();
        expect(parsedEnv.CONFIG).toEqual({
          database: { host: 'localhost', port: 5432 },
          debug: true,
        });
      });

      it('should throw error for invalid JSON objects', () => {
        const envContent = 'OBJ INVALID={invalid json';

        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readFileSync.mockReturnValue(envContent);

        expect(() => config({ strict: true })).toThrowError();
      });

      it('should throw error when value is an array', () => {
        const envContent = 'OBJ NOT_OBJECT=[1,2,3]';

        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readFileSync.mockReturnValue(envContent);

        expect(() => config({ strict: true })).toThrowError();
      });
    });

    it('should throw error for unsupported variable types', () => {
      const envContent = 'UNSUPPORTED_TYPE VAR=value';

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(envContent);

      expect(() => config({ strict: true })).toThrowError();
    });
  });

  describe('Variable name validation', () => {
    it('should accept valid variable names', () => {
      const envContent = `STRING validName=test
STRING _underscoreStart=test
STRING name123=test
STRING UPPER_CASE=test`;

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(envContent);

      const { parsedEnv }: { parsedEnv: Record<string, string> } = config();

      expect(Object.keys(parsedEnv)).toEqual([
        'validName',
        '_underscoreStart',
        'name123',
        'UPPER_CASE',
      ]);
    });

    it('should throw error for invalid variable names', () => {
      const envContent = 'STRING 123invalid=test';

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(envContent);

      expect(() => config({ strict: true })).toThrowError();
    });
  });

  describe('Error handling', () => {
    it('should handle missing .env file gracefully in non-strict mode', () => {
      mockedFs.existsSync.mockReturnValue(false);

      const { parsedEnv } = config();

      expect(parsedEnv).toEqual({});
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error reading environment file'),
      );
    });

    it('should throw error for missing .env file in strict mode', () => {
      mockedFs.existsSync.mockReturnValue(false);

      expect(() => config({ strict: true })).toThrowError();
    });

    it('should handle duplicate variable names', () => {
      const envContent = `STRING NAME=First
STRING NAME=Second`;

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(envContent);

      const { parsedEnv }: { parsedEnv: { NAME: string } } = config();

      expect(parsedEnv.NAME).toBe('Second');
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Duplicate environment variable: NAME'),
      );
    });
  });

  describe('generateTypes()', () => {
    beforeEach(() => {
      mockedFs.writeFileSync.mockImplementation(() => {});
      mockedFs.mkdirSync.mockImplementation(() => '');
    });

    it('should generate correct TypeScript interface', () => {
      const envContent = `NUMBER AGE=25
STRING NAME="Ali"
BOOL ACTIVE=true
ARRAY TAGS=["tag1","tag2"]
OBJ CONFIG={"key":"value"}`;

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(envContent);

      generateTypes('.env', './env-types.ts');

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        './env-types.ts',
        expect.stringContaining('export interface EnvConfig {'),
      );

      const writeCall = mockedFs.writeFileSync.mock.calls[0];
      const generatedContent = writeCall[1] as string;

      expect(generatedContent).toContain('AGE: number;');
      expect(generatedContent).toContain('NAME: string;');
      expect(generatedContent).toContain('ACTIVE: boolean;');
      expect(generatedContent).toContain('TAGS: any[];');
      expect(generatedContent).toContain('CONFIG: Record<string, any>;');
    });

    it('should generate custom interface name and options', () => {
      const envContent = 'STRING TEST=value';

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(envContent);

      generateTypes('.env', './types.ts', {
        interfaceName: 'MyConfig',
        includeComments: false,
        exportSchema: false,
      });

      const writeCall = mockedFs.writeFileSync.mock.calls[0];
      const generatedContent = writeCall[1] as string;

      expect(generatedContent).toContain('export interface MyConfig {');
      expect(generatedContent).not.toContain('/** Type: STRING */');
      expect(generatedContent).not.toContain('export const envSchema');
    });

    it('should create output directory if it does not exist', () => {
      const envContent = 'STRING TEST=value';

      mockedFs.existsSync.mockReturnValueOnce(true); // .env exists
      mockedFs.existsSync.mockReturnValueOnce(false); // output dir doesn't exist
      mockedFs.readFileSync.mockReturnValue(envContent);

      generateTypes('.env', './nested/dir/types.ts');

      expect(mockedFs.mkdirSync).toHaveBeenCalledWith('./nested/dir', {
        recursive: true,
      });
    });

    it('should handle empty .env file', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue('# Only comments\n\n');

      generateTypes();

      expect(console.warn).toHaveBeenCalledWith(
        'No environment variables found in .env file',
      );
      expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should throw error if .env file does not exist', () => {
      mockedFs.existsSync.mockReturnValue(false);

      expect(() => generateTypes()).toThrowError();
    });
  });

  describe('validateEnv()', () => {
    it('should return true for valid environment matching schema', () => {
      const env = { AGE: 25, NAME: 'Ali' };
      const schema = { AGE: 'NUMBER' as EnvType, NAME: 'STRING' as EnvType };

      const isValid = validateEnv(env, schema);

      expect(isValid).toBe(true);
    });

    it('should return false and log error for missing required variables', () => {
      const env = { AGE: 25 };
      const schema = { AGE: 'NUMBER' as EnvType, NAME: 'STRING' as EnvType };

      const isValid = validateEnv(env, schema);

      expect(isValid).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Missing environment variables: NAME'),
      );
    });

    it('should warn about extra variables not in schema', () => {
      const env = { AGE: 25, NAME: 'Ali', EXTRA: 'value' };
      const schema = { AGE: 'NUMBER' as EnvType, NAME: 'STRING' as EnvType };

      const isValid = validateEnv(env, schema);

      expect(isValid).toBe(true);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Extra environment variables (not in schema): EXTRA',
        ),
      );
    });
  });

  describe('createTypedConfig()', () => {
    it('should create a typed config function', () => {
      const envContent = 'STRING TEST=value';

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(envContent);

      interface TestConfig {
        TEST: string;
      }

      const getTypedConfig = createTypedConfig<TestConfig>();
      const { parsedEnv } = getTypedConfig();

      // This test mainly verifies the function works
      // Type checking would be done by TypeScript compiler
      expect(parsedEnv).toEqual({ TEST: 'value' });
    });
  });

  describe('Integration tests', () => {
    it('should handle complex real-world .env file', () => {
      const envContent = `# Database configuration
NUMBER DB_PORT=5432
STRING DB_HOST="localhost"
STRING DB_NAME="myapp"
BOOL DB_SSL=true

# API Configuration  
STRING API_KEY="sk-1234567890abcdef"
NUMBER API_TIMEOUT=30000
ARRAY CORS_ORIGINS=["http://localhost:3000","https://myapp.com"]

# Feature flags
BOOL ENABLE_LOGGING=true
BOOL ENABLE_METRICS=false
OBJ FEATURE_CONFIG={"newUI":true,"betaFeatures":false,"maxUsers":1000}

# Empty line and comment at end
# This should be ignored`;

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(envContent);

      const { parsedEnv } = config();

      expect(parsedEnv).toEqual({
        DB_PORT: 5432,
        DB_HOST: 'localhost',
        DB_NAME: 'myapp',
        DB_SSL: true,
        API_KEY: 'sk-1234567890abcdef',
        API_TIMEOUT: 30000,
        CORS_ORIGINS: ['http://localhost:3000', 'https://myapp.com'],
        ENABLE_LOGGING: true,
        ENABLE_METRICS: false,
        FEATURE_CONFIG: { newUI: true, betaFeatures: false, maxUsers: 1000 },
      });
    });

    it('should generate types and validate successfully', () => {
      const envContent = `NUMBER PORT=3000
STRING HOST="localhost"
BOOL DEBUG=true`;

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(envContent);

      // Generate types
      generateTypes();

      // Parse environment
      const { parsedEnv }: { parsedEnv: Record<string, EnvValue> } = config();

      // Mock schema that would be generated
      const schema = {
        PORT: 'NUMBER' as EnvType,
        HOST: 'STRING' as EnvType,
        DEBUG: 'BOOL' as EnvType,
      };

      // Validate
      const isValid = validateEnv(parsedEnv, schema);

      expect(isValid).toBe(true);
      expect(parsedEnv).toEqual({
        PORT: 3000,
        HOST: 'localhost',
        DEBUG: true,
      });
    });
  });
});
