type EnvValue =
  | string
  | number
  | boolean
  | Array<Record<string, any> | any>
  | Record<string, any>;
export declare function config(options?: {
  path?: string;
  encoding?: BufferEncoding;
}): {
  parsedEnv: Record<string, EnvValue>;
};
export {};
