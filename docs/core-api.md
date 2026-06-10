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
