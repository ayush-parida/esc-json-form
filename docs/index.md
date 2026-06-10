# ESC JSON Form

A multi-framework JSON editor library that converts JSON data into editable forms.

## Features

- Converts JSON primitives into typed form fields.
- Renders nested objects and arrays as sections.
- Array controls for add/remove.
- Optional schema-based validation.
- Works in React, Next.js, Angular, and any TypeScript runtime via core store.

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
