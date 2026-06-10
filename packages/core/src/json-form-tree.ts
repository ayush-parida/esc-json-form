import {
  FormNode,
  JsonArray,
  JsonObject,
  JsonPrimitive,
  JsonValue,
  JsonValueType,
  PathSegment,
} from "./types";

const ROOT_KEY = "root";

export function inferValueType(value: JsonValue): JsonValueType {
  if (Array.isArray(value)) {
    return "array";
  }

  if (value === null) {
    return "null";
  }

  if (typeof value === "object") {
    return "object";
  }

  if (typeof value === "string") {
    return "string";
  }

  if (typeof value === "number") {
    return "number";
  }

  return "boolean";
}

export function buildFormTree(value: JsonValue): FormNode {
  return buildNode(ROOT_KEY, [], value);
}

function buildNode(
  key: string,
  path: PathSegment[],
  value: JsonValue,
): FormNode {
  const valueType = inferValueType(value);

  if (valueType === "object") {
    const obj = value as JsonObject;
    const children = Object.keys(obj).map((childKey) =>
      buildNode(childKey, [...path, childKey], obj[childKey]),
    );

    return {
      id: toId(path),
      key,
      label: toLabel(key),
      path,
      kind: "section",
      valueType,
      children,
    };
  }

  if (valueType === "array") {
    const arr = value as JsonArray;
    const children = arr.map((item, index) =>
      buildNode(String(index), [...path, index], item),
    );

    return {
      id: toId(path),
      key,
      label: toLabel(key),
      path,
      kind: "section",
      valueType,
      children,
    };
  }

  return {
    id: toId(path),
    key,
    label: toLabel(key),
    path,
    kind: "field",
    valueType,
    value: value as JsonPrimitive,
  };
}

function toId(path: PathSegment[]): string {
  if (path.length === 0) {
    return ROOT_KEY;
  }

  return path.map((segment) => String(segment)).join(".");
}

function toLabel(key: string): string {
  if (key === ROOT_KEY) {
    return "JSON Root";
  }

  return key;
}
