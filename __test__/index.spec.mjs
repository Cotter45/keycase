import test from "ava";

import { transform, transformAsync } from "../index.js";

// 1) Simple flat object
const obj1 = {
  first_name: "Alice",
  last_name: "Smith",
  age: 30,
};

// 2) Nested object
const obj2 = {
  user_id: 123,
  user_profile: {
    display_name: "alice_s",
    join_date: "2024-01-15",
  },
  is_active: true,
};

// 3) Array of objects
const obj3 = {
  records: [
    { record_id: 1, record_value: "foo" },
    { record_id: 2, record_value: "bar" },
  ],
  total_count: 2,
};

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

// 5) Very deep nested structure
const obj5 = {
  level_one: {
    level_two: {
      level_three: [
        {
          some_value: 42,
          another_value: {
            final_key: "end",
          },
        },
      ],
    },
  },
};

test("camel case test", (t) => {
  const result = transform(obj1, "camel");
  t.deepEqual(result, {
    firstName: "Alice",
    lastName: "Smith",
    age: 30,
  });

  const result2 = transform(obj2, "camel");
  t.deepEqual(result2, {
    userId: 123,
    userProfile: {
      displayName: "alice_s",
      joinDate: "2024-01-15",
    },
    isActive: true,
  });

  const result3 = transform(obj3, "camel");
  t.deepEqual(result3, {
    records: [
      { recordId: 1, recordValue: "foo" },
      { recordId: 2, recordValue: "bar" },
    ],
    totalCount: 2,
  });

  const result4 = transform(obj4, "camel");
  t.deepEqual(result4, {
    kebabKey: {
      pascalKey: [
        { snakeCase: 10, anotherKebab: false },
        { deepNested: { innerKey: [1, 2, 3] } },
      ],
    },
    mixedCaseKey: "hello",
  });

  const result5 = transform(obj5, "camel");
  t.deepEqual(result5, {
    levelOne: {
      levelTwo: {
        levelThree: [
          {
            someValue: 42,
            anotherValue: {
              finalKey: "end",
            },
          },
        ],
      },
    },
  });
});

test("snake case test", (t) => {
  const result = transform(obj1, "snake");
  t.deepEqual(result, {
    first_name: "Alice",
    last_name: "Smith",
    age: 30,
  });

  const result2 = transform(obj2, "snake");
  t.deepEqual(result2, {
    user_id: 123,
    user_profile: {
      display_name: "alice_s",
      join_date: "2024-01-15",
    },
    is_active: true,
  });

  const result3 = transform(obj3, "snake");
  t.deepEqual(result3, {
    records: [
      { record_id: 1, record_value: "foo" },
      { record_id: 2, record_value: "bar" },
    ],
    total_count: 2,
  });

  const result4 = transform(obj4, "snake");
  t.deepEqual(result4, {
    kebab_key: {
      pascal_key: [
        { snake_case: 10, another_kebab: false },
        { deep_nested: { inner_key: [1, 2, 3] } },
      ],
    },
    mixed_case_key: "hello",
  });

  const result5 = transform(obj5, "snake");
  t.deepEqual(result5, {
    level_one: {
      level_two: {
        level_three: [
          {
            some_value: 42,
            another_value: {
              final_key: "end",
            },
          },
        ],
      },
    },
  });
});

test("kebab case test", (t) => {
  const result = transform(obj1, "kebab");
  t.deepEqual(result, {
    "first-name": "Alice",
    "last-name": "Smith",
    age: 30,
  });

  const result2 = transform(obj2, "kebab");
  t.deepEqual(result2, {
    "user-id": 123,
    "user-profile": {
      "display-name": "alice_s",
      "join-date": "2024-01-15",
    },
    "is-active": true,
  });

  const result3 = transform(obj3, "kebab");
  t.deepEqual(result3, {
    records: [
      { "record-id": 1, "record-value": "foo" },
      { "record-id": 2, "record-value": "bar" },
    ],
    "total-count": 2,
  });

  const result4 = transform(obj4, "kebab");
  t.deepEqual(result4, {
    "kebab-key": {
      "pascal-key": [
        { "snake-case": 10, "another-kebab": false },
        { "deep-nested": { "inner-key": [1, 2, 3] } },
      ],
    },
    "mixed-case-key": "hello",
  });

  const result5 = transform(obj5, "kebab");
  t.deepEqual(result5, {
    "level-one": {
      "level-two": {
        "level-three": [
          {
            "some-value": 42,
            "another-value": {
              "final-key": "end",
            },
          },
        ],
      },
    },
  });
});

