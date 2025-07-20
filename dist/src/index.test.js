'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const fs_1 = __importDefault(require('fs'));
const index_1 = require('./index');
// Mock fs module
vitest_1.vi.mock('fs');
const mockedFs = vitest_1.vi.mocked(fs_1.default);
(0, vitest_1.describe)('ENV Parser', () => {
  (0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
    // Reset console methods
    vitest_1.vi.spyOn(console, 'log').mockImplementation(() => {});
    vitest_1.vi.spyOn(console, 'warn').mockImplementation(() => {});
    vitest_1.vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  (0, vitest_1.afterEach)(() => {
    vitest_1.vi.restoreAllMocks();
  });
  (0, vitest_1.describe)('config() - Basic functionality', () => {
    (0, vitest_1.it)(
      'should parse a valid .env file with all data types',
      () => {
        const envContent = `NUMBER AGE=25
STRING NAME="Ali Barznji"
BOOL IS_OLD_ENOUGH=true
ARRAY EXPERIENCE=[{"test": false, "test1":true}, {"test": false, "test1":true}]
OBJ EXTRA={"test": ["Test0", "test0"], "test1":["Test", "test"]}`;
        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readFileSync.mockReturnValue(envContent);
        const { parsedEnv } = (0, index_1.config)();
        (0, vitest_1.expect)(parsedEnv).toEqual({
          AGE: 25,
          NAME: 'Ali Barznji',
          IS_OLD_ENOUGH: true,
          EXPERIENCE: [
            { test: false, test1: true },
            { test: false, test1: true },
          ],
          EXTRA: { test: ['Test0', 'test0'], test1: ['Test', 'test'] },
        });
      },
    );
    (0, vitest_1.it)('should handle empty lines and comments', () => {
      const envContent = `# This is a comment
NUMBER AGE=25

# Another comment
STRING NAME="Test"

# Empty lines above should be ignored`;
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(envContent);
      const { parsedEnv } = (0, index_1.config)();
      (0, vitest_1.expect)(parsedEnv).toEqual({
        AGE: 25,
        NAME: 'Test',
      });
    });
    (0, vitest_1.it)('should skip invalid lines and warn about them', () => {
      const envContent = `NUMBER AGE=25
INVALID LINE WITHOUT EQUALS
STRING NAME="Test"
ANOTHER_INVALID_LINE`;
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(envContent);
      const { parsedEnv } = (0, index_1.config)();
      (0, vitest_1.expect)(parsedEnv).toEqual({
        AGE: 25,
        NAME: 'Test',
      });
      (0, vitest_1.expect)(console.warn).toHaveBeenCalledWith(
        vitest_1.expect.stringContaining('Skipping invalid line'),
      );
    });
    (0, vitest_1.it)('should handle custom file path and encoding', () => {
      const envContent = 'STRING TEST="value"';
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(envContent);
      (0, index_1.config)({ path: '.env.test', encoding: 'utf8' });
      (0, vitest_1.expect)(mockedFs.readFileSync).toHaveBeenCalledWith(
        '.env.test',
        { encoding: 'utf-8' },
      );
    });
  });
  (0, vitest_1.describe)('Type parsing', () => {
    (0, vitest_1.describe)('NUMBER type', () => {
      (0, vitest_1.it)('should parse valid numbers', () => {
        const envContent = `NUMBER INT_VAL=42
NUMBER FLOAT_VAL=3.14
NUMBER NEGATIVE=-10`;
        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readFileSync.mockReturnValue(envContent);
        const { parsedEnv } = (0, index_1.config)();
        (0, vitest_1.expect)(parsedEnv).toEqual({
          INT_VAL: 42,
          FLOAT_VAL: 3.14,
          NEGATIVE: -10,
        });
      });
      (0, vitest_1.it)('should throw error for invalid numbers', () => {
        const envContent = 'NUMBER INVALID=not_a_number';
        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readFileSync.mockReturnValue(envContent);
        (0, vitest_1.expect)(() =>
          (0, index_1.config)({ strict: true }),
        ).toThrowError();
      });
    });
    (0, vitest_1.describe)('STRING type', () => {
      (0, vitest_1.it)('should parse strings with and without quotes', () => {
        const envContent = `STRING QUOTED="Hello World"
STRING UNQUOTED=Hello World`;
        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readFileSync.mockReturnValue(envContent);
        const { parsedEnv } = (0, index_1.config)();
        (0, vitest_1.expect)(parsedEnv).toEqual({
          QUOTED: 'Hello World',
          UNQUOTED: 'Hello World',
        });
      });
      (0, vitest_1.it)(
        'should handle strings with equals signs in value',
        () => {
          const envContent = 'STRING URL="https://example.com?param=value"';
          mockedFs.existsSync.mockReturnValue(true);
          mockedFs.readFileSync.mockReturnValue(envContent);
          const { parsedEnv } = (0, index_1.config)();
          (0, vitest_1.expect)(parsedEnv.URL).toBe(
            'https://example.com?param=value',
          );
        },
      );
    });
    (0, vitest_1.describe)('BOOL type', () => {
      (0, vitest_1.it)('should parse boolean values correctly', () => {
        const envContent = `BOOL TRUE_VAL=true
BOOL FALSE_VAL=false
BOOL TRUE_UPPER=TRUE
BOOL FALSE_UPPER=FALSE`;
        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readFileSync.mockReturnValue(envContent);
        const { parsedEnv } = (0, index_1.config)();
        (0, vitest_1.expect)(parsedEnv).toEqual({
          TRUE_VAL: true,
          FALSE_VAL: false,
          TRUE_UPPER: true,
          FALSE_UPPER: false,
        });
      });
      (0, vitest_1.it)('should throw error for invalid boolean values', () => {
        const envContent = 'BOOL INVALID=yes';
        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readFileSync.mockReturnValue(envContent);
        (0, vitest_1.expect)(() =>
          (0, index_1.config)({ strict: true }),
        ).toThrowError();
      });
    });
    (0, vitest_1.describe)('ARRAY type', () => {
      (0, vitest_1.it)('should parse valid JSON arrays', () => {
        const envContent = `ARRAY SIMPLE=[1,2,3]
ARRAY COMPLEX=[{"name":"John","age":30},{"name":"Jane","age":25}]`;
        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readFileSync.mockReturnValue(envContent);
        const { parsedEnv } = (0, index_1.config)();
        (0, vitest_1.expect)(parsedEnv).toEqual({
          SIMPLE: [1, 2, 3],
          COMPLEX: [
            { name: 'John', age: 30 },
            { name: 'Jane', age: 25 },
          ],
        });
      });
      (0, vitest_1.it)('should throw error for invalid JSON arrays', () => {
        const envContent = 'ARRAY INVALID=[invalid json}';
        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readFileSync.mockReturnValue(envContent);
        (0, vitest_1.expect)(() =>
          (0, index_1.config)({ strict: true }),
        ).toThrowError();
      });
      (0, vitest_1.it)('should throw error when value is not an array', () => {
        const envContent = 'ARRAY NOT_ARRAY={"key": "value"}';
        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readFileSync.mockReturnValue(envContent);
        (0, vitest_1.expect)(() =>
          (0, index_1.config)({ strict: true }),
        ).toThrowError();
      });
    });
    (0, vitest_1.describe)('OBJ type', () => {
      (0, vitest_1.it)('should parse valid JSON objects', () => {
        const envContent =
          'OBJ CONFIG={"database":{"host":"localhost","port":5432},"debug":true}';
        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readFileSync.mockReturnValue(envContent);
        const { parsedEnv } = (0, index_1.config)();
        (0, vitest_1.expect)(parsedEnv.CONFIG).toEqual({
          database: { host: 'localhost', port: 5432 },
          debug: true,
        });
      });
      (0, vitest_1.it)('should throw error for invalid JSON objects', () => {
        const envContent = 'OBJ INVALID={invalid json';
        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readFileSync.mockReturnValue(envContent);
        (0, vitest_1.expect)(() =>
          (0, index_1.config)({ strict: true }),
        ).toThrowError();
      });
      (0, vitest_1.it)('should throw error when value is an array', () => {
        const envContent = 'OBJ NOT_OBJECT=[1,2,3]';
        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readFileSync.mockReturnValue(envContent);
        (0, vitest_1.expect)(() =>
          (0, index_1.config)({ strict: true }),
        ).toThrowError();
      });
    });
    (0, vitest_1.it)(
      'should throw error for unsupported variable types',
      () => {
        const envContent = 'UNSUPPORTED_TYPE VAR=value';
        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readFileSync.mockReturnValue(envContent);
        (0, vitest_1.expect)(() =>
          (0, index_1.config)({ strict: true }),
        ).toThrowError();
      },
    );
  });
  (0, vitest_1.describe)('Variable name validation', () => {
    (0, vitest_1.it)('should accept valid variable names', () => {
      const envContent = `STRING validName=test
STRING _underscoreStart=test
STRING name123=test
STRING UPPER_CASE=test`;
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(envContent);
      const { parsedEnv } = (0, index_1.config)();
      (0, vitest_1.expect)(Object.keys(parsedEnv)).toEqual([
        'validName',
        '_underscoreStart',
        'name123',
        'UPPER_CASE',
      ]);
    });
    (0, vitest_1.it)('should throw error for invalid variable names', () => {
      const envContent = 'STRING 123invalid=test';
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(envContent);
      (0, vitest_1.expect)(() =>
        (0, index_1.config)({ strict: true }),
      ).toThrowError();
    });
  });
  (0, vitest_1.describe)('Error handling', () => {
    (0, vitest_1.it)(
      'should handle missing .env file gracefully in non-strict mode',
      () => {
        mockedFs.existsSync.mockReturnValue(false);
        const { parsedEnv } = (0, index_1.config)();
        (0, vitest_1.expect)(parsedEnv).toEqual({});
        (0, vitest_1.expect)(console.error).toHaveBeenCalledWith(
          vitest_1.expect.stringContaining('Error reading environment file'),
        );
      },
    );
    (0, vitest_1.it)(
      'should throw error for missing .env file in strict mode',
      () => {
        mockedFs.existsSync.mockReturnValue(false);
        (0, vitest_1.expect)(() =>
          (0, index_1.config)({ strict: true }),
        ).toThrowError();
      },
    );
    (0, vitest_1.it)('should handle duplicate variable names', () => {
      const envContent = `STRING NAME=First
STRING NAME=Second`;
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(envContent);
      const { parsedEnv } = (0, index_1.config)();
      (0, vitest_1.expect)(parsedEnv.NAME).toBe('Second');
      (0, vitest_1.expect)(console.warn).toHaveBeenCalledWith(
        vitest_1.expect.stringContaining(
          'Duplicate environment variable: NAME',
        ),
      );
    });
  });
  (0, vitest_1.describe)('generateTypes()', () => {
    (0, vitest_1.beforeEach)(() => {
      mockedFs.writeFileSync.mockImplementation(() => {});
      mockedFs.mkdirSync.mockImplementation(() => '');
    });
    (0, vitest_1.it)('should generate correct TypeScript interface', () => {
      const envContent = `NUMBER AGE=25
STRING NAME="Ali"
BOOL ACTIVE=true
ARRAY TAGS=["tag1","tag2"]
OBJ CONFIG={"key":"value"}`;
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(envContent);
      (0, index_1.generateTypes)('.env', './env-types.ts');
      (0, vitest_1.expect)(mockedFs.writeFileSync).toHaveBeenCalledWith(
        './env-types.ts',
        vitest_1.expect.stringContaining('export interface EnvConfig {'),
      );
      const writeCall = mockedFs.writeFileSync.mock.calls[0];
      const generatedContent = writeCall[1];
      (0, vitest_1.expect)(generatedContent).toContain('AGE: number;');
      (0, vitest_1.expect)(generatedContent).toContain('NAME: string;');
      (0, vitest_1.expect)(generatedContent).toContain('ACTIVE: boolean;');
      (0, vitest_1.expect)(generatedContent).toContain('TAGS: any[];');
      (0, vitest_1.expect)(generatedContent).toContain(
        'CONFIG: Record<string, any>;',
      );
    });
    (0, vitest_1.it)(
      'should generate custom interface name and options',
      () => {
        const envContent = 'STRING TEST=value';
        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readFileSync.mockReturnValue(envContent);
        (0, index_1.generateTypes)('.env', './types.ts', {
          interfaceName: 'MyConfig',
          includeComments: false,
          exportSchema: false,
        });
        const writeCall = mockedFs.writeFileSync.mock.calls[0];
        const generatedContent = writeCall[1];
        (0, vitest_1.expect)(generatedContent).toContain(
          'export interface MyConfig {',
        );
        (0, vitest_1.expect)(generatedContent).not.toContain(
          '/** Type: STRING */',
        );
        (0, vitest_1.expect)(generatedContent).not.toContain(
          'export const envSchema',
        );
      },
    );
    (0, vitest_1.it)(
      'should create output directory if it does not exist',
      () => {
        const envContent = 'STRING TEST=value';
        mockedFs.existsSync.mockReturnValueOnce(true); // .env exists
        mockedFs.existsSync.mockReturnValueOnce(false); // output dir doesn't exist
        mockedFs.readFileSync.mockReturnValue(envContent);
        (0, index_1.generateTypes)('.env', './nested/dir/types.ts');
        (0, vitest_1.expect)(mockedFs.mkdirSync).toHaveBeenCalledWith(
          './nested/dir',
          { recursive: true },
        );
      },
    );
    (0, vitest_1.it)('should handle empty .env file', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue('# Only comments\n\n');
      (0, index_1.generateTypes)();
      (0, vitest_1.expect)(console.warn).toHaveBeenCalledWith(
        'No environment variables found in .env file',
      );
      (0, vitest_1.expect)(mockedFs.writeFileSync).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should throw error if .env file does not exist', () => {
      mockedFs.existsSync.mockReturnValue(false);
      (0, vitest_1.expect)(() => (0, index_1.generateTypes)()).toThrowError();
    });
  });
  (0, vitest_1.describe)('validateEnv()', () => {
    (0, vitest_1.it)(
      'should return true for valid environment matching schema',
      () => {
        const env = { AGE: 25, NAME: 'Ali' };
        const schema = { AGE: 'NUMBER', NAME: 'STRING' };
        const isValid = (0, index_1.validateEnv)(env, schema);
        (0, vitest_1.expect)(isValid).toBe(true);
      },
    );
    (0, vitest_1.it)(
      'should return false and log error for missing required variables',
      () => {
        const env = { AGE: 25 };
        const schema = { AGE: 'NUMBER', NAME: 'STRING' };
        const isValid = (0, index_1.validateEnv)(env, schema);
        (0, vitest_1.expect)(isValid).toBe(false);
        (0, vitest_1.expect)(console.error).toHaveBeenCalledWith(
          vitest_1.expect.stringContaining(
            'Missing environment variables: NAME',
          ),
        );
      },
    );
    (0, vitest_1.it)('should warn about extra variables not in schema', () => {
      const env = { AGE: 25, NAME: 'Ali', EXTRA: 'value' };
      const schema = { AGE: 'NUMBER', NAME: 'STRING' };
      const isValid = (0, index_1.validateEnv)(env, schema);
      (0, vitest_1.expect)(isValid).toBe(true);
      (0, vitest_1.expect)(console.warn).toHaveBeenCalledWith(
        vitest_1.expect.stringContaining(
          'Extra environment variables (not in schema): EXTRA',
        ),
      );
    });
  });
  (0, vitest_1.describe)('createTypedConfig()', () => {
    (0, vitest_1.it)('should create a typed config function', () => {
      const envContent = 'STRING TEST=value';
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(envContent);
      const getTypedConfig = (0, index_1.createTypedConfig)();
      const { parsedEnv } = getTypedConfig();
      // This test mainly verifies the function works
      // Type checking would be done by TypeScript compiler
      (0, vitest_1.expect)(parsedEnv).toEqual({ TEST: 'value' });
    });
  });
  (0, vitest_1.describe)('Integration tests', () => {
    (0, vitest_1.it)('should handle complex real-world .env file', () => {
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
      const { parsedEnv } = (0, index_1.config)();
      (0, vitest_1.expect)(parsedEnv).toEqual({
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
    (0, vitest_1.it)('should generate types and validate successfully', () => {
      const envContent = `NUMBER PORT=3000
STRING HOST="localhost"
BOOL DEBUG=true`;
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(envContent);
      // Generate types
      (0, index_1.generateTypes)();
      // Parse environment
      const { parsedEnv } = (0, index_1.config)();
      // Mock schema that would be generated
      const schema = { PORT: 'NUMBER', HOST: 'STRING', DEBUG: 'BOOL' };
      // Validate
      const isValid = (0, index_1.validateEnv)(parsedEnv, schema);
      (0, vitest_1.expect)(isValid).toBe(true);
      (0, vitest_1.expect)(parsedEnv).toEqual({
        PORT: 3000,
        HOST: 'localhost',
        DEBUG: true,
      });
    });
  });
});
