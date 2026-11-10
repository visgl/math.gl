// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Recoverable data errors; programming, binding and cancellation errors remain ordinary exceptions. */
export type ArrowEvaluationErrorCode = 'domain' | 'conversion' | 'overflow' | 'divisionByZero';
const brand = Symbol.for('@math.gl/arrow/ArrowEvaluationError');
const codes: readonly string[] = ['domain', 'conversion', 'overflow', 'divisionByZero'];
/** A classified scalar evaluation failure, eligible for explicit TRY recovery. */
export class ArrowEvaluationError extends Error {
  override readonly name = 'ArrowEvaluationError';
  readonly [brand] = true;
  constructor(
    readonly code: ArrowEvaluationErrorCode,
    message: string
  ) {
    super(message);
    if (!codes.includes(code)) throw new TypeError('Unknown Arrow evaluation error code');
  }
}
/** Recognizes classified errors across separately bundled ESM/CommonJS function entry points. */
export function isArrowEvaluationError(error: unknown): error is ArrowEvaluationError {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as Record<PropertyKey, unknown>)[brand] === true &&
    codes.includes((error as ArrowEvaluationError).code)
  );
}
