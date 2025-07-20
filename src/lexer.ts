import type { TokenType } from "./types.ts";

export function lexer(input: string): string[] {
    let line = 1;
    let column = 0;
    let position = 0;

    const isEOF = () => position >= input.length;
    const peek = () => input[position];
    const next = () => {
        const char = input[position];
        position++;
        if (char === '\n') {
            line++;
            column = 0;
        } else {
            column++;
        }
        return char;
    };

    const declarations: string[] = [];
    let buffer = '';
    let inString = false;
    let stringChar = '';
    let braceDepth = 0;
    let bracketDepth = 0;

    while (!isEOF()) {
        const char = peek();

        // Handle strings
        if ((char === '"' || char === "'") && !inString) {
            inString = true;
            stringChar = char;
            buffer += next();
            continue;
        } else if (char === stringChar && inString) {
            inString = false;
            stringChar = '';
            buffer += next();
            continue;
        }

        // If inside a string, just collect characters
        if (inString) {
            buffer += next();
            continue;
        }

        // Handle nested structures
        if (char === '{') braceDepth++;
        if (char === '}') braceDepth--;
        if (char === '[') bracketDepth++;
        if (char === ']') bracketDepth--;

        // End of a top-level statement
        if (char === ';' && braceDepth === 0 && bracketDepth === 0) {
            buffer += next(); // include the semicolon
            declarations.push(buffer.trim());
            buffer = '';
            continue;
        }

        // Default: collect character
        buffer += next();
    }

    // Handle any trailing declaration without a semicolon
    if (buffer.trim()) {
        declarations.push(buffer.trim());
    }

    return declarations;
}


type Token = {
    type: TokenType;
    value?: string;
};

export function tokenize(declaration: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    const isWhitespace = (ch: string) => /\s/.test(ch);
    const isAlpha = (ch: string) => /[a-zA-Z]/.test(ch);
    const isNumeric = (ch: string) => /[0-9]/.test(ch);

    const keywords = ['NUMBER', 'STRING', 'BOOL', 'ARRAY', 'OBJ'];

    while (i < declaration.length) {
        const char = declaration[i];

        // Skip whitespace
        if (isWhitespace(char)) {
            i++;
            continue;
        }

        // Match symbols
        switch (char) {
            case '=':
                tokens.push({ type: 'EQUALS' });
                i++;
                continue;
            case ';':
                tokens.push({ type: 'SEMICOLON' });
                i++;
                continue;
            case '{':
                tokens.push({ type: 'L_BRACE' });
                i++;
                continue;
            case '}':
                tokens.push({ type: 'R_BRACE' });
                i++;
                continue;
            case '[':
                tokens.push({ type: 'L_BRACKET' });
                i++;
                continue;
            case ']':
                tokens.push({ type: 'R_BRACKET' });
                i++;
                continue;
            case ',':
                tokens.push({ type: 'COMMA' });
                i++;
                continue;
            case ':':
                tokens.push({ type: 'COLON' });
                i++;
                continue;
            case '"':
                i++;
                let str = '';
                while (i < declaration.length && declaration[i] !== '"') {
                    str += declaration[i++];
                }
                i++; // skip closing "
                tokens.push({ type: 'STRING_LITERAL', value: str });
                continue;
        }

        // Match numbers
        if (isNumeric(char)) {
            let num = '';
            while (i < declaration.length && isNumeric(declaration[i])) {
                num += declaration[i++];
            }
            tokens.push({ type: 'NUMBER_LITERAL', value: num });
            continue;
        }

        // Match words (types, booleans, identifiers)
        if (isAlpha(char)) {
            let word = '';
            while (i < declaration.length && /[\w]/.test(declaration[i])) {
                word += declaration[i++];
            }

            if (keywords.includes(word)) {
                tokens.push({ type: 'TYPE', value: word });
            } else if (word === 'true' || word === 'false') {
                tokens.push({ type: 'BOOLEAN_LITERAL', value: word });
            } else {
                tokens.push({ type: 'IDENTIFIER', value: word });
            }

            continue;
        }

        throw new Error(`Unexpected character: '${char}' at position ${i}`);
    }

    tokens.push({ type: 'EOF' });
    return tokens;
}
