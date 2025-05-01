# @cotter45/keycase

Recursively transforms all keys in a JavaScript object (including nested objects and arrays) into one of four common casings: camelCase, snake_case, PascalCase, or kebab-case. Written as a native Node.js addon in Rust via napi-rs for high performance, with both synchronous and Promise-based async APIs.

## Install

```bash
npm install @cotter45/keycase
```

#### or

```bash
yarn add @cotter45/keycase
```

## Usage

```javascript
import { transform, transformAsync } from "@cotter45/keycase";

// Sync

const obj = {
  first_name: "Alice",
  user_profile: { join_date: "2024-01-15" },
  "kebab-key": [{ deep_value: 42 }],
};

const camel = transform(obj, "camel");
/**
{
firstName: 'Alice',
userProfile: { joinDate: '2024-01-15' },
kebabKey: [{ deepValue: 42 }]
}
*/

// Async

(async () => {
  const snake = await transformAsync(obj, "snake");
  // {
  // first_name: 'Alice',
  // user_profile: { join_date: '2024-01-15' },
  // kebab_key: [{ deep_value: 42 }]
  // }
})();
```

## API

### transform(obj, casing)

- **Parameters**
  - `obj` (_object_): Any nested object/array
  - `casing` (_string_): `'camel' | 'snake' | 'pascal' | 'kebab'`
- **Returns**: A new object with all keys converted

### transformAsync(obj, casing)

- Exactly the same parameters as `transform`
- **Returns** a `Promise<object>`—runs off the main thread

## Supported Cases

- **camel** → `firstName`
- **snake** → `first_name`
- **pascal** → `FirstName`
- **kebab** → `first-name`

### Given this input

```js
const obj = {
  first_name: "Alice",
  lastName: "Smith",
  "kebab-key": 123,
};
```

#### Casing Output

```javascript
camel { firstName: 'Alice', lastName: 'Smith', kebabKey: 123 }
snake { first_name: 'Alice', last_name: 'Smith', kebab_key: 123 }
pascal { FirstName: 'Alice', LastName: 'Smith', KebabKey: 123 }
kebab { 'first-name': 'Alice', 'last-name': 'Smith', 'kebab-key': 123 }
```

## Examples from Tests

```javascript
import test from "ava";
import { transform } from "@cotter45/keycase";

// 4) Mixed key styles and deep nesting
const obj4 = {
  "kebab-key": {
    PascalKey: [
      { snake_case: 10, "another-kebab": false },
      { deep_nested: { inner_key: [1, 2, 3] } },
    ],
  },
  MixedCaseKey: "hello",
};

test("camel case", (t) => {
  t.deepEqual(transform(obj4, "camel"), {
    kebabKey: {
      pascalKey: [
        { snakeCase: 10, anotherKebab: false },
        { deepNested: { innerKey: [1, 2, 3] } },
      ],
    },
    mixedCaseKey: "hello",
  });
});
```

## Performance

- Sync: Large (~4 MB) objects transform in ~160 – 200 ms on modern hardware.
- Async: Offloads the same work to a worker thread; adds ~50 ms scheduling overhead but keeps Node’s event loop free.

Under the hood, key strings are cached globally to avoid repeated conversions, and large arrays/objects are processed in parallel where beneficial.

## Contributing

1. Fork the repo
2. yarn install && yarn build
3. Add tests to **test**/\*_/_.mjs
4. Submit a PR

## License

MIT
