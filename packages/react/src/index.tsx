import { ReactElement, useEffect, useRef, useState } from "react";
import {
  castPrimitiveInput,
  createJsonFormStore,
  JsonSchemaNode,
  JsonFormStore,
  JsonValue,
  JsonValueType,
  PathSegment,
  FormNode,
  ValidationError,
} from "esc-json-form-core";

export interface JsonFormEditorProps {
  value: JsonValue;
  onChange?: (nextValue: JsonValue) => void;
  title?: string;
  schema?: JsonSchemaNode;
}

export interface UseJsonFormStoreResult {
  store: JsonFormStore;
  value: JsonValue;
  setValue: (nextValue: JsonValue) => void;
}

export function useJsonFormStore(
  initialValue: JsonValue,
  schema?: JsonSchemaNode,
): UseJsonFormStoreResult {
  const [store] = useState(() => createJsonFormStore(initialValue, schema));
  const [value, setCurrentValue] = useState<JsonValue>(store.getValue());

  useEffect(() => {
    const current = store.getValue();
    if (!isJsonEqual(current, initialValue)) {
      store.setValue(initialValue);
    }
  }, [initialValue, store]);

  useEffect(() => {
    store.setSchema(schema);
  }, [schema, store]);

  useEffect(() => {
    return store.subscribe((nextValue) => {
      setCurrentValue(nextValue);
    });
  }, [store]);

  const setValue = (nextValue: JsonValue) => {
    store.setValue(nextValue);
  };

  return { store, value, setValue };
}

export function JsonFormEditor(props: JsonFormEditorProps): ReactElement {
  const { value, onChange, title = "JSON Form Editor", schema } = props;
  const { store } = useJsonFormStore(value, schema);
  const [rootNode, setRootNode] = useState<FormNode>(() => store.getTree());
  const [errors, setErrors] = useState<ValidationError[]>(() => store.validate());
  const latestValueRef = useRef<JsonValue>(value);

  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  useEffect(() => {
    setRootNode(store.getTree());
    setErrors(store.validate());

    return store.subscribe((nextValue) => {
      setRootNode(store.getTree());
      setErrors(store.validate());
      if (!isJsonEqual(nextValue, latestValueRef.current)) {
        onChange?.(nextValue);
      }
    });
  }, [store, onChange]);

  const errorsByPath = toErrorMap(errors);

  return (
    <div style={styles.container}>
      <h3 style={styles.header}>{title}</h3>
      <FormNodeView
        node={rootNode}
        errorsByPath={errorsByPath}
        onPrimitiveChange={(path, rawValue, type) => {
          store.setAtPath(path, castPrimitiveInput(rawValue, type));
        }}
        onTypeChange={(path, type) => {
          store.setTypeAtPath(path, type);
        }}
        onAddArrayItem={(path) => {
          store.addArrayItem(path);
        }}
        onRemoveArrayItem={(path, index) => {
          store.removeArrayItem(path, index);
        }}
      />
    </div>
  );
}

interface FormNodeViewProps {
  node: FormNode;
  errorsByPath: Record<string, string[]>;
  onPrimitiveChange: (path: PathSegment[], rawValue: string, type: JsonValueType) => void;
  onTypeChange: (path: PathSegment[], type: JsonValueType) => void;
  onAddArrayItem: (path: PathSegment[]) => void;
  onRemoveArrayItem: (path: PathSegment[], index: number) => void;
}

