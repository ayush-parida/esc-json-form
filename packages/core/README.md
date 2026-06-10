# esc-json-form-core

Framework-agnostic JSON form engine.

## Install

```bash
npm install esc-json-form-core
```

## Usage

```ts
import { createJsonFormStore } from "esc-json-form-core";

const store = createJsonFormStore({ name: "test", age: 2 });

// Getter
const data = store.getValue();

// Setter (full JSON)
store.setValue({ name: "new", age: 3 });

// Setter (field path)
store.setAtPath(["age"], 42);

// Getter (field path)
const age = store.getAtPath(["age"]);

// Typed form tree (with nested sections)
const tree = store.getTree();

// Array helpers
store.addArrayItem(["tags"]);
store.removeArrayItem(["tags"], 0);

// Validation
store.setSchema({
  type: "object",
  properties: {
    name: { type: "string", rules: { required: true, minLength: 2 } },
    age: { type: "number", rules: { min: 1 } },
  },
});

const errors = store.validate();
```

## API

- `createJsonFormStore(initialValue, schema?)`
- `store.getValue()`
- `store.setValue(nextValue)`
- `store.getAtPath(path)`
- `store.setAtPath(path, value)`
- `store.setTypeAtPath(path, valueType)`
- `store.addArrayItem(path, item?)`
- `store.removeArrayItem(path, index)`
- `store.setSchema(schema?)`
- `store.validate()`
- `store.getTree()`
- `store.subscribe(listener)`
