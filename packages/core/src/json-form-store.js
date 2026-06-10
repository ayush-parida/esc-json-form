import { buildFormTree, inferValueType } from "./json-form-tree";
export class JsonFormStore {
    constructor(initialValue) {
        this.subscribers = new Set();
        this.value = cloneJson(initialValue);
    }
    getValue() {
        return cloneJson(this.value);
    }
    setValue(nextValue) {
        this.value = cloneJson(nextValue);
        this.notify();
    }
    getTree() {
        return buildFormTree(this.value);
    }
    getAtPath(path) {
        let current = this.value;
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
            current = current[segment];
        }
        return current === undefined ? undefined : cloneJson(current);
    }
    setAtPath(path, nextValue) {
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
        }
        else {
            if (typeof parent !== "object" || parent === null || Array.isArray(parent)) {
                throw new Error("Cannot set property on a non-object value");
            }
            parent[finalKey] = cloneJson(nextValue);
        }
        this.value = draft;
        this.notify();
    }
    setTypeAtPath(path, nextType) {
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
    update(updater) {
        const current = this.getValue();
        const nextValue = updater(current);
        this.setValue(nextValue);
    }
    subscribe(subscriber) {
        this.subscribers.add(subscriber);
        return () => {
            this.subscribers.delete(subscriber);
        };
    }
    notify() {
        const snapshot = this.getValue();
        for (const subscriber of this.subscribers) {
            subscriber(snapshot);
        }
    }
}
export function createJsonFormStore(initialValue) {
    return new JsonFormStore(initialValue);
}
export function defaultValueForType(type) {
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
function ensureContainer(value, path) {
    let current = value;
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
        if (typeof current !== "object" || current === null || Array.isArray(current)) {
            throw new Error("Expected object while traversing property path segment");
        }
        const obj = current;
        if (obj[segment] === undefined) {
            obj[segment] = {};
        }
        current = obj[segment];
    }
    if (current === null || typeof current !== "object") {
        throw new Error("Final parent container is not object or array");
    }
    return current;
}
function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
}
export function castPrimitiveInput(rawValue, targetType) {
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
//# sourceMappingURL=json-form-store.js.map