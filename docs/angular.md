# Angular Usage

```ts
import { Component } from "@angular/core";
import { JsonFormEditorComponent } from "esc-json-form-angular";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [JsonFormEditorComponent],
  template: `
    <esc-json-form-editor
      [value]="json"
      (valueChange)="json = $event"
    ></esc-json-form-editor>
  `,
})
export class AppComponent {
  json = { name: "test", age: 2 };
}
```

Schema input is optional:

```html
<esc-json-form-editor [value]="json"></esc-json-form-editor>
```

Editor controls include:

- Add Key for object sections.
- Add Item for array sections.
- `textarea` mode in the type dropdown for string fields.

## Field Types

Type dropdown options:

- `string`
- `textarea` (string editor mode)
- `number`
- `boolean`
- `null`

Notes:

- `object` and `array` are section nodes with Add Key / Add Item controls.
- `date` is not a dedicated built-in field type yet. Use `string` for date values.
