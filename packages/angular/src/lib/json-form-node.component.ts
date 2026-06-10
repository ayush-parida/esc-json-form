import { CommonModule } from "@angular/common";
import {
  Component,
  EventEmitter,
  Input,
  Output,
  forwardRef,
} from "@angular/core";
import {
  FormNode,
  JsonValueType,
  PathSegment,
  ValidationError,
} from "esc-json-form-core";

type FieldEditorType = JsonValueType | "textarea" | "datetime" | "textEditor";

@Component({
  selector: "esc-json-form-node",
  standalone: true,
  imports: [CommonModule, forwardRef(() => JsonFormNodeComponent)],
  template: `
    <div *ngIf="node.kind === 'section'" class="section">
      <div class="section-header">
        <button
          type="button"
          class="toggle-btn"
          (click)="isExpanded = !isExpanded"
        >
          {{ isExpanded ? "-" : "+" }}
        </button>
        <strong>{{ node.label }}</strong>
        <span class="section-type">{{ node.valueType }}</span>
        <button
          *ngIf="node.valueType === 'array'"
          type="button"
          class="action-btn"
          (click)="addArrayItem.emit(node.path)"
        >
          Add Item
        </button>
        <button
          *ngIf="node.valueType === 'object'"
          type="button"
          class="action-btn"
          (click)="toggleAddObjectKey()"
        >
          {{ isAddingKey ? "Close" : "Add Key" }}
        </button>
      </div>
      <div
        *ngIf="isAddingKey && node.valueType === 'object'"
        class="add-key-row"
      >
        <input
          type="text"
          placeholder="newKey"
          [value]="newKeyName"
          (input)="onAddKeyNameChanged($any($event.target).value)"
          (keydown.enter)="onAddObjectKey(node.path)"
        />
        <select
          [value]="newKeyType"
          (change)="onAddKeyTypeChanged($any($event.target).value)"
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
          class="action-btn"
          (click)="onAddObjectKey(node.path)"
        >
          Add
        </button>
      </div>
      <div *ngIf="addKeyError" class="error-text">{{ addKeyError }}</div>
      <div *ngIf="isExpanded" class="section-children">
        <div *ngFor="let child of node.children" class="child-row">
          <esc-json-form-node
            [node]="child"
            [errors]="errors"
            (primitiveChanged)="primitiveChanged.emit($event)"
            (typeChanged)="typeChanged.emit($event)"
            (addArrayItem)="addArrayItem.emit($event)"
            (removeArrayItem)="removeArrayItem.emit($event)"
            (addObjectKey)="addObjectKey.emit($event)"
            (removeObjectKey)="removeObjectKey.emit($event)"
          ></esc-json-form-node>
          <button
            *ngIf="
              node.valueType === 'array' &&
              isArrayIndex(child.path[child.path.length - 1])
            "
            type="button"
            class="remove-btn"
            (click)="
              onRemoveChild(node.path, child.path[child.path.length - 1])
            "
          >
            Remove
          </button>
          <button
            *ngIf="
              node.valueType === 'object' &&
              isObjectKey(child.path[child.path.length - 1])
            "
            type="button"
            class="remove-btn"
            (click)="
              onRemoveObjectKey(node.path, child.path[child.path.length - 1])
            "
          >
            Remove
          </button>
        </div>
      </div>
    </div>

    <div *ngIf="node.kind === 'field'">
      <div class="field-row">
        <label>{{ node.label }}</label>

        <select
          [value]="selectedEditorType(node.path, node.valueType)"
          (change)="onTypeChanged(node.path, $any($event.target).value)"
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

        <select
          *ngIf="selectedEditorType(node.path, node.valueType) === 'boolean'"
          [value]="toBooleanValue(node.value)"
          (change)="
            onPrimitiveChanged(
              node.path,
              $any($event.target).value,
              node.valueType
            )
          "
        >
          <option value="true">true</option>
          <option value="false">false</option>
        </select>

        <input
          *ngIf="selectedEditorType(node.path, node.valueType) === 'null'"
          [value]="'null'"
          disabled
        />

        <input
          *ngIf="
            selectedEditorType(node.path, node.valueType) === 'string' ||
            selectedEditorType(node.path, node.valueType) === 'number'
          "
          [type]="
            selectedEditorType(node.path, node.valueType) === 'number'
              ? 'number'
              : 'text'
          "
          [value]="node.value"
          (input)="
            onPrimitiveChanged(
              node.path,
              $any($event.target).value,
              selectedEditorType(node.path, node.valueType) === 'number'
                ? 'number'
                : 'string'
            )
          "
        />

        <textarea
          *ngIf="selectedEditorType(node.path, node.valueType) === 'textarea'"
          [value]="node.value"
          rows="4"
          (input)="
            onPrimitiveChanged(node.path, $any($event.target).value, 'string')
          "
        ></textarea>

        <input
          *ngIf="selectedEditorType(node.path, node.valueType) === 'datetime'"
          type="datetime-local"
          [value]="node.value"
          (input)="
            onPrimitiveChanged(node.path, $any($event.target).value, 'string')
          "
        />

        <textarea
          *ngIf="selectedEditorType(node.path, node.valueType) === 'textEditor'"
          [value]="node.value"
          rows="8"
          (input)="
            onPrimitiveChanged(node.path, $any($event.target).value, 'string')
          "
        ></textarea>
      </div>
      <div *ngIf="fieldError(node.path)" class="error-text">
        {{ fieldError(node.path) }}
      </div>
    </div>
  `,
  styles: [
    `
      .section {
        border-left: 2px solid #93c5fd;
        margin-left: 8px;
        padding-left: 10px;
        margin-bottom: 10px;
      }

      .section-header {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
      }

      .add-key-row {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
        margin-top: 8px;
      }

      .section-type {
        color: #6b7280;
        font-size: 12px;
      }

      .section-children {
        margin-top: 8px;
      }

      .field-row {
        display: grid;
        grid-template-columns: 1fr 120px 1.5fr;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
      }

      .child-row {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: start;
        gap: 8px;
      }

      .action-btn {
        border: 1px solid #86efac;
        background-color: #f0fdf4;
      }

      .remove-btn {
        border: 1px solid #fca5a5;
        background-color: #fef2f2;
        padding: 4px 8px;
        height: fit-content;
      }

      .error-text {
        color: #b91c1c;
        font-size: 12px;
        margin: 2px 0 8px;
      }

      input,
      textarea,
      select,
      .toggle-btn {
        padding: 6px;
        border-radius: 6px;
        border: 1px solid #d1d5db;
        background-color: #fff;
      }

      .toggle-btn {
        width: 24px;
        height: 24px;
        padding: 0;
        cursor: pointer;
      }
    `,
  ],
})
export class JsonFormNodeComponent {
  @Input({ required: true }) node!: FormNode;
  @Input() errors: ValidationError[] = [];

