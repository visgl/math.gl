// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Recoverable data errors; programming, binding and cancellation errors remain ordinary exceptions. */
export type ExpressionEvaluationErrorCode = 'domain' | 'conversion' | 'overflow' | 'divisionByZero';
const brand = Symbol.for('@math.gl/core/ExpressionEvaluationError');
const codes: readonly string[] = ['domain', 'conversion', 'overflow', 'divisionByZero'];
/** A classified scalar evaluation failure, eligible for explicit TRY recovery. */
export class ExpressionEvaluationError extends Error {
  override readonly name = 'ExpressionEvaluationError';
  readonly [brand] = true;
  constructor(
    readonly code: ExpressionEvaluationErrorCode,
    message: string
  ) {
    super(message);
    if (!codes.includes(code)) throw new TypeError('Unknown Arrow evaluation error code');
  }
}
/** Recognizes classified errors across separately bundled ESM/CommonJS function entry points. */
export function isExpressionEvaluationError(error: unknown): error is ExpressionEvaluationError {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as Record<PropertyKey, unknown>)[brand] === true &&
    codes.includes((error as ExpressionEvaluationError).code)
  );
}
