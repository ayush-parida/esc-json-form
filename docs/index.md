# ESC JSON Form

A multi-framework JSON editor library that converts JSON data into editable forms.

## Features

- Converts JSON primitives into typed form fields.
- Renders nested objects and arrays as sections.
- Object and array controls for add/remove.
- Textarea mode for string fields.
- Optional schema-based validation.
- Works in React, Next.js, Angular, and any TypeScript runtime via core store.

## Supported Field And Editor Types

See [Field Types](/field-types) for framework-specific details.

Supported JSON value types in the editor:

- `string`
- `number`
- `boolean`
- `null`
- `object` (rendered as a section)
- `array` (rendered as a section)

Additional editor mode:

- `textarea` for multi-line string editing (UI mode, internally still `string`)
- React renderer also supports `text editor` for rich text HTML editing via `esc-editor` (UI mode, internally still `string`)
- React renderer also supports `datetime` for datetime-local input (UI mode, internally still `string`)

Date values:

- There is no dedicated `date` JSON type or date picker field yet.
- Use `string` for date values (for example ISO strings like `2026-06-10`).

## Install

```bash
npm install esc-json-form-core
npm install esc-json-form-react
npm install esc-json-form-angular
```

## Example

```tsx
import { useState } from "react";
import { JsonFormEditor } from "esc-json-form-react";

export default function Demo() {
  const [json, setJson] = useState({ name: "test", age: 2 });
  return <JsonFormEditor value={json} onChange={setJson} title="JSON Form" />;
}
```
