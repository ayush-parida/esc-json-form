export type JsonPrimitive = string | number | boolean | null;

export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export interface JsonObject {
  [key: string]: JsonValue;
}

export type JsonArray = JsonValue[];

export type PathSegment = string | number;

export type JsonValueType =
  | "string"
  | "number"
  | "boolean"
  | "null"
  | "object"
  | "array";

export type FormNodeKind = "field" | "section";

export interface BaseFormNode {
  id: string;
  key: string;
  label: string;
  path: PathSegment[];
  kind: FormNodeKind;
  valueType: JsonValueType;
}

export interface FieldFormNode extends BaseFormNode {
  kind: "field";
  value: JsonPrimitive;
}

export interface SectionFormNode extends BaseFormNode {
  kind: "section";
  children: FormNode[];
}

export type FormNode = FieldFormNode | SectionFormNode;

export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface JsonSchemaNode {
  type: JsonValueType;
  rules?: ValidationRule;
  properties?: Record<string, JsonSchemaNode>;
  items?: JsonSchemaNode;
}

export interface ValidationError {
  path: PathSegment[];
  message: string;
  code:
    | "required"
    | "type"
    | "min"
    | "max"
    | "minLength"
    | "maxLength"
    | "pattern";
}
