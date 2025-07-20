````markdown
# strongly-typed-env

> A tiny zero-dependency TypeScript library for **strongly typed environment variables**, where you define types directly in your `.env` file.

---

## ✨ Features

- 🔒 Strong typing for environment variables
- 📄 Types inferred directly from `.env` file with type prefixes
- ⚙️ TypeScript interface and schema generation
- ✅ Runtime validation and parsing
- 🧪 Fully tested with [Vitest](https://vitest.dev/)
- ⚡ No external dependencies

---

## 📦 Installation

```bash
npm install strongly-typed-env
```
````

or with `pnpm`:

```bash
pnpm add strongly-typed-env
```

---

## 📝 Environment File Format

Each line in your `.env` must follow this structure:

```
<TYPE> <NAME>=<VALUE>
```

Supported types:

- `STRING`
- `NUMBER`
- `BOOL`
- `ARRAY` (must be valid JSON array)
- `OBJ` (must be valid JSON object)

Example `.env`:

```
STRING APP_NAME="MyApp"
NUMBER PORT=3000
BOOL DEBUG=true
ARRAY TAGS=["alpha","beta"]
OBJ DB_CONFIG={"host":"localhost","port":5432}
```

---

## 🚀 Usage

### Parse environment variables

```ts
import { config } from 'strongly-typed-env';

const { parsedEnv } = config<{
  APP_NAME: string;
  PORT: number;
  DEBUG: boolean;
  TAGS: string[];
  DB_CONFIG: { host: string; port: number };
}>();

console.log(parsedEnv.APP_NAME); // "MyApp"
```

### Generate TypeScript types

You can auto-generate an interface and schema from your `.env`:

```ts
import { generateTypes } from 'strongly-typed-env';

generateTypes('.env', './src/types/env-types.ts');
```

This generates:

- A TypeScript interface (`EnvConfig`)
- An `envSchema` object
- Type guards and utility helpers

#### Options

```ts
generateTypes('.env', './src/types/env-types.ts', {
  interfaceName: 'MyEnv',
  includeComments: true,
  exportSchema: true,
});
```

---

## 🔐 Runtime Validation

You can validate parsed environment variables against the schema:

```ts
import { validateEnv, envSchema } from './src/types/env-types'; // your generated file

if (!validateEnv(parsedEnv, envSchema)) {
  throw new Error('Invalid environment configuration');
}
```

---

## 🧰 API Reference

### `config<T>(options?): { parsedEnv: T }`

Parses the `.env` file and returns typed variables.

| Option     | Type             | Default  | Description                               |
| ---------- | ---------------- | -------- | ----------------------------------------- |
| `path`     | `string`         | `.env`   | Path to the `.env` file                   |
| `encoding` | `BufferEncoding` | `'utf8'` | File encoding                             |
| `strict`   | `boolean`        | `false`  | If `true`, throws on missing/invalid file |

---

### `generateTypes(envPath, outputPath, options?)`

Generates a `.ts` file containing the interface, schema, and utility types.

| Option            | Type      | Default     | Description                            |
| ----------------- | --------- | ----------- | -------------------------------------- |
| `interfaceName`   | `string`  | `EnvConfig` | Name of the generated interface        |
| `includeComments` | `boolean` | `true`      | Adds comments for each field           |
| `exportSchema`    | `boolean` | `true`      | Exports schema alongside the interface |

---

### `validateEnv(env, schema): boolean`

Checks if all required keys exist and warns about unexpected ones.

---

### `createTypedConfig<T>()`

Returns a reusable typed config function:

```ts
const useEnv = createTypedConfig<YourEnvInterface>();
const { parsedEnv } = useEnv();
```

---

## 🧪 Running Tests

```bash
npm run test
```

For watch mode:

```bash
npm run test:watch
```

For coverage:

```bash
npm run test:coverage
```

---

## 📄 License

MIT © [Ali Barznji](https://github.com/Ali559)

---

## 💡 Inspiration

This project was built to simplify working with `.env` files in TypeScript-heavy applications by combining static typing, runtime validation, and type generation—all with zero dependencies.

```

```
