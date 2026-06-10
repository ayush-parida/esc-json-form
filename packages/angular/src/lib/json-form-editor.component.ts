import { CommonModule } from "@angular/common";
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from "@angular/core";
import {
  castPrimitiveInput,
  createJsonFormStore,
  FormNode,
  JsonFormStore,
  JsonSchemaNode,
  JsonValue,
  JsonValueType,
  PathSegment,
  ValidationError,
} from "esc-json-form-core";
import { JsonFormNodeComponent } from "./json-form-node.component";

@Component({
  selector: "esc-json-form-editor",
  standalone: true,
  imports: [CommonModule, JsonFormNodeComponent],
  template: `
    <div class="editor-container">
      <h3>{{ title }}</h3>
      <esc-json-form-node
        [node]="rootNode"
        [errors]="errors"
        (primitiveChanged)="
          onPrimitiveValueChanged(
            $event.path,
            $event.rawValue,
            $event.valueType
          )
        "
        (typeChanged)="onTypeChanged($event.path, $event.valueType)"
        (addArrayItem)="onAddArrayItem($event)"
        (removeArrayItem)="onRemoveArrayItem($event.path, $event.index)"
      ></esc-json-form-node>
    </div>
  `,
  styles: [
    `
      .editor-container {
        border: 1px solid #d1d5db;
        border-radius: 8px;
        padding: 16px;
        background-color: #f9fafb;
        font-family: "Segoe UI", sans-serif;
      }

      h3 {
        margin: 0 0 12px;
      }
    `,
  ],
})
export class JsonFormEditorComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) value!: JsonValue;
  @Input() schema?: JsonSchemaNode;

  @Input() title = "JSON Form Editor";

  @Output() valueChange = new EventEmitter<JsonValue>();
  @Output() validationChange = new EventEmitter<ValidationError[]>();

  rootNode: FormNode = {
    id: "root",
    key: "root",
    label: "JSON Root",
    path: [],
    kind: "section",
    valueType: "object",
    children: [],
  };

  private store: JsonFormStore | null = null;
  private unsubscribe: (() => void) | null = null;
  errors: ValidationError[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["value"]) {
      if (!this.store) {
        this.store = createJsonFormStore(this.value, this.schema);
        this.unsubscribe = this.store.subscribe((nextValue: JsonValue) => {
          this.rootNode = this.store?.getTree() ?? this.rootNode;
          this.errors = this.store?.validate() ?? [];
          this.validationChange.emit(this.errors);
          this.valueChange.emit(nextValue);
        });
      } else {
        this.store.setValue(this.value);
      }

      this.rootNode = this.store.getTree();
      this.errors = this.store.validate();
      this.validationChange.emit(this.errors);
    }

    if (changes["schema"] && this.store) {
      this.store.setSchema(this.schema);
      this.errors = this.store.validate();
      this.validationChange.emit(this.errors);
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe?.();
  }

  getJsonValue(): JsonValue {
    return this.store?.getValue() ?? this.value;
  }

  setJsonValue(nextValue: JsonValue): void {
    if (!this.store) {
      this.store = createJsonFormStore(nextValue, this.schema);
    }

    this.store.setValue(nextValue);
    this.rootNode = this.store.getTree();
    this.errors = this.store.validate();
    this.validationChange.emit(this.errors);
  }

  onPrimitiveValueChanged(
    path: PathSegment[],
    rawValue: string,
    valueType: JsonValueType,
  ): void {
    if (!this.store) {
      return;
    }

    this.store.setAtPath(path, castPrimitiveInput(rawValue, valueType));
  }

  onTypeChanged(path: PathSegment[], valueType: JsonValueType): void {
    if (!this.store) {
      return;
    }

    this.store.setTypeAtPath(path, valueType);
  }

  onAddArrayItem(path: PathSegment[]): void {
    if (!this.store) {
      return;
    }

    this.store.addArrayItem(path);
  }

  onRemoveArrayItem(path: PathSegment[], index: number): void {
    if (!this.store) {
      return;
    }

    this.store.removeArrayItem(path, index);
  }
}