  @Output() primitiveChanged = new EventEmitter<{
    path: PathSegment[];
    rawValue: string;
    valueType: JsonValueType;
  }>();

  @Output() typeChanged = new EventEmitter<{
    path: PathSegment[];
    valueType: JsonValueType;
  }>();

  @Output() addArrayItem = new EventEmitter<PathSegment[]>();
  @Output() removeArrayItem = new EventEmitter<{
    path: PathSegment[];
    index: number;
  }>();
  @Output() addObjectKey = new EventEmitter<{
    path: PathSegment[];
    key: string;
    valueType: JsonValueType;
  }>();
  @Output() removeObjectKey = new EventEmitter<{
    path: PathSegment[];
    key: string;
  }>();

  isExpanded = true;
  isAddingKey = false;
  newKeyName = "";
  newKeyType: FieldEditorType = "string";
  addKeyError = "";
  private editorTypeByPath: Record<string, FieldEditorType> = {};

  toBooleanValue(value: unknown): string {
    return String(Boolean(value));
  }

  onPrimitiveChanged(
    path: PathSegment[],
    rawValue: string,
    valueType: JsonValueType,
  ): void {
    this.primitiveChanged.emit({
      path,
      rawValue,
      valueType,
    });
  }

  onTypeChanged(path: PathSegment[], valueType: FieldEditorType): void {
    const key = pathToKey(path);

    if (isStringEditorType(valueType)) {
      this.editorTypeByPath[key] = valueType;
      this.typeChanged.emit({ path, valueType: "string" });
      return;
    }

    delete this.editorTypeByPath[key];
    this.typeChanged.emit({ path, valueType });
  }

  onRemoveChild(path: PathSegment[], index: unknown): void {
    if (typeof index !== "number") {
      return;
    }

    this.removeArrayItem.emit({ path, index });
  }

  onRemoveObjectKey(path: PathSegment[], key: unknown): void {
    if (typeof key !== "string") {
      return;
    }

    this.removeObjectKey.emit({ path, key });
  }

  isArrayIndex(value: unknown): boolean {
    return typeof value === "number";
  }

  isObjectKey(value: unknown): boolean {
    return typeof value === "string";
  }

  fieldError(path: PathSegment[]): string {
    const match = this.errors.find((error) => samePath(error.path, path));
    return match?.message ?? "";
  }

  selectedEditorType(
    path: PathSegment[],
    fallback: JsonValueType,
  ): FieldEditorType {
    return this.editorTypeByPath[pathToKey(path)] ?? fallback;
  }

  toggleAddObjectKey(): void {
    this.isAddingKey = !this.isAddingKey;
    this.addKeyError = "";
  }

  onAddKeyNameChanged(value: string): void {
    this.newKeyName = value;
    if (this.addKeyError) {
      this.addKeyError = "";
    }
  }

  onAddKeyTypeChanged(value: FieldEditorType): void {
    this.newKeyType = value;
  }

  onAddObjectKey(path: PathSegment[]): void {
    const normalizedKey = this.newKeyName.trim();
    if (!normalizedKey) {
      this.addKeyError = "Key already exists or is invalid";
      return;
    }

    if (
      this.node.kind === "section" &&
      this.node.children.some((child) => child.key === normalizedKey)
    ) {
      this.addKeyError = "Key already exists or is invalid";
      return;
    }

    this.addObjectKey.emit({
      path,
      key: normalizedKey,
      valueType: toJsonValueType(this.newKeyType),
    });

    const childPath = [...path, normalizedKey];
    if (isStringEditorType(this.newKeyType)) {
      this.editorTypeByPath[pathToKey(childPath)] = this.newKeyType;
    }

    this.newKeyName = "";
    this.newKeyType = "string";
    this.isAddingKey = false;
    this.addKeyError = "";
  }
}

function isStringEditorType(
  type: FieldEditorType,
): type is "textarea" | "datetime" | "textEditor" {
  return type === "textarea" || type === "datetime" || type === "textEditor";
}

function toJsonValueType(type: FieldEditorType): JsonValueType {
  if (isStringEditorType(type)) {
    return "string";
  }

  return type;
}

function pathToKey(path: PathSegment[]): string {
  return path.map((segment) => String(segment)).join(".");
}

function samePath(a: PathSegment[], b: PathSegment[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}
