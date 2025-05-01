// #![deny(clippy::all)]

// use napi::{Env, JsUnknown, bindgen_prelude::AsyncTask};
// use napi_derive::napi;
// use serde_json::{Map, Value};
// use convert_case::{Case, Casing};
// use dashmap::DashMap;
// use once_cell::sync::Lazy;
// use rayon::prelude::*;
// use num_cpus;

// /// One global cache shared by all calls
// static GLOBAL_CACHE: Lazy<DashMap<(String, CaseKey), String>> =
//     Lazy::new(DashMap::new);

// #[derive(Clone, Copy, Debug, Eq, PartialEq, Hash)]
// enum CaseKey {
//     Camel,
//     Snake,
//     Pascal,
//     Kebab,
// }

// fn convert_key(key: &str, case: CaseKey) -> String {
//     let lookup = (key.to_string(), case);
//     if let Some(v) = GLOBAL_CACHE.get(&lookup) {
//         return v.clone();
//     }
//     let converted = match case {
//         CaseKey::Camel  => key.to_case(Case::Camel),
//         CaseKey::Snake  => key.to_case(Case::Snake),
//         CaseKey::Pascal => key.to_case(Case::Pascal),
//         CaseKey::Kebab  => key.to_case(Case::Kebab),
//     };
//     GLOBAL_CACHE.insert(lookup, converted.clone());
//     converted
// }

// fn transform_keys(value: &Value, case: CaseKey) -> Value {
//     match value {
//         Value::Object(map) => {
//             // reserve to avoid reallocations
//             let mut out = Map::with_capacity(map.len());
//             for (k, v) in map {
//                 let ck = convert_key(k, case);
//                 let cv = transform_keys(v, case);
//                 out.insert(ck, cv);
//             }
//             Value::Object(out)
//         }

//         Value::Array(arr) => {
//             let len = arr.len();
//             let mut out = Vec::with_capacity(len);

//             // parallelize only large arrays
//             if len > 100 && num_cpus::get() > 1 {
//                 out = arr
//                     .par_iter()
//                     .map(|v| transform_keys(v, case))
//                     .collect();
//             } else {
//                 for v in arr {
//                     out.push(transform_keys(v, case));
//                 }
//             }
//             Value::Array(out)
//         }

//         _ => value.clone(),
//     }
// }

// // -------- Sync API --------

// #[napi]
// pub fn transform(value: Value, casing: String) -> Value {
//     let case = match casing.as_str() {
//         "camel"  => CaseKey::Camel,
//         "snake"  => CaseKey::Snake,
//         "pascal" => CaseKey::Pascal,
//         "kebab"  => CaseKey::Kebab,
//         _        => CaseKey::Camel,
//     };
//     transform_keys(&value, case)
// }

// // -------- Async API --------

// pub struct TransformTask {
//     input: Value,
//     case: CaseKey,
// }

// #[napi]
// impl napi::Task for TransformTask {
//     type Output = Value;
//     type JsValue = JsUnknown;

//     fn compute(&mut self) -> napi::Result<Self::Output> {
//         Ok(transform_keys(&self.input, self.case))
//     }

//     fn resolve(&mut self, env: Env, output: Self::Output) -> napi::Result<Self::JsValue> {
//         env.to_js_value(&output)
//     }
// }

// #[napi]
// pub fn transform_async(
//     value: Value,
//     casing: String,
// ) -> AsyncTask<TransformTask> {
//     let case = match casing.as_str() {
//         "camel"  => CaseKey::Camel,
//         "snake"  => CaseKey::Snake,
//         "pascal" => CaseKey::Pascal,
//         "kebab"  => CaseKey::Kebab,
//         _        => CaseKey::Camel,
//     };

//     AsyncTask::new(TransformTask { input: value, case })
// }

#![deny(clippy::all)]

use napi::{Env, JsUnknown, bindgen_prelude::AsyncTask};
use napi_derive::napi;
use serde_json::{Map, Value};
use convert_case::{Case, Casing};
use dashmap::DashMap;
use once_cell::sync::Lazy;
use rayon::prelude::*;
use num_cpus;

/// Tune these for your data shapes:
const OBJ_PAR_THRESHOLD: usize = 500;
const ARR_PAR_THRESHOLD: usize = 100;

static GLOBAL_CACHE: Lazy<DashMap<(String, CaseKey), String>> =
    Lazy::new(DashMap::new);

#[derive(Clone, Copy, Debug, Eq, PartialEq, Hash)]
enum CaseKey {
    Camel,
    Snake,
    Pascal,
    Kebab,
}

/// Fast-path: if there are no delimiters, we often don’t need full convert_case.
fn fast_path(key: &str, case: CaseKey) -> Option<String> {
    // only keys with NO delimiters get a shortcut
        if !key.contains('_') && !key.contains('-') {
            return match case {
                // PascalCase: uppercase first letter, leave rest
                CaseKey::Pascal => {
                    let mut s = key.to_string();
                    if let Some(first) = s.get_mut(0..1) {
                        first.make_ascii_uppercase();
                    }
                    Some(s)
                }
                // camelCase: lowercase first letter, leave rest
                CaseKey::Camel => {
                    let mut s = key.to_string();
                    if let Some(first) = s.get_mut(0..1) {
                        first.make_ascii_lowercase();
                    }
                    Some(s)
                }
                // snake_case and kebab-case need full convert
                _ => None,
            };
        }
     None
 }

fn convert_key(key: &str, case: CaseKey) -> String {
    // 1) fast path
    if let Some(s) = fast_path(key, case) {
        return s;
    }
    // 2) cache lookup
    let lookup = (key.to_string(), case);
    if let Some(v) = GLOBAL_CACHE.get(&lookup) {
        return v.clone();
    }
    // 3) full conversion
    let converted = match case {
        CaseKey::Camel  => key.to_case(Case::Camel),
        CaseKey::Snake  => key.to_case(Case::Snake),
        CaseKey::Pascal => key.to_case(Case::Pascal),
        CaseKey::Kebab  => key.to_case(Case::Kebab),
    };
    GLOBAL_CACHE.insert(lookup, converted.clone());
    converted
}

fn transform_keys(value: &Value, case: CaseKey) -> Value {
    match value {
        Value::Object(map) => {
            let len = map.len();
            // Parallel object branches if big enough
            if len > OBJ_PAR_THRESHOLD && num_cpus::get() > 1 {
                let entries: Vec<(String, Value)> = map
                    .iter()
                    .collect::<Vec<_>>()
                    .into_par_iter()
                    .map(|(k, v)| {
                        let ck = convert_key(k, case);
                        let cv = transform_keys(v, case);
                        (ck, cv)
                    })
                    .collect();

                let mut out = Map::with_capacity(entries.len());
                for (k, v) in entries {
                    out.insert(k, v);
                }
                return Value::Object(out);
            }

            // Serial fallback
            let mut out = Map::with_capacity(len);
            for (k, v) in map {
                let ck = convert_key(k, case);
                let cv = transform_keys(v, case);
                out.insert(ck, cv);
            }
            Value::Object(out)
        }

        Value::Array(arr) => {
            let len = arr.len();
            // Parallel array branches
            if len > ARR_PAR_THRESHOLD && num_cpus::get() > 1 {
                let out: Vec<_> = arr
                    .par_iter()
                    .map(|v| transform_keys(v, case))
                    .collect();
                return Value::Array(out);
            }
            // Serial fallback
            let mut out = Vec::with_capacity(len);
            for v in arr {
                out.push(transform_keys(v, case));
            }
            Value::Array(out)
        }

        _ => value.clone(),
    }
}

#[napi]
pub fn transform(value: Value, casing: String) -> Value {
    let case = match casing.as_str() {
        "camel"  => CaseKey::Camel,
        "snake"  => CaseKey::Snake,
        "pascal" => CaseKey::Pascal,
        "kebab"  => CaseKey::Kebab,
        _        => CaseKey::Camel,
    };
    transform_keys(&value, case)
}

pub struct TransformTask {
    input: Value,
    case: CaseKey,
}

#[napi]
impl napi::Task for TransformTask {
    type Output = Value;
    type JsValue = JsUnknown;

    fn compute(&mut self) -> napi::Result<Self::Output> {
        Ok(transform_keys(&self.input, self.case))
    }

    fn resolve(&mut self, env: Env, output: Self::Output) -> napi::Result<Self::JsValue> {
        env.to_js_value(&output)
    }
}

#[napi]
pub fn transform_async(
    value: Value,
    casing: String,
) -> AsyncTask<TransformTask> {
    let case = match casing.as_str() {
        "camel"  => CaseKey::Camel,
        "snake"  => CaseKey::Snake,
        "pascal" => CaseKey::Pascal,
        "kebab"  => CaseKey::Kebab,
        _        => CaseKey::Camel,
    };
    AsyncTask::new(TransformTask { input: value, case })
}