// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Bound both response arrival and body consumption without aborting the model lifetime. */
export async function snapshotRequest(url, {
  signal, fetchFile = fetch, headers, timeoutMs = 45000
}, readResponse) {
  signal.throwIfAborted();
  const request = new AbortController();
  const cancel = () => request.abort(signal.reason);
  let rejectAbort;
  const aborted = new Promise((_, reject) => {rejectAbort = reject;});
  const rejectRequest = () => rejectAbort(request.signal.reason);
  request.signal.addEventListener('abort', rejectRequest, {once: true});
  signal.addEventListener('abort', cancel, {once: true});
  const timer = setTimeout(() => request.abort(new DOMException(
    `Snapshot request timed out after ${timeoutMs / 1000}s`, 'TimeoutError'
  )), timeoutMs);
  try {
    const operation = (async () => {
      const response = await fetchFile(url, {signal: request.signal, headers});
      request.signal.throwIfAborted();
      const result = await readResponse(response);
      request.signal.throwIfAborted();
      return result;
    })();
    return await Promise.race([operation, aborted]);
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', cancel);
    request.signal.removeEventListener('abort', rejectRequest);
  }
}
