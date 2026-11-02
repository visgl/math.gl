// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** An operation's request payload and corresponding result. */
export type TaskOperation<Input, Output> = {input: Input; output: Output};

/** A discriminated union of requests described by an operation map. */
export type TaskOperationRequest<Operations> = {
  [Name in keyof Operations]: Operations[Name] extends TaskOperation<infer Input, unknown>
    ? {operation: Name; input: Input}
    : never;
}[keyof Operations];

/** The union of results described by an operation map. */
export type TaskOperationResult<Operations> = {
  [Name in keyof Operations]: Operations[Name] extends TaskOperation<unknown, infer Output>
    ? Output
    : never;
}[keyof Operations];

/** Dispatch requests with the result type associated with each operation. */
export type TypedTaskDispatcher<Operations, Options = undefined> = <Name extends keyof Operations>(
  request: Operations[Name] extends TaskOperation<infer Input, unknown>
    ? {operation: Name; input: Input}
    : never,
  options?: Options
) => Promise<Operations[Name] extends TaskOperation<unknown, infer Output> ? Output : never>;

/**
 * Wrap a transport whose request/result unions follow an operation map.
 * The transport is responsible for returning the result corresponding to each request.
 * This adapter does not change scheduling, ownership, errors, or cancellation.
 */
export function createTypedTaskDispatcher<Operations, Options = undefined>(
  transport: (
    request: TaskOperationRequest<Operations>,
    options?: Options
  ) => Promise<TaskOperationResult<Operations>>
): TypedTaskDispatcher<Operations, Options> {
  return transport as TypedTaskDispatcher<Operations, Options>;
}
