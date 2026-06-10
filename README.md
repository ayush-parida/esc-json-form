# ESC JSON Form

A multi-framework JSON editor library that converts JSON structures into editable forms.

Input JSON:

{"name":"test","age":2}

Rendered as fields:

- name: input with type selector (string)
- age: input with type selector (number)

Nested objects and arrays are rendered as expandable sections.

Validation is supported through optional schema rules.

## Supported Field And Editor Types

Supported JSON value types:

- string
- number
- boolean
- null
- object (section)
- array (section)

Additional editor mode:

- textarea (for multi-line string editing; stored as string)
- text editor (rich text HTML editor mode via esc-editor; stored as string)
- datetime (datetime-local input mode; stored as string)

Date support:

- There is currently no dedicated date field type in the default renderer.
- Use string for date values (for example, ISO date strings).

## Packages

- esc-json-form-core: framework-agnostic JSON form engine and state store.
- esc-json-form-react: React and Next.js renderer.
- esc-json-form-angular: Angular component renderer.

## Install

Install only the package(s) you need:

- Core: npm install esc-json-form-core
- React/Next: npm install esc-json-form-react esc-json-form-core
- Angular: npm install esc-json-form-angular esc-json-form-core

## Core API (Getter/Setter)

Use the core store directly if you need full programmatic control:

import { createJsonFormStore } from "esc-json-form-core";

const store = createJsonFormStore({ name: "test", age: 2 });

const fullJson = store.getValue();
store.setValue({ name: "updated", age: 5 });

const age = store.getAtPath(["age"]);
store.setAtPath(["age"], 10);

store.setTypeAtPath(["age"], "string");

store.addArrayItem(["profile", "tags"]);
store.removeArrayItem(["profile", "tags"], 0);

const tree = store.getTree();

const errors = store.validate();

## React / Next.js

import { useState } from "react";
import { JsonFormEditor } from "esc-json-form-react";

export default function Page() {
const [json, setJson] = useState({
name: "test",
age: 2,
profile: {
city: "NY",
active: true,
},
});

    return <JsonFormEditor value={json} onChange={setJson} schema={schema} />;

}

## Angular

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
json = {
name: "test",
age: 2,
address: { city: "LA" },
};
}

The Angular component also exposes:

- getJsonValue()
- setJsonValue(nextValue)

## Sample App

Use the sample app to test nested sections, array add/remove, and schema validation:

- Install: npm install
- Build library packages: npm run build
- Start sample app: npm run sample:dev

The sample app is located at examples/react-sample.

## Release Workflow

Automated release workflow is configured via Changesets and GitHub Actions.

- Create changeset: npm run changeset
- Version packages: npm run version-packages
- Publish manually: npm run release

On push to main, the workflow in .github/workflows/release.yml creates release PRs and publishes with NPM_TOKEN.