test("pascal case test", (t) => {
  const result = transform(obj1, "pascal");
  t.deepEqual(result, {
    FirstName: "Alice",
    LastName: "Smith",
    Age: 30,
  });

  const result2 = transform(obj2, "pascal");
  t.deepEqual(result2, {
    UserId: 123,
    UserProfile: {
      DisplayName: "alice_s",
      JoinDate: "2024-01-15",
    },
    IsActive: true,
  });

  const result3 = transform(obj3, "pascal");
  t.deepEqual(result3, {
    Records: [
      { RecordId: 1, RecordValue: "foo" },
      { RecordId: 2, RecordValue: "bar" },
    ],
    TotalCount: 2,
  });

  const result4 = transform(obj4, "pascal");
  t.deepEqual(result4, {
    KebabKey: {
      PascalKey: [
        { SnakeCase: 10, AnotherKebab: false },
        { DeepNested: { InnerKey: [1, 2, 3] } },
      ],
    },
    MixedCaseKey: "hello",
  });

  const result5 = transform(obj5, "pascal");
  t.deepEqual(result5, {
    LevelOne: {
      LevelTwo: {
        LevelThree: [
          {
            SomeValue: 42,
            AnotherValue: {
              FinalKey: "end",
            },
          },
        ],
      },
    },
  });
});

// function generateTestObject(depth, breadth) {
//   if (depth === 0) {
//     return {
//       num_value: Math.random(),
//       str_value: "lorem_ipsum",
//       bool_value: Math.random() > 0.5,
//       nested_array: [1, 2, 3, { deep_key: "foo_bar" }],
//     };
//   }
//   const obj = {};
//   for (let i = 0; i < breadth; i++) {
//     const keyStyles = [
//       `snake_case_key_${i}`,
//       `kebab-key-${i}`,
//       `PascalKey${i}`,
//       `mixedCaseKey${i}`,
//     ];
//     const key = keyStyles[i % keyStyles.length];
//     obj[key] = generateTestObject(depth - 1, breadth);
//   }
//   return obj;
// }

// const bigObj = generateTestObject(5, 8);
// console.log(
//   "Big object size:",
//   JSON.stringify(bigObj).length / 1024 / 1024,
//   "MB"
// );

// test("performance on massive object", async (t) => {
//   t.timeout(30_000);
//   console.time("big-transform-1");
//   const out = transform(bigObj, "camel");
//   console.timeEnd("big-transform-1");
//   t.truthy(out);

//   console.time("big-transform-2");
//   const out2 = transform(bigObj, "snake");
//   console.timeEnd("big-transform-2");
//   t.truthy(out2);
//   console.time("big-transform-3");

//   const out3 = transform(bigObj, "kebab");
//   console.timeEnd("big-transform-3");
//   t.truthy(out3);

//   console.time("big-transform-4");
//   const out4 = transform(bigObj, "pascal");
//   console.timeEnd("big-transform-4");
//   t.truthy(out4);
// });

// test("performance from caching", async (t) => {
//   t.timeout(30_000);
//   console.time("cached-big-transform-1");
//   const out = transform(bigObj, "camel");
//   console.timeEnd("cached-big-transform-1");
//   t.truthy(out);

//   console.time("cached-big-transform-2");
//   const out2 = transform(bigObj, "snake");
//   console.timeEnd("cached-big-transform-2");
//   t.truthy(out2);

//   console.time("cached-big-transform-3");
//   const out3 = transform(bigObj, "kebab");
//   console.timeEnd("cached-big-transform-3");
//   t.truthy(out3);

//   console.time("cached-big-transform-4");
//   const out4 = transform(bigObj, "pascal");
//   console.timeEnd("cached-big-transform-4");
//   t.truthy(out4);
// });

test("async transform test", async (t) => {
  const result = await transformAsync(obj1, "camel");
  t.deepEqual(result, {
    firstName: "Alice",
    lastName: "Smith",
    age: 30,
  });

  const result2 = await transformAsync(obj2, "camel");
  t.deepEqual(result2, {
    userId: 123,
    userProfile: {
      displayName: "alice_s",
      joinDate: "2024-01-15",
    },
    isActive: true,
  });

  const result3 = await transformAsync(obj3, "camel");
  t.deepEqual(result3, {
    records: [
      { recordId: 1, recordValue: "foo" },
      { recordId: 2, recordValue: "bar" },
    ],
    totalCount: 2,
  });

  const result4 = await transformAsync(obj4, "camel");
  t.deepEqual(result4, {
    kebabKey: {
      pascalKey: [
        { snakeCase: 10, anotherKebab: false },
        { deepNested: { innerKey: [1, 2, 3] } },
      ],
    },
    mixedCaseKey: "hello",
  });

  const result5 = await transformAsync(obj5, "camel");
  t.deepEqual(result5, {
    levelOne: {
      levelTwo: {
        levelThree: [
          {
            someValue: 42,
            anotherValue: {
              finalKey: "end",
            },
          },
        ],
      },
    },
  });
});

// test("performance on massive object async", async (t) => {
//   t.timeout(30_000);
//   console.time("big-transform-async-1");
//   const out = await transformAsync(bigObj, "camel");
//   console.timeEnd("big-transform-async-1");
//   t.truthy(out);

//   console.time("big-transform-async-2");
//   const out2 = await transformAsync(bigObj, "snake");
//   console.timeEnd("big-transform-async-2");
//   t.truthy(out2);
//   console.time("big-transform-async-3");

//   const out3 = await transformAsync(bigObj, "kebab");
//   console.timeEnd("big-transform-async-3");
//   t.truthy(out3);

//   console.time("big-transform-async-4");
//   const out4 = await transformAsync(bigObj, "pascal");
//   console.timeEnd("big-transform-async-4");
//   t.truthy(out4);
// });
