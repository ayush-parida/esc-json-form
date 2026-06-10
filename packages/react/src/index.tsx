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
import { RichTextEditor } from "esc-editor";
import "esc-editor/styles.css";

type FieldEditorType = JsonValueType | "textarea" | "datetime" | "textEditor";

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
  const [editorTypeByPath, setEditorTypeByPath] = useState<Record<string, FieldEditorType>>({});
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
        editorTypeByPath={editorTypeByPath}
        onPrimitiveChange={(path, rawValue, type) => {
          store.setAtPath(path, castPrimitiveInput(rawValue, type));
        }}
        onTypeChange={(path, type) => {
          const key = pathToKey(path);

          if (isStringEditorType(type)) {
            setEditorTypeByPath((prev) => ({ ...prev, [key]: type }));
            store.setTypeAtPath(path, "string");
            return;
          }

          setEditorTypeByPath((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
          store.setTypeAtPath(path, type);
        }}
        onAddArrayItem={(path) => {
          store.addArrayItem(path);
        }}
        onRemoveArrayItem={(path, index) => {
          store.removeArrayItem(path, index);
        }}
        onAddObjectKey={(path, key, valueType) => {
          const normalizedKey = key.trim();
          if (!normalizedKey) {
            return false;
          }

          const baseType = toJsonValueType(valueType);
          const added = store.addObjectKey(path, normalizedKey, baseType);
          if (!added) {
            return false;
          }

          if (isStringEditorType(valueType)) {
            const childPathKey = pathToKey([...path, normalizedKey]);
            setEditorTypeByPath((prev) => ({ ...prev, [childPathKey]: valueType }));
          }

          return true;
        }}
        onRemoveObjectKey={(path, key) => {
          return store.removeObjectKey(path, key);
        }}
      />
    </div>
  );
}

interface FormNodeViewProps {
  node: FormNode;
  errorsByPath: Record<string, string[]>;
  editorTypeByPath: Record<string, FieldEditorType>;
  onPrimitiveChange: (path: PathSegment[], rawValue: string, type: JsonValueType) => void;
  onTypeChange: (path: PathSegment[], type: FieldEditorType) => void;
  onAddArrayItem: (path: PathSegment[]) => void;
  onRemoveArrayItem: (path: PathSegment[], index: number) => void;
  onAddObjectKey: (path: PathSegment[], key: string, valueType: FieldEditorType) => boolean;
  onRemoveObjectKey: (path: PathSegment[], key: string) => boolean;
}

