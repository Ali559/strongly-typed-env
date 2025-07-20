import type { ASTNode, Token, TokenType } from "./types.ts";

export function parser(tokens: Token[]): ASTNode {
    let current = 0;

    const eat = (expectedType: TokenType): Token => {
        const token = tokens[current];
        if (!token || token.type !== expectedType) {
            throw new Error(`Expected ${expectedType}, got ${token?.type}`);
        }
        current++;
        return token;
    };

    const parseLiteral = (): any => {
        const token = tokens[current];

        switch (token.type) {
            case 'STRING_LITERAL':
                current++;
                return token.value;

            case 'NUMBER_LITERAL':
                current++;
                return Number(token.value);

            case 'BOOLEAN_LITERAL':
                current++;
                return token.value === 'true';

            case 'L_BRACKET':
                return parseArray();

            case 'L_BRACE':
                return parseObject();

            default:
                throw new Error(`Unexpected literal token: ${token.type}`);
        }
    };

    const parseArray = (): any[] => {
        const elements = [];
        eat('L_BRACKET');
        while (tokens[current].type !== 'R_BRACKET') {
            elements.push(parseLiteral());
            if (tokens[current].type === 'COMMA') {
                eat('COMMA');
            }
        }
        eat('R_BRACKET');
        return elements;
    };

    const parseObject = (): Record<string, any> => {
        const obj: Record<string, any> = {};
        eat('L_BRACE');
        while (tokens[current].type !== 'R_BRACE') {
            const keyToken = eat('STRING_LITERAL');
            eat('COLON');
            const value = parseLiteral();
            obj[keyToken.value] = value;
            if (tokens[current].type === 'COMMA') {
                eat('COMMA');
            }
        }
        eat('R_BRACE');
        return obj;
    };

    const parseDeclaration = (): ASTNode => {
        const typeToken = eat('TYPE');
        const nameToken = eat('IDENTIFIER');
        eat('EQUALS');
        const value = parseLiteral();
        eat('SEMICOLON');

        return {
            type: typeToken.value as ASTNode['type'],
            name: nameToken.value,
            value,
        };
    };

    return parseDeclaration();
}
