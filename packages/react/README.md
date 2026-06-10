# esc-json-form-react

React/Next.js renderer for JSON form editing.

## Install

```bash
npm install esc-json-form-react esc-json-form-core
```

## Usage

```tsx
import { useState } from "react";
import { JsonFormEditor } from "esc-json-form-react";
import { JsonSchemaNode } from "esc-json-form-core";

const schema: JsonSchemaNode = {
  type: "object",
  properties: {
    name: { type: "string", rules: { required: true } },
    age: { type: "number", rules: { min: 1 } },
  },
};

export default function Demo() {
  const [json, setJson] = useState({
    name: "test",
    age: 2,
    address: {
      city: "NY",
      zip: 10001,
    },
  });

  return <JsonFormEditor value={json} onChange={setJson} schema={schema} />;
}
```

This renders fields like:

- `name` as type `string`
- `age` as type `number`
- nested objects/arrays as expandable sections
- array add/remove controls
- schema validation messages

## Programmatic Store

```tsx
import { createReactJsonFormStore } from "esc-json-form-react";

const store = createReactJsonFormStore({ name: "test", age: 2 });
const value = store.getValue();
store.setAtPath(["age"], 10);
```