function FormNodeView(props: FormNodeViewProps): ReactElement {
  const {
    node,
    errorsByPath,
    editorTypeByPath,
    onPrimitiveChange,
    onTypeChange,
    onAddArrayItem,
    onRemoveArrayItem,
    onAddObjectKey,
    onRemoveObjectKey,
  } = props;
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyType, setNewKeyType] = useState<FieldEditorType>("string");
  const [addKeyError, setAddKeyError] = useState("");

  const submitAddObjectKey = (): void => {
    const added = onAddObjectKey(node.path, newKeyName, newKeyType);
    if (!added) {
      setAddKeyError("Key already exists or is invalid");
      return;
    }

    setNewKeyName("");
    setNewKeyType("string");
    setAddKeyError("");
    setIsAddingKey(false);
  };

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
          {node.valueType === "object" && (
            <>
              <button
                type="button"
                style={styles.actionButton}
                onClick={() => {
                  setIsAddingKey((prev) => !prev);
                  setAddKeyError("");
                }}
              >
                {isAddingKey ? "Close" : "Add Key"}
              </button>
              {isAddingKey && (
                <div style={styles.addKeyRow}>
                  <input
                    type="text"
                    value={newKeyName}
                    placeholder="newKey"
                    onChange={(event) => {
                      setNewKeyName(event.target.value);
                      if (addKeyError) {
                        setAddKeyError("");
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        submitAddObjectKey();
                      }
                    }}
                    style={styles.input}
                  />
                  <select
                    value={newKeyType}
                    onChange={(event) => setNewKeyType(event.target.value as FieldEditorType)}
                    style={styles.select}
                  >
                    <option value="string">string</option>
                    <option value="textarea">textarea</option>
                    <option value="textEditor">text editor</option>
                    <option value="datetime">datetime</option>
                    <option value="number">number</option>
                    <option value="boolean">boolean</option>
                    <option value="null">null</option>
                    <option value="object">object</option>
                    <option value="array">array</option>
                  </select>
                  <button
                    type="button"
                    style={styles.actionButton}
                    onClick={submitAddObjectKey}
                  >
                    Add
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        {addKeyError && <div style={styles.errorText}>{addKeyError}</div>}
        {isExpanded && (
          <div style={styles.sectionChildren}>
            {node.children.map((child) => (
              <div key={child.id} style={styles.childRow}>
                <FormNodeView
                  node={child}
                  errorsByPath={errorsByPath}
                  editorTypeByPath={editorTypeByPath}
                  onPrimitiveChange={onPrimitiveChange}
                  onTypeChange={onTypeChange}
                  onAddArrayItem={onAddArrayItem}
                  onRemoveArrayItem={onRemoveArrayItem}
                  onAddObjectKey={onAddObjectKey}
                  onRemoveObjectKey={onRemoveObjectKey}
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
                {node.valueType === "object" && typeof child.path[child.path.length - 1] === "string" && (
                  <button
                    type="button"
                    style={styles.removeButton}
                    onClick={() => onRemoveObjectKey(node.path, child.path[child.path.length - 1] as string)}
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
  const selectedEditorType = editorTypeByPath[pathToKey(node.path)] ?? node.valueType;

  return (
    <div>
      <div style={styles.fieldRow}>
        <label style={styles.label}>{node.label}</label>
        <select
          value={selectedEditorType}
          onChange={(event) => onTypeChange(node.path, event.target.value as FieldEditorType)}
          style={styles.select}
        >
          <option value="string">string</option>
          <option value="textarea">textarea</option>
          <option value="textEditor">text editor</option>
          <option value="datetime">datetime</option>
          <option value="number">number</option>
          <option value="boolean">boolean</option>
          <option value="null">null</option>
          <option value="object">object</option>
          <option value="array">array</option>
        </select>
        {selectedEditorType === "boolean" ? (
          <select
            value={String(Boolean(node.value))}
            onChange={(event) => onPrimitiveChange(node.path, event.target.value, node.valueType)}
            style={styles.select}
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        ) : selectedEditorType === "null" ? (
          <input type="text" disabled value="null" style={styles.inputDisabled} />
        ) : selectedEditorType === "textarea" ? (
          <textarea
            value={String(node.value ?? "")}
            onChange={(event) => onPrimitiveChange(node.path, event.target.value, "string")}
            style={styles.textarea}
            rows={4}
          />
        ) : selectedEditorType === "datetime" ? (
          <input
            type="datetime-local"
            value={String(node.value ?? "")}
            onChange={(event) => onPrimitiveChange(node.path, event.target.value, "string")}
            style={styles.input}
          />
        ) : selectedEditorType === "textEditor" ? (
          <div style={styles.textEditorWrapper}>
            <RichTextEditor
              value={String(node.value ?? "")}
              onChange={(value) => onPrimitiveChange(node.path, value, "string")}
              placeholder="Start typing..."
              height="220px"
            />
          </div>
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

function isStringEditorType(type: FieldEditorType): type is "textarea" | "datetime" | "textEditor" {
  return type === "textarea" || type === "datetime" || type === "textEditor";
}

function toJsonValueType(type: FieldEditorType): JsonValueType {
  if (isStringEditorType(type)) {
    return "string";
  }

  return type;
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
    flexWrap: "wrap",
  },
  addKeyRow: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    flexWrap: "wrap",
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
  textarea: {
    padding: "6px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    minHeight: "84px",
    resize: "vertical",
    fontFamily: "inherit",
  },
  textEditorWrapper: {
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    overflow: "hidden",
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
