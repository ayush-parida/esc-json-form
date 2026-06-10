import { inferValueType } from "./json-form-tree";
import {
  JsonArray,
  JsonObject,
  JsonSchemaNode,
  JsonValue,
  ValidationError,
  ValidationRule,
  PathSegment,
} from "./types";

export function validateWithSchema(
  value: JsonValue,
  schema?: JsonSchemaNode,
): ValidationError[] {
  if (!schema) {
    return [];
  }

  const errors: ValidationError[] = [];
  walkValidate(value, schema, [], errors);
  return errors;
}

function walkValidate(
  value: JsonValue,
  schema: JsonSchemaNode,
  path: PathSegment[],
  errors: ValidationError[],
): void {
  const actualType = inferValueType(value);
  if (actualType !== schema.type) {
    errors.push({
      path,
      code: "type",
      message: `Expected ${schema.type} but got ${actualType}`,
    });
    return;
  }

  if (schema.rules) {
    validateRules(value, schema.rules, path, errors);
  }

  if (schema.type === "object" && schema.properties) {
    const obj = value as JsonObject;

    for (const key of Object.keys(schema.properties)) {
      const childSchema = schema.properties[key];
      const childPath = [...path, key];
      const childValue = obj[key];

      if (childValue === undefined) {
        if (childSchema.rules?.required) {
          errors.push({
            path: childPath,
            code: "required",
            message: `${key} is required`,
          });
        }
        continue;
      }

      walkValidate(childValue, childSchema, childPath, errors);
    }
  }

  if (schema.type === "array" && schema.items) {
    const arr = value as JsonArray;
    arr.forEach((item, index) => {
      walkValidate(
        item,
        schema.items as JsonSchemaNode,
        [...path, index],
        errors,
      );
    });
  }
}

function validateRules(
  value: JsonValue,
  rules: ValidationRule,
  path: PathSegment[],
  errors: ValidationError[],
): void {
  const valueType = inferValueType(value);

  if (rules.required) {
    const emptyString =
      valueType === "string" && (value as string).trim().length === 0;
    if (value === null || emptyString) {
      errors.push({
        path,
        code: "required",
        message: "Value is required",
      });
    }
  }

  if (valueType === "number") {
    const n = value as number;

    if (rules.min !== undefined && n < rules.min) {
      errors.push({
        path,
        code: "min",
        message: `Value must be >= ${rules.min}`,
      });
    }

    if (rules.max !== undefined && n > rules.max) {
      errors.push({
        path,
        code: "max",
        message: `Value must be <= ${rules.max}`,
      });
    }
  }

  if (valueType === "string") {
    const s = value as string;

    if (rules.minLength !== undefined && s.length < rules.minLength) {
      errors.push({
        path,
        code: "minLength",
        message: `Length must be >= ${rules.minLength}`,
      });
    }

    if (rules.maxLength !== undefined && s.length > rules.maxLength) {
      errors.push({
        path,
        code: "maxLength",
        message: `Length must be <= ${rules.maxLength}`,
      });
    }

    if (rules.pattern) {
      const regex = new RegExp(rules.pattern);
      if (!regex.test(s)) {
        errors.push({
          path,
          code: "pattern",
          message: "Value does not match required pattern",
        });
      }
    }
  }
}