function FormNodeView(props: FormNodeViewProps): ReactElement {
  const {
    node,
    errorsByPath,
    onPrimitiveChange,
    onTypeChange,
    onAddArrayItem,
    onRemoveArrayItem,
  } = props;
  const [isExpanded, setIsExpanded] = useState(true);

  if (node.kind === "section") {
    return (
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            style={styles.toggleButton}
          >
            {isExpanded ? "-" : "+"}
          </button>
          <strong>{node.label}</strong>
          <span style={styles.sectionType}>{node.valueType}</span>
          {node.valueType === "array" && (
            <button
              type="button"
              style={styles.actionButton}
              onClick={() => onAddArrayItem(node.path)}
            >
              Add Item
            </button>
          )}
        </div>
        {isExpanded && (
          <div style={styles.sectionChildren}>
            {node.children.map((child) => (
              <div key={child.id} style={styles.childRow}>
                <FormNodeView
                  node={child}
                  errorsByPath={errorsByPath}
                  onPrimitiveChange={onPrimitiveChange}
                  onTypeChange={onTypeChange}
                  onAddArrayItem={onAddArrayItem}
                  onRemoveArrayItem={onRemoveArrayItem}
                />
                {node.valueType === "array" && typeof child.path[child.path.length - 1] === "number" && (
                  <button
                    type="button"
                    style={styles.removeButton}
                    onClick={() => onRemoveArrayItem(node.path, child.path[child.path.length - 1] as number)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const nodeErrors = errorsByPath[pathToKey(node.path)] ?? [];

  return (
    <div>
      <div style={styles.fieldRow}>
        <label style={styles.label}>{node.label}</label>
        <select
          value={node.valueType}
          onChange={(event) => onTypeChange(node.path, event.target.value as JsonValueType)}
          style={styles.select}
        >
          <option value="string">string</option>
          <option value="number">number</option>
          <option value="boolean">boolean</option>
          <option value="null">null</option>
        </select>
        {node.valueType === "boolean" ? (
          <select
            value={String(Boolean(node.value))}
            onChange={(event) => onPrimitiveChange(node.path, event.target.value, node.valueType)}
            style={styles.select}
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        ) : node.valueType === "null" ? (
          <input type="text" disabled value="null" style={styles.inputDisabled} />
        ) : (
          <input
            type={node.valueType === "number" ? "number" : "text"}
            value={String(node.value ?? "")}
            onChange={(event) => onPrimitiveChange(node.path, event.target.value, node.valueType)}
            style={styles.input}
          />
        )}
      </div>
      {nodeErrors.length > 0 && <div style={styles.errorText}>{nodeErrors.join(". ")}</div>}
    </div>
  );
}

export function createReactJsonFormStore(
  initialValue: JsonValue,
  schema?: JsonSchemaNode,
): JsonFormStore {
  return createJsonFormStore(initialValue, schema);
}

function pathToKey(path: PathSegment[]): string {
  return path.map((segment) => String(segment)).join(".");
}

function toErrorMap(errors: ValidationError[]): Record<string, string[]> {
  return errors.reduce<Record<string, string[]>>((acc, error) => {
    const key = pathToKey(error.path);
    acc[key] = acc[key] ?? [];
    acc[key].push(error.message);
    return acc;
  }, {});
}

function isJsonEqual(a: JsonValue, b: JsonValue): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

const styles = {
  container: {
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    padding: "16px",
    backgroundColor: "#f9fafb",
    fontFamily: '"Segoe UI", sans-serif',
  },
  header: {
    margin: "0 0 12px 0",
  },
  section: {
    borderLeft: "2px solid #93c5fd",
    marginLeft: "8px",
    paddingLeft: "10px",
    marginBottom: "10px",
  },
  sectionHeader: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  sectionType: {
    color: "#6b7280",
    fontSize: "12px",
  },
  sectionChildren: {
    marginTop: "8px",
  },
  childRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "8px",
    alignItems: "start",
  },
  fieldRow: {
    display: "grid",
    gridTemplateColumns: "1fr 120px 1.5fr",
    alignItems: "center",
    gap: "10px",
    marginBottom: "8px",
  },
  label: {
    fontWeight: 500,
  },
  select: {
    padding: "6px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    backgroundColor: "white",
  },
  input: {
    padding: "6px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
  },
  inputDisabled: {
    padding: "6px",
    borderRadius: "6px",
    border: "1px solid #e5e7eb",
    backgroundColor: "#f3f4f6",
    color: "#6b7280",
  },
  toggleButton: {
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    width: "24px",
    height: "24px",
    cursor: "pointer",
    backgroundColor: "white",
  },
  actionButton: {
    border: "1px solid #86efac",
    backgroundColor: "#f0fdf4",
    borderRadius: "6px",
    padding: "4px 8px",
    cursor: "pointer",
  },
  removeButton: {
    border: "1px solid #fca5a5",
    backgroundColor: "#fef2f2",
    borderRadius: "6px",
    padding: "4px 8px",
    marginTop: "4px",
    cursor: "pointer",
    height: "fit-content",
  },
  errorText: {
    color: "#b91c1c",
    fontSize: "12px",
    margin: "2px 0 8px",
  },
} as const;
