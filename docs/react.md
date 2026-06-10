# React Usage

`esc-editor` is automatically installed as a transitive dependency of `esc-json-form-react`.

```tsx
import { useState } from "react";
import { JsonFormEditor } from "esc-json-form-react";

export default function Page() {
  const [json, setJson] = useState({
    name: "test",
    age: 2,
    tags: ["alpha"],
  });

  return <JsonFormEditor value={json} onChange={setJson} title="Sample" />;
}
```

## Optional Validation Schema

```tsx
<JsonFormEditor value={json} onChange={setJson} schema={schema} />
```

If `schema` is omitted, no validation messages are shown.

## Editor Controls

- Use Add Key on object sections to insert new properties.
- Use Add Item on array sections to append entries.
- For string fields, you can switch the type dropdown to `textarea` for multi-line editing.

## Field Types

Type dropdown options:

- `string`
- `textarea` (string editor mode)
- `text editor` (rich text mode via `esc-editor`)
- `datetime` (datetime-local string mode)
- `number`
- `boolean`
- `null`
- `object`
- `array`

Notes:

- `object` and `array` are section nodes with Add Key / Add Item controls.
- `date` is not a dedicated built-in field type yet. Use `string` for date values.
