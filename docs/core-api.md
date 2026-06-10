# Core API

Use `esc-json-form-core` for framework-agnostic control.

```ts
import { createJsonFormStore } from "esc-json-form-core";

const store = createJsonFormStore({ name: "test", age: 2 });

store.getValue();
store.setValue({ name: "new", age: 3 });

store.getAtPath(["age"]);
store.setAtPath(["age"], 10);

store.setTypeAtPath(["age"], "string");

store.addArrayItem(["items"]);
store.removeArrayItem(["items"], 0);
store.addObjectKey(["profile"], "bio", "string");

store.validate();
```

## Schema Is Optional

Validation only runs when you set a schema:

```ts
store.setSchema({
  type: "object",
  properties: {
    age: { type: "number", rules: { min: 1 } },
  },
});
```

## Supported Value Types

Core `JsonValueType` supports:

- `string`
- `number`
- `boolean`
- `null`
- `object`
- `array`

Renderer-specific editor mode:

- React/Angular add a `textarea` UI mode for strings.

Date values:

- `date` is not a separate core type.
- Store dates as `string` values (for example, ISO format).
