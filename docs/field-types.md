# Field Types

This page summarizes JSON value types and editor modes supported across packages.

## JSON Value Types

Core `JsonValueType` supports:

- `string`
- `number`
- `boolean`
- `null`
- `object`
- `array`

## React Editor Modes

React renderer supports these dropdown modes:

- `string`
- `textarea`
- `text editor` (powered by `esc-editor`)
- `datetime` (`datetime-local` input)
- `number`
- `boolean`
- `null`
- `object`
- `array`

Notes:

- `textarea`, `text editor`, and `datetime` are string editor modes and are stored as JSON `string` values.
- `esc-editor` is a transitive dependency of `esc-json-form-react`; users do not need to install it separately.

## Angular Editor Modes

Angular renderer currently supports:

- `string`
- `textarea`
- `text editor` (extended multi-line string editor mode)
- `datetime` (`datetime-local` input)
- `number`
- `boolean`
- `null`
- `object`
- `array`

## Date/Datetime

There is no separate core `date` type.

- Use JSON `string` values for date/time content.
- In React and Angular, `datetime` mode provides `datetime-local` UI while storing a string value.
