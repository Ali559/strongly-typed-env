type EnvValue = string | number | boolean | Array<Record<string, any> | any> | Record<string, any>;
type TypeMap = {
    NUMBER: number;
    STRING: string;
    BOOL: boolean;
    ARRAY: Array<Record<string, any> | any>;
    OBJ: Record<string, any>;
};
type EnvType = keyof TypeMap;
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
export declare function generateTypes(envPath?: string, outputPath?: string, options?: {
    interfaceName?: string;
    includeComments?: boolean;
    exportSchema?: boolean;
}): void;
/**
 * Parses environment variables from a file and returns them as a typed object.
 * @param options - Options for parsing the environment file.
 * @param options.path - Path to the environment file. Defaults to '.env'.
 * @param options.encoding - Encoding of the environment file. Defaults to 'utf8'.
 * @param options.strict - If true, throws an error if the environment file is missing or invalid. Defaults to false.
 * @returns An object with the parsed environment variables.
 */
export declare function config<T>(options?: {
    path?: string;
    encoding?: BufferEncoding;
    strict?: boolean;
}): {
    parsedEnv: T;
};
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
export declare function validateEnv<T extends Record<string, EnvValue>>(env: Record<string, EnvValue>, schema: Record<string, EnvType>): env is T;
export declare function createTypedConfig<T>(): (options?: {
    path?: string;
    encoding?: BufferEncoding;
    strict?: boolean;
}) => {
    parsedEnv: T;
};
export {};
