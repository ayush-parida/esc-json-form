# React Usage

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
