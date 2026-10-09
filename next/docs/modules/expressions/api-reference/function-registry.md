# Function Registry

![From-v4.2](https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square)![Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

`ExpressionFunctionRegistry` maintains an isolated table of JavaScript functions that expression evaluators can call with evaluated arguments.

```
import {

  ExpressionFunctionRegistry,

  compile,

  type ExpressionFunctionLibrary

} from '@math.gl/expressions';



const statistics: ExpressionFunctionLibrary = {

  mean: (...values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length

};



const registry = new ExpressionFunctionRegistry()

  .registerFunctions(statistics)

  .registerFunction('double', (value: number) => value * 2);



const evaluate = compile('double(mean(a, b, c))', {registry});

evaluate({a: 1, b: 2, c: 3}); // 4
```

Registries do not modify module-global state. Separate registries may use the same function name without affecting each other.

## `constructor(functionTables?: ExpressionFunctionLibrary[])`[​](#constructorfunctiontables-expressionfunctionlibrary "Direct link to constructorfunctiontables-expressionfunctionlibrary")

Creates a registry and optionally registers function tables in order.

## `registerFunction(name, fn, options?): this`[​](#registerfunctionname-fn-options-this "Direct link to registerfunctionname-fn-options-this")

Registers one JavaScript function. The name must be a JavaScript-style identifier that can be called directly from an expression.

Duplicate names throw unless `{replace: true}` is supplied:

```
registry.registerFunction('scale', (value) => value * 2);

registry.registerFunction('scale', (value) => value * 3, {replace: true});
```

## `registerFunctions(functionTable, options?): this`[​](#registerfunctionsfunctiontable-options-this "Direct link to registerfunctionsfunctiontable-options-this")

Registers a complete function table. Validation is atomic: no functions are added if any entry is invalid or conflicts with the registry.

## `unregisterFunction(name): boolean`[​](#unregisterfunctionname-boolean "Direct link to unregisterfunctionname-boolean")

Removes a function and reports whether the name was registered.

## `hasFunction(name): boolean`[​](#hasfunctionname-boolean "Direct link to hasfunctionname-boolean")

Reports whether the registry contains a function.

## `getFunction(name): ExpressionFunction | undefined`[​](#getfunctionname-expressionfunction--undefined "Direct link to getfunctionname-expressionfunction--undefined")

Returns a registered function.

## `getFunctionTable(): Readonly<ExpressionFunctionLibrary>`[​](#getfunctiontable-readonlyexpressionfunctionlibrary "Direct link to getfunctiontable-readonlyexpressionfunctionlibrary")

Returns a frozen snapshot of the current registrations.

## Resolution Order[​](#resolution-order "Direct link to Resolution Order")

When a registry and libraries are both supplied, identifiers resolve in this order:

1. Evaluation context
2. Later function libraries
3. Earlier function libraries
4. Function registry

This allows row-specific values to take precedence while keeping the registry reusable.

## Async Functions[​](#async-functions "Direct link to Async Functions")

Use `evalAsync()` or `compileAsync()` when registered functions return promises. Arguments are evaluated before invocation and promise results are awaited before surrounding operations continue.
