import { FormNode, JsonPrimitive, JsonValue, JsonValueType, PathSegment } from "./types";
export type Subscriber = (value: JsonValue) => void;
export declare class JsonFormStore {
    private value;
    private subscribers;
    constructor(initialValue: JsonValue);
    getValue(): JsonValue;
    setValue(nextValue: JsonValue): void;
    getTree(): FormNode;
    getAtPath(path: PathSegment[]): JsonValue | undefined;
    setAtPath(path: PathSegment[], nextValue: JsonValue): void;
    setTypeAtPath(path: PathSegment[], nextType: JsonValueType): void;
    update(updater: (currentValue: JsonValue) => JsonValue): void;
    subscribe(subscriber: Subscriber): () => void;
    private notify;
}
export declare function createJsonFormStore(initialValue: JsonValue): JsonFormStore;
export declare function defaultValueForType(type: JsonValueType): JsonValue;
export declare function castPrimitiveInput(rawValue: string, targetType: JsonValueType): JsonPrimitive;
//# sourceMappingURL=json-form-store.d.ts.map