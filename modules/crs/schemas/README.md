# Vendored PROJJSON schema

`projjson.schema.json` is the official PROJJSON v0.7 JSON Schema from
[OSGeo/PROJ](https://github.com/OSGeo/PROJ/blob/master/schemas/v0.7/projjson.schema.json).
It is vendored unchanged under the MIT license declared in its `$comment` field.

The checked-in TypeScript declarations in `../src/projjson-types.ts` are generated
from `#/definitions/crs`; run `yarn generate:projjson-types` after an intentional
schema upgrade.
