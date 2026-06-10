# esc-json-form-angular

Angular renderer for JSON form editing.

## Install

```bash
npm install esc-json-form-angular esc-json-form-core
```

## Usage

Standalone component import:

```ts
import { Component } from "@angular/core";
import { JsonFormEditorComponent } from "esc-json-form-angular";
import { JsonSchemaNode } from "esc-json-form-core";

const schema: JsonSchemaNode = {
  type: "object",
  properties: {
    name: { type: "string", rules: { required: true } },
    age: { type: "number", rules: { min: 1 } },
  },
};

@Component({
  selector: "app-root",
  standalone: true,
  imports: [JsonFormEditorComponent],
  template: `
    <esc-json-form-editor
      [value]="json"
      [schema]="schema"
      (valueChange)="json = $event"
      (validationChange)="errors = $event"
    ></esc-json-form-editor>
  `,
})
export class AppComponent {
  schema = schema;
  errors = [];
  json = {
    name: "test",
    age: 2,
    profile: {
      active: true,
    },
  };
}
```

## Getter / Setter

`JsonFormEditorComponent` exposes:

- `getJsonValue()`
- `setJsonValue(nextValue)`
- `validationChange` output event

## Supported Field Types

Type dropdown options in the Angular renderer:

- `string`
- `textarea` (string editor mode)
- `text editor` (extended multi-line string editor mode)
- `datetime` (datetime-local string mode)
- `number`
- `boolean`
- `null`
- `object`
- `array`

Additional notes:

- `object` and `array` are rendered as expandable sections.
- `date` is not a dedicated built-in field type yet. Use `string` for date values.
