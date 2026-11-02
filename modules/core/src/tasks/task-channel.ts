// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Messages on a dedicated, multiplexed task transport. */
export type TaskChannelMessage = {
  source: 'math.gl/tasks';
  kind: 'request' | 'result' | 'error' | 'cancel' | 'event';
  id: number;
  operation?: string;
  value?: unknown;
  error?: {name: string; message: string};
};

/** Transport-independent services used by each endpoint of a task channel. */
export type TaskChannelOptions = {
  send(message: TaskChannelMessage, transfer: Transferable[]): void;
  handleRequest(operation: string, value: unknown, signal: AbortSignal): Promise<unknown>;
  handleEvent?(operation: string, value: unknown): void;
  getResultTransferList?(value: unknown, request: unknown): Transferable[];
  onFailure?(reason: unknown): void;
};

/**
 * Bidirectional request correlation and cancellation on one physical transport.
 * Scheduling and state safety belong to the initialized task, not this channel.
 * @internal
 */
export class TaskChannel {
  private nextId = 1;
  private failure: {reason: unknown} | undefined;
  private readonly pending = new Map<
    number,
    {
      resolve(value: unknown): void;
      reject(reason: unknown): void;
      cleanup(): void;
    }
  >();
  private readonly incoming = new Map<number, AbortController>();

  constructor(private readonly options: TaskChannelOptions) {}

  /** Send a request without serializing other in-flight requests. */
  request(
    operation: string,
    value: unknown,
    signal?: AbortSignal,
    transfer: Transferable[] = []
  ): Promise<unknown> {
    if (this.failure) return Promise.reject(this.failure.reason);
    if (signal?.aborted) return Promise.reject(signal.reason);
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const abort = () => {
        const pending = this.pending.get(id);
        if (!pending) return;
        this.pending.delete(id);
        pending.cleanup();
        reject(signal?.reason);
        this.send({source: 'math.gl/tasks', kind: 'cancel', id});
      };
      this.pending.set(id, {
        resolve,
        reject,
        cleanup: () => signal?.removeEventListener('abort', abort)
      });
      signal?.addEventListener('abort', abort, {once: true});
      this.send({source: 'math.gl/tasks', kind: 'request', id, operation, value}, transfer);
    });
  }

  /** Send a one-way notification. */
  emit(operation: string, value: unknown, transfer: Transferable[] = []): void {
    if (this.failure) throw this.failure.reason;
    this.send({source: 'math.gl/tasks', kind: 'event', id: 0, operation, value}, transfer);
  }

  /** Dispatch a transport message; unrelated protocols are ignored. */
  receive(message: TaskChannelMessage): void {
    if (this.failure || message?.source !== 'math.gl/tasks') return;
    if (message.kind === 'result' || message.kind === 'error') {
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      pending.cleanup();
      if (message.kind === 'result') pending.resolve(message.value);
      else {
        const error = new Error(message.error?.message ?? 'Task request failed');
        error.name = message.error?.name ?? 'Error';
        pending.reject(error);
      }
    } else if (message.kind === 'cancel') {
      this.incoming
        .get(message.id)
        ?.abort(new DOMException('Task request cancelled', 'AbortError'));
    } else if (message.kind === 'event') {
      try {
        this.options.handleEvent?.(message.operation!, message.value);
      } catch (error) {
        this.fail(error);
      }
    } else if (message.kind === 'request') {
      if (this.incoming.has(message.id)) {
        this.fail(new Error('Duplicate task request identifier'));
        return;
      }
      const controller = new AbortController();
      this.incoming.set(message.id, controller);
      void Promise.resolve()
        .then(() => {
          controller.signal.throwIfAborted();
          return this.options.handleRequest(message.operation!, message.value, controller.signal);
        })
        .then(value => {
          if (!controller.signal.aborted && !this.failure) {
            this.send(
              {source: 'math.gl/tasks', kind: 'result', id: message.id, value},
              this.options.getResultTransferList?.(value, message.value)
            );
          }
        })
        .catch(reason => {
          if (!controller.signal.aborted && !this.failure) {
            this.send({
              source: 'math.gl/tasks',
              kind: 'error',
              id: message.id,
              error: {
                name: reason instanceof Error ? reason.name : 'Error',
                message: reason instanceof Error ? reason.message : String(reason)
              }
            });
          }
        })
        .finally(() => this.incoming.delete(message.id));
    }
  }

  /** Reject all outstanding calls with a common cause and abort incoming callbacks. */
  close(reason: unknown = new Error('Task channel closed')): void {
    if (this.failure) return;
    this.failure = {reason};
    for (const pending of this.pending.values()) {
      pending.cleanup();
      pending.reject(reason);
    }
    this.pending.clear();
    for (const controller of this.incoming.values()) controller.abort(reason);
    this.incoming.clear();
  }

  private send(message: TaskChannelMessage, transfer: Transferable[] = []): void {
    if (this.failure) return;
    try {
      this.options.send(message, transfer);
    } catch (error) {
      this.fail(error);
    }
  }

  private fail(reason: unknown): void {
    if (this.failure) return;
    this.close(reason);
    this.options.onFailure?.(reason);
  }
}
