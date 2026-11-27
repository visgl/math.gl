# PROJJSON type generation

To update the checked-in [PROJJSON TypeScript declarations](../modules/geospatial/src/crs/projjson-types.ts),
run `yarn generate:projjson-types` after an intentional schema upgrade. Use
`yarn check:projjson-types` to verify that the declarations match the schema.

The [vendored schema](../modules/geospatial/src/crs/projjson.schema.json) is the official
PROJJSON v0.7 JSON Schema from
[OSGeo/PROJ](https://github.com/OSGeo/PROJ/blob/master/schemas/v0.7/projjson.schema.json).
It is vendored unchanged under the MIT license declared in its `$comment` field.
The declarations are generated from `#/definitions/crs` by
[`generate-projjson-types.mjs`](./generate-projjson-types.mjs).
