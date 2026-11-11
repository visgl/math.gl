// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** An optional Probe.gl-compatible sink for operation errors. */
export type DiagnosticLog = {
  /** Prepares an error message for emission. */
  error(message: string, ...details: unknown[]): () => void;
};

/** Reports an error to a caller's logger, preserving the error that failed the operation. */
export function reportDiagnosticError(log: DiagnosticLog | undefined, error: unknown): void {
  if (log) {
    try {
      log.error(error instanceof Error ? error.message : String(error), error)();
    } catch {
      // Logger failures must not replace the parser or evaluator's error.
    }
  }
}
