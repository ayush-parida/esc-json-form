import { buildFormTree, inferValueType } from "./json-form-tree";
import {
  FormNode,
  JsonArray,
  JsonObject,
  JsonSchemaNode,
  JsonPrimitive,
  JsonValue,
  JsonValueType,
  PathSegment,
  ValidationError,
} from "./types";
import { validateWithSchema } from "./validation";

export type Subscriber = (value: JsonValue) => void;

export class JsonFormStore {
  private value: JsonValue;
  private schema?: JsonSchemaNode;

  private subscribers = new Set<Subscriber>();

  constructor(initialValue: JsonValue, schema?: JsonSchemaNode) {
    this.value = cloneJson(initialValue);
    this.schema = schema;
  }

  getValue(): JsonValue {
    return cloneJson(this.value);
  }

  setValue(nextValue: JsonValue): void {
    this.value = cloneJson(nextValue);
    this.notify();
  }

  getSchema(): JsonSchemaNode | undefined {
    return this.schema;
  }

  setSchema(schema?: JsonSchemaNode): void {
    this.schema = schema;
    this.notify();
  }

  getTree(): FormNode {
    return buildFormTree(this.value);
  }

  getAtPath(path: PathSegment[]): JsonValue | undefined {
    let current: JsonValue | undefined = this.value;

    for (const segment of path) {
      if (current === undefined || current === null) {
        return undefined;
      }

      if (typeof segment === "number") {
        if (!Array.isArray(current)) {
          return undefined;
        }

        current = current[segment];
        continue;
      }

      if (typeof current !== "object" || Array.isArray(current)) {
        return undefined;
      }

      current = (current as JsonObject)[segment];
    }

    return current === undefined ? undefined : cloneJson(current);
  }

  setAtPath(path: PathSegment[], nextValue: JsonValue): void {
    if (path.length === 0) {
      this.setValue(nextValue);
      return;
    }

    const draft = cloneJson(this.value);
    const parentPath = path.slice(0, -1);
    const finalKey = path[path.length - 1];
    const parent = ensureContainer(draft, parentPath);

    if (typeof finalKey === "number") {
      if (!Array.isArray(parent)) {
        throw new Error("Cannot set numeric index on a non-array value");
      }

      parent[finalKey] = cloneJson(nextValue);
    } else {
      if (
        typeof parent !== "object" ||
        parent === null ||
        Array.isArray(parent)
      ) {
        throw new Error("Cannot set property on a non-object value");
      }

      (parent as JsonObject)[finalKey] = cloneJson(nextValue);
    }

    this.value = draft;
    this.notify();
  }

  setTypeAtPath(path: PathSegment[], nextType: JsonValueType): void {
    const current = this.getAtPath(path);
    if (current === undefined) {
      return;
    }

    const currentType = inferValueType(current);
    if (currentType === nextType) {
      return;
    }

    this.setAtPath(path, defaultValueForType(nextType));
  }

  addArrayItem(path: PathSegment[], item?: JsonValue): void {
    const current = this.getAtPath(path);

    if (!Array.isArray(current)) {
      throw new Error("addArrayItem path must point to an array");
    }

    const nextItem = item ?? inferDefaultArrayItem(current);
    const next = [...current, cloneJson(nextItem)];
    this.setAtPath(path, next);
  }

  addObjectKey(
    path: PathSegment[],
    key: string,
    valueType: JsonValueType = "string",
  ): boolean {
    const normalizedKey = key.trim();
    if (normalizedKey.length === 0) {
      return false;
    }

    const current = this.getAtPath(path);
    if (current === undefined || current === null || Array.isArray(current)) {
      throw new Error("addObjectKey path must point to an object");
    }

    if (typeof current !== "object") {
      throw new Error("addObjectKey path must point to an object");
    }

    const currentObject = current as JsonObject;
    if (Object.prototype.hasOwnProperty.call(currentObject, normalizedKey)) {
      return false;
    }

    const nextObject: JsonObject = {
      ...currentObject,
      [normalizedKey]: defaultValueForType(valueType),
    };

    this.setAtPath(path, nextObject);
    return true;
  }

  removeObjectKey(path: PathSegment[], key: string): boolean {
    const normalizedKey = key.trim();
    if (normalizedKey.length === 0) {
      return false;
    }

    const current = this.getAtPath(path);
    if (current === undefined || current === null || Array.isArray(current)) {
      throw new Error("removeObjectKey path must point to an object");
    }

    if (typeof current !== "object") {
      throw new Error("removeObjectKey path must point to an object");
    }

    const currentObject = current as JsonObject;
    if (!Object.prototype.hasOwnProperty.call(currentObject, normalizedKey)) {
      return false;
    }

    const nextObject: JsonObject = { ...currentObject };
    delete nextObject[normalizedKey];
    this.setAtPath(path, nextObject);
    return true;
  }

  removeArrayItem(path: PathSegment[], index: number): void {
    const current = this.getAtPath(path);

    if (!Array.isArray(current)) {
      throw new Error("removeArrayItem path must point to an array");
    }

    if (index < 0 || index >= current.length) {
      return;
    }

    const next = current.filter((_, currentIndex) => currentIndex !== index);
    this.setAtPath(path, next);
  }

  validate(): ValidationError[] {
    return validateWithSchema(this.value, this.schema);
  }

  update(updater: (currentValue: JsonValue) => JsonValue): void {
    const current = this.getValue();
    const nextValue = updater(current);
    this.setValue(nextValue);
  }

  subscribe(subscriber: Subscriber): () => void {
    this.subscribers.add(subscriber);

    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  private notify(): void {
    const snapshot = this.getValue();
    for (const subscriber of this.subscribers) {
      subscriber(snapshot);
    }
  }
}

export function createJsonFormStore(
  initialValue: JsonValue,
  schema?: JsonSchemaNode,
): JsonFormStore {
  return new JsonFormStore(initialValue, schema);
}

export function defaultValueForType(type: JsonValueType): JsonValue {
  switch (type) {
    case "string":
      return "";
    case "number":
      return 0;
    case "boolean":
      return false;
    case "null":
      return null;
    case "object":
      return {};
    case "array":
      return [];
    default:
      return null;
  }
}

function ensureContainer(
  value: JsonValue,
  path: PathSegment[],
): JsonObject | JsonArray {
  let current: JsonValue = value;

  for (const segment of path) {
    if (typeof segment === "number") {
      if (!Array.isArray(current)) {
        throw new Error("Expected array while traversing numeric path segment");
      }

      if (current[segment] === undefined) {
        current[segment] = {};
      }

      current = current[segment];
      continue;
    }

    if (
      typeof current !== "object" ||
      current === null ||
      Array.isArray(current)
    ) {
      throw new Error("Expected object while traversing property path segment");
    }

    const obj = current as JsonObject;
    if (obj[segment] === undefined) {
      obj[segment] = {};
    }

    current = obj[segment];
  }

  if (current === null || typeof current !== "object") {
    throw new Error("Final parent container is not object or array");
  }

  return current as JsonObject | JsonArray;
}

function cloneJson<T extends JsonValue>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function castPrimitiveInput(
  rawValue: string,
  targetType: JsonValueType,
): JsonPrimitive {
  switch (targetType) {
    case "string":
      return rawValue;
    case "number": {
      const parsed = Number(rawValue);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    case "boolean":
      return rawValue === "true";
    case "null":
      return null;
    default:
      return rawValue;
  }
}

function inferDefaultArrayItem(arrayValue: JsonArray): JsonValue {
  if (arrayValue.length === 0) {
    return "";
  }

  return defaultValueForType(inferValueType(arrayValue[0]));
}
