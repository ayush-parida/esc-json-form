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
      </div>
      <div *ngIf="isExpanded" class="section-children">
        <div *ngFor="let child of node.children" class="child-row">
          <esc-json-form-node
            [node]="child"
            [errors]="errors"
            (primitiveChanged)="primitiveChanged.emit($event)"
            (typeChanged)="typeChanged.emit($event)"
            (addArrayItem)="addArrayItem.emit($event)"
            (removeArrayItem)="removeArrayItem.emit($event)"
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
        </div>
      </div>
    </div>

    <div *ngIf="node.kind === 'field'">
      <div class="field-row">
        <label>{{ node.label }}</label>

        <select
          [value]="node.valueType"
          (change)="onTypeChanged(node.path, $any($event.target).value)"
        >
          <option value="string">string</option>
          <option value="number">number</option>
          <option value="boolean">boolean</option>
          <option value="null">null</option>
        </select>

        <select
          *ngIf="node.valueType === 'boolean'"
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

        <input *ngIf="node.valueType === 'null'" [value]="'null'" disabled />

        <input
          *ngIf="node.valueType === 'string' || node.valueType === 'number'"
          [type]="node.valueType === 'number' ? 'number' : 'text'"
          [value]="node.value"
          (input)="
            onPrimitiveChanged(
              node.path,
              $any($event.target).value,
              node.valueType
            )
          "
        />
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

  isExpanded = true;

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

  onTypeChanged(path: PathSegment[], valueType: JsonValueType): void {
    this.typeChanged.emit({ path, valueType });
  }

  onRemoveChild(path: PathSegment[], index: unknown): void {
    if (typeof index !== "number") {
      return;
    }

    this.removeArrayItem.emit({ path, index });
  }

  isArrayIndex(value: unknown): boolean {
    return typeof value === "number";
  }

  fieldError(path: PathSegment[]): string {
    const match = this.errors.find((error) => samePath(error.path, path));
    return match?.message ?? "";
  }
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
