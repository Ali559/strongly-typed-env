
export type EnvValue =
  | string
  | number
  | boolean
  | Array<Record<string, any> | any>
  | Record<string, any>;

export type TypeMap = {
  NUMBER: number;
  STRING: string;
  BOOL: boolean;
  ARRAY: Array<Record<string, any> | any>;
  OBJ: Record<string, any>;
};

export type TokenType =
  | 'TYPE'
  | 'IDENTIFIER'
  | 'EQUALS'
  | 'STRING_LITERAL'
  | 'NUMBER_LITERAL'
  | 'BOOLEAN_LITERAL'
  | 'L_BRACKET'
  | 'R_BRACKET'
  | 'L_BRACE'
  | 'R_BRACE'
  | 'COLON'
  | 'COMMA'
  | 'NEWLINE'
  | 'WHITESPACE'
  | 'EOF'
  | 'UNDERSCORE'
  | 'WORD'
  | 'COMMA_LITERAL'
  | 'COLON'
  | 'SEMICOLON'
  | 'KEYWORD';

export type Token = {
  type: TokenType;
  value: string;
  line: number;
  column: number;
};

export type EnvType = keyof TypeMap;

export type ASTNode = {
  type: 'NUMBER' | 'STRING' | 'BOOL' | 'ARRAY' | 'OBJ';
  name: string;
  value: any;
};
