// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {LoadWorker, WorkerMessageType, WorkerMessagePayload} from '../../types';
import {isMobile} from '../env-utils/globals';
import WorkerThread from './worker-thread';
import WorkerJob from './worker-job';
import type {SharedWorkerState} from '../worker-api/shared-state';
import type {WorkerJobMetrics, WorkerPoolStats} from '../../types';

/** WorkerPool onDebug Callback Parameters */
type OnDebugParameters = {
  message: string;
  worker: string;
  name: string;
  job: string;
  backlog: number;
  workerThread: WorkerThread;
};

/** WorkerPool Properties */
export type WorkerPoolProps = {
  name?: string;
  source?: string; // | Function;
  url?: string;
  /** Browser worker script type; ignored for Node workers. */
  workerType?: 'classic' | 'module';
  /** Lazily resolves a classic worker fallback URL. */
  getUrl?: () => string;
  /** Creates a browser Worker directly. */
  loadWorker?: LoadWorker;
  /** Maximum retained input bytes waiting for a worker; overflow rejects before transfer. */
  maxQueuedJobs?: number;
  maxPendingAdmissions?: number;
  /** Each interval increases a waiting job's effective priority by one. */
  priorityAgingMs?: number;
  onMetrics?: (metrics: WorkerJobMetrics) => void;
  performanceMarks?: boolean;
  maxQueuedBytes?: number;
  /** Maximum reserved input bytes across running jobs. */
  maxInFlightBytes?: number;
  maxConcurrency?: number;
  maxMobileConcurrency?: number;
  onDebug?: (options: OnDebugParameters) => any;
  reuseWorkers?: boolean;
};

/** Worker-pool target, including values used only to distinguish cached pools. */
export type WorkerPoolTarget = WorkerPoolProps & {
  /** Worker name used as the base pool identity. */
  name: string;
  /** Stable identity for a lazily resolved URL. */
  urlKey?: string;
};

/** Private helper types */
type OnMessage = (job: WorkerJob, type: WorkerMessageType, payload: WorkerMessagePayload) => void;
type OnError = (job: WorkerJob, error: Error) => void;

type QueuedJob = {
  name: string;
  inputBytes: number;
  priority: number;
  queuedAt: number;
  sharedState?: SharedWorkerState;
  cancellationMode?: 'terminate' | 'cooperative';
  cancellationTimeout?: number;
  onMessage: OnMessage;
  onError: OnError;
  onStart: (value: any) => void; // Resolve job start promise
  onReject: (reason: unknown) => void; // Reject job start promise
  /** Removes the queued cancellation listener when the job leaves the queue. */
  removeAbortListener: () => void;
  /** Cancels this queued or active job. */
  signal?: AbortSignal;
};

/** A byte reservation obtained before constructing a large input. */
export type WorkerAdmission = {
  readonly inputBytes: number;
  release(): void;
};
type AdmissionWaiter = {
  inputBytes: number;
  resolve: (admission: WorkerAdmission) => void;
  reject: (error: unknown) => void;
  cleanup: () => void;
};

/**
 * Process multiple data messages with small pool of identical workers
 */
export default class WorkerPool {
  name: string = 'unnamed';
  source?: string; // | Function;
  url?: string;
  workerType?: 'classic' | 'module';
  /** Lazily resolves a classic worker fallback URL. */
  getUrl?: () => string;
  /** Creates a browser Worker directly. */
  loadWorker?: LoadWorker;
  maxConcurrency: number = 1;
  maxMobileConcurrency: number = 1;
  onDebug: (options: OnDebugParameters) => any = () => {};
  reuseWorkers: boolean = true;

  private props: WorkerPoolProps = {};
  private jobQueue: QueuedJob[] = [];
  private idleQueue: WorkerThread[] = [];
  private activeJobs = new Set<WorkerJob>();
  private startingJobs = 0;
  private count = 0;
  private workers = new Set<WorkerThread>();
  private queuedBytes = 0;
  private inFlightBytes = 0;
  private maxQueuedBytes = Infinity;
  private maxInFlightBytes = Infinity;
  private isDestroyed = false;
  private isClosing = false;
  private closing?: Promise<void>;
  private onDrained?: () => void;
  private destruction?: Promise<void>;
  private maxQueuedJobs = Infinity;
  private maxPendingAdmissions = 128;
  private priorityAgingMs = 1000;
  private reservations = new Set<WorkerAdmission>();
  private admissions: AdmissionWaiter[] = [];
  private reservedBytes = 0;
  private totals = {
    peakQueuedBytes: 0,
    peakInFlightBytes: 0,
    workersCreated: 0,
    workerRestarts: 0,
    completed: 0,
    failed: 0,
    cancelled: 0
  };

  /** Snapshot; byte figures describe input buffers, not total heap memory. */
  get stats(): WorkerPoolStats {
    return {
      ...this.totals,
      queuedJobs: this.jobQueue.length,
      activeJobs: this.activeJobs.size,
      queuedBytes: this.queuedBytes + this.reservedBytes,
      inFlightBytes: this.inFlightBytes,
      pendingAdmissions: this.admissions.length,
      reservations: this.reservations.size
    };
  }

  /** Wait for an atomic queue reservation before allocating input. Waiting metadata is bounded. */
  reserve(inputBytes: number, options: {signal?: AbortSignal} = {}): Promise<WorkerAdmission> {
    const {signal} = options;
    if (signal?.aborted) return Promise.reject(signal.reason);
    if (this.isDestroyed) return Promise.reject(new Error('Worker pool was destroyed'));
    if (this.isClosing) return Promise.reject(new Error('Worker pool is closing'));
    if (
      !Number.isSafeInteger(inputBytes) ||
      inputBytes < 0 ||
      inputBytes > this.maxQueuedBytes ||
      inputBytes > this.maxInFlightBytes
    ) {
      return Promise.reject(new RangeError('Reservation exceeds worker byte budgets'));
    }
    if (this.maxQueuedJobs < 1 || this.admissions.length >= this.maxPendingAdmissions) {
      return Promise.reject(new RangeError('Worker admission queue is full'));
    }
    return new Promise((resolve, reject) => {
      const abort = () => {
        const index = this.admissions.indexOf(waiter);
        if (index >= 0) this.admissions.splice(index, 1);
        waiter.cleanup();
        reject(signal?.reason);
        this._admit();
      };
      const waiter: AdmissionWaiter = {
        inputBytes,
        resolve,
        reject,
        cleanup: () => signal?.removeEventListener('abort', abort)
      };
      this.admissions.push(waiter);
      signal?.addEventListener('abort', abort, {once: true});
      this._admit();
    });
  }

  private _admit(): void {
    while (!this.isDestroyed && !this.isClosing && this.admissions.length) {
      const waiter = this.admissions[0];
      if (waiter.inputBytes > this.maxQueuedBytes || waiter.inputBytes > this.maxInFlightBytes) {
        this.admissions.shift();
        waiter.cleanup();
        waiter.reject(new RangeError('Reservation exceeds worker byte budgets'));
        continue;
      }
      if (
        this.jobQueue.length + this.reservations.size >= this.maxQueuedJobs ||
        waiter.inputBytes > this.maxQueuedBytes - this.queuedBytes - this.reservedBytes
      )
        return;
      this.admissions.shift();
      waiter.cleanup();
      const admission: WorkerAdmission = {
        inputBytes: waiter.inputBytes,
        release: () => {
          if (this.reservations.delete(admission)) {
            this.reservedBytes -= admission.inputBytes;
            this._admit();
          }
        }
      };
      this.reservations.add(admission);
      this.reservedBytes += admission.inputBytes;
      this.totals.peakQueuedBytes = Math.max(
        this.totals.peakQueuedBytes,
        this.queuedBytes + this.reservedBytes
      );
      waiter.resolve(admission);
    }
  }

  /** Checks if workers are supported on this platform */
  static isSupported(): boolean {
    return WorkerThread.isSupported();
  }

  /**
   * @param processor - worker function
   * @param maxConcurrency - max count of workers
   */
  constructor(props: WorkerPoolProps) {
    this.source = props.source;
    this.url = props.url;
    this.workerType = props.workerType;
    this.getUrl = props.getUrl;
    this.loadWorker = props.loadWorker;
    this.setProps(props);
  }

  /** Reject new work, drain submitted jobs, and terminate workers; optionally force termination after a deadline. */
  close(options: {timeout?: number} = {}): Promise<void> {
    if (this.closing) return this.closing;
    if (this.isDestroyed) return this.destroy();
    if (
      options.timeout !== undefined &&
      (!Number.isFinite(options.timeout) || options.timeout < 0 || options.timeout > 0x7fffffff)
    ) {
      return Promise.reject(new RangeError('Close timeout must be between 0 and 2147483647 ms'));
    }
    this.isClosing = true;
    const reason = new Error('Worker pool is closing');
    this.admissions.splice(0).forEach(waiter => {
      waiter.cleanup();
      waiter.reject(reason);
    });
    this.reservations.clear();
    this.reservedBytes = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const drained = new Promise<void>(resolve => {
      this.onDrained = resolve;
    });
    const deadline =
      options.timeout === undefined
        ? drained
        : Promise.race([
            drained,
            new Promise<void>(resolve => {
              timer = setTimeout(resolve, options.timeout);
            })
          ]);
    this.closing = deadline.then(async () => {
      clearTimeout(timer);
      await this.destroy();
    });
    this._checkDrained();
    return this.closing;
  }

  private _checkDrained(): void {
    if (this.isClosing && !this.jobQueue.length && !this.activeJobs.size && !this.startingJobs)
      this.onDrained?.();
  }

  /**
   * Terminates all workers in the pool and aborts active jobs.
   * @param reason Optional error delivered to active jobs.
   * @note Can free up significant memory
   */
  destroy(reason: unknown = new Error('Worker pool was destroyed')): Promise<void> {
    if (this.destruction) return this.destruction;
    const workers = [...this.workers];
    // Abort active jobs so callers receive an error when a development worker is invalidated.
    this.isDestroyed = true;
    this.onDrained?.();
    this.activeJobs.forEach(job => job.abort(reason));
    this.admissions.splice(0).forEach(waiter => {
      waiter.cleanup();
      waiter.reject(reason);
    });
    this.reservations.clear();
    this.reservedBytes = 0;
    const queuedJobs = this.jobQueue.splice(0);
    this.queuedBytes = 0;
    queuedJobs.forEach(queuedJob => {
      queuedJob.removeAbortListener();
      queuedJob.onReject(reason);
    });
    this.idleQueue.splice(0).forEach(worker => {
      worker.destroy();
      this.count--;
    });
    this.isDestroyed = true;
    this.destruction = Promise.all(workers.map(worker => worker.destroy())).then(() => {
      this.workers.clear();
    });
    void this.destruction.catch(() => undefined);
    return this.destruction;
  }

  setProps(props: WorkerPoolProps) {
    for (const key of [
      'maxQueuedBytes',
      'maxInFlightBytes',
      'maxQueuedJobs',
      'maxPendingAdmissions'
    ] as const) {
      const value = props[key];
      if (
        value !== undefined &&
        (!(value >= 0) || (value !== Infinity && !Number.isSafeInteger(value)))
      ) {
        throw new RangeError(`${key} must be a nonnegative safe integer or Infinity`);
      }
    }
    if (
      props.priorityAgingMs !== undefined &&
      (!Number.isFinite(props.priorityAgingMs) || props.priorityAgingMs <= 0)
    ) {
      throw new RangeError('priorityAgingMs must be positive and finite');
    }
    this.maxQueuedJobs = props.maxQueuedJobs ?? this.maxQueuedJobs;
    this.maxPendingAdmissions = props.maxPendingAdmissions ?? this.maxPendingAdmissions;
    this.priorityAgingMs = props.priorityAgingMs ?? this.priorityAgingMs;
    this.maxQueuedBytes = props.maxQueuedBytes ?? this.maxQueuedBytes;
    this.maxInFlightBytes = props.maxInFlightBytes ?? this.maxInFlightBytes;
    this.props = {...this.props, ...props};

    if (props.name !== undefined) {
      this.name = props.name;
    }
    if (props.maxConcurrency !== undefined) {
      this.maxConcurrency = props.maxConcurrency;
    }
    if (props.maxMobileConcurrency !== undefined) {
      this.maxMobileConcurrency = props.maxMobileConcurrency;
    }
    if (props.reuseWorkers !== undefined) {
      this.reuseWorkers = props.reuseWorkers;
    }
    if (props.onDebug !== undefined) {
      this.onDebug = props.onDebug;
    }
    for (const queuedJob of [...this.jobQueue]) {
      if (queuedJob.inputBytes > this.maxInFlightBytes) {
        this.jobQueue.splice(this.jobQueue.indexOf(queuedJob), 1);
        this.queuedBytes -= queuedJob.inputBytes;
        queuedJob.removeAbortListener();
        queuedJob.onReject(new RangeError('Worker job exceeds maxInFlightBytes'));
      }
    }
    this._admit();
    void this._startQueuedJob();
    this._checkDrained();
  }

  /** Whether batch callers must declare a retained-input reservation. */
  get requiresInputBytes(): boolean {
    return this.maxQueuedBytes !== Infinity || this.maxInFlightBytes !== Infinity;
  }

  async startJob(
    name: string,
    onMessage: OnMessage = (job, type, data) => job.done(data),
    onError: OnError = (job, error) => job.error(error),
    signal?: AbortSignal,
    scheduling: {
      inputBytes?: number;
      priority?: number;
      admission?: WorkerAdmission;
      sharedState?: SharedWorkerState;
      cancellationMode?: 'terminate' | 'cooperative';
      cancellationTimeout?: number;
    } = {}
  ): Promise<WorkerJob> {
    if (
      scheduling.cancellationMode !== undefined &&
      !['terminate', 'cooperative'].includes(scheduling.cancellationMode)
    ) {
      throw new Error('Invalid worker cancellation mode');
    }
    if (
      scheduling.cancellationTimeout !== undefined &&
      (!Number.isFinite(scheduling.cancellationTimeout) || scheduling.cancellationTimeout < 0)
    ) {
      throw new RangeError('cancellationTimeout must be finite and nonnegative');
    }
    if (signal?.aborted) {
      throw signal.reason;
    }
    if (this.isDestroyed) {
      return Promise.reject(new Error('Worker pool was destroyed'));
    }
    if (this.isClosing) return Promise.reject(new Error('Worker pool is closing'));
    const {inputBytes = 0, priority = 0} = scheduling;
    if (!Number.isSafeInteger(inputBytes) || inputBytes < 0 || !Number.isFinite(priority)) {
      throw new RangeError('Invalid worker scheduling inputBytes or priority');
    }
    if (inputBytes > this.maxInFlightBytes) {
      throw new RangeError('Worker job exceeds maxInFlightBytes');
    }
    const admission = scheduling.admission;
    if (admission && (!this.reservations.has(admission) || admission.inputBytes !== inputBytes)) {
      throw new Error('Invalid or consumed worker admission');
    }
    // A job that can start immediately need not fit the waiting queue budget.
    const canStart =
      !this.jobQueue.length &&
      this.activeJobs.size < this._getMaxConcurrency() &&
      this.inFlightBytes + inputBytes <= this.maxInFlightBytes;
    if (
      !admission &&
      !canStart &&
      (this.jobQueue.length + this.reservations.size >= this.maxQueuedJobs ||
        inputBytes > this.maxQueuedBytes - this.queuedBytes - this.reservedBytes)
    ) {
      throw new RangeError('Worker queue exceeds maxQueuedBytes or maxQueuedJobs');
    }
    if (admission) {
      this.reservations.delete(admission);
      this.reservedBytes -= admission.inputBytes;
    }
    // Promise resolves when thread starts working on this job
    const startPromise = new Promise<WorkerJob>((onStart, onReject) => {
      // Promise resolves when thread completes or fails working on this job
      const abortQueuedJob = (): void => {
        const index = this.jobQueue.indexOf(queuedJob);
        if (index >= 0) {
          this.jobQueue.splice(index, 1);
          this.queuedBytes -= queuedJob.inputBytes;
          this._admit();
          void this._startQueuedJob();
          queuedJob.removeAbortListener();
          onReject(signal?.reason);
          this._checkDrained();
        }
      };
      const queuedJob: QueuedJob = {
        name,
        inputBytes,
        priority,
        queuedAt: performance.now(),
        sharedState: scheduling.sharedState,
        cancellationMode: scheduling.cancellationMode,
        cancellationTimeout: scheduling.cancellationTimeout,
        onMessage,
        onError,
        onStart,
        onReject,
        signal,
        removeAbortListener: () => signal?.removeEventListener('abort', abortQueuedJob)
      };
      // Stable priority order: larger values first, FIFO for equal priorities.
      const index = this.jobQueue.findIndex(job => job.priority < priority);
      this.jobQueue.splice(index < 0 ? this.jobQueue.length : index, 0, queuedJob);
      this.queuedBytes += inputBytes;
      if (!canStart)
        this.totals.peakQueuedBytes = Math.max(
          this.totals.peakQueuedBytes,
          this.queuedBytes + this.reservedBytes
        );
      signal?.addEventListener('abort', abortQueuedJob, {once: true});
      return this;
    });
    this._startQueuedJob(); // eslint-disable-line @typescript-eslint/no-floating-promises
    return await startPromise;
  }

  // PRIVATE

  /**
   * Starts first queued job if worker is available or can be created
   * Called when job is started and whenever a worker returns to the idleQueue
   */
  async _startQueuedJob(): Promise<void> {
    if (!this.jobQueue.length) {
      return;
    }

    const now = performance.now();
    this.jobQueue.sort(
      (a, b) =>
        b.priority +
        Math.floor((now - b.queuedAt) / this.priorityAgingMs) -
        (a.priority + Math.floor((now - a.queuedAt) / this.priorityAgingMs))
    );
    // Strict priority order deliberately prevents smaller jobs bypassing the head job.
    if (this.jobQueue[0].inputBytes > this.maxInFlightBytes - this.inFlightBytes) return;

    let workerThread: WorkerThread | null;
    try {
      workerThread = this._getAvailableWorker();
    } catch (error) {
      const queuedJob = this.jobQueue.shift();
      if (queuedJob) this.queuedBytes -= queuedJob.inputBytes;
      this._admit();
      queuedJob?.removeAbortListener();
      queuedJob?.onReject(error);
      void this._startQueuedJob();
      this._checkDrained();
      return;
    }
    if (!workerThread) {
      return;
    }

    // We have a worker, dequeue and start the job
    const queuedJob = this.jobQueue.shift();
    if (queuedJob) {
      this.startingJobs++;
      this.queuedBytes -= queuedJob.inputBytes;
      this.inFlightBytes += queuedJob.inputBytes;
      this.totals.peakInFlightBytes = Math.max(this.totals.peakInFlightBytes, this.inFlightBytes);
      this._admit();
      const startedAt = performance.now();
      try {
        // @ts-ignore Legacy diagnostic callback shape.
        this.onDebug({
          message: 'Starting job',
          name: queuedJob.name,
          workerThread,
          backlog: this.jobQueue.length
        });
      } catch {
        /* Diagnostics must never affect scheduling. */
      }

      if (this.isDestroyed || workerThread.terminated) {
        this.startingJobs--;
        this.inFlightBytes -= queuedJob.inputBytes;
        queuedJob.removeAbortListener();
        queuedJob.onReject(new Error('Worker pool was destroyed before job start'));
        this.returnWorkerToQueue(workerThread);
        return;
      }
      // Create a worker job to let the app access thread and manage job completion
      const job = new WorkerJob(queuedJob.name, workerThread);
      job.sharedState = queuedJob.sharedState;
      queuedJob.removeAbortListener();
      const abortJob = (): void => {
        if (queuedJob.cancellationMode === 'cooperative') {
          job.cancel(queuedJob.signal?.reason, queuedJob.cancellationTimeout);
        } else job.abort(queuedJob.signal?.reason);
      };
      queuedJob.signal?.addEventListener('abort', abortJob, {once: true});
      if (queuedJob.signal?.aborted) abortJob();
      this.activeJobs.add(job);
      this.startingJobs--;
      workerThread.ref();

      // Set the worker thread's message handlers
      workerThread.onMessage = data => {
        try {
          if (job.isRunning) queuedJob.onMessage(job, data.type, data.payload);
        } catch (error) {
          job.abort(error);
        }
      };
      workerThread.onError = error => {
        try {
          queuedJob.onError(job, error);
        } catch (callbackError) {
          job.abort(callbackError);
        }
      };

      void job.result.catch(() => undefined);
      // Resolve the start promise so that the app can start sending messages to worker
      queuedJob.onStart(job);
      void this._startQueuedJob();

      // Wait for the app to signal that the job is complete, then return worker to queue
      try {
        await job.completion;
      } catch {
        // The job result promise carries worker errors back to the caller; do not duplicate-log
        // handled rejections here.
      } finally {
        queuedJob.signal?.removeEventListener('abort', abortJob);
        this.activeJobs.delete(job);
        this.inFlightBytes -= queuedJob.inputBytes;
        const outcome = job.isCancelled ? 'cancelled' : job.failed ? 'failed' : 'completed';
        this.totals[outcome]++;
        const metrics: WorkerJobMetrics = {
          name: job.name,
          outcome,
          queueWaitMs: startedAt - queuedJob.queuedAt,
          durationMs: performance.now() - startedAt,
          workerCreationMs: workerThread.creationTimeMs,
          workerStartupMs: workerThread.startupTimeMs,
          postMessageMs: job.postMessageMs,
          executionMs: job.executionMs,
          inputBytes: queuedJob.inputBytes
        };
        try {
          this.props.onMetrics?.(metrics);
          if (this.props.performanceMarks && typeof performance.measure === 'function') {
            performance.measure(`math.gl.worker:${job.name}`, {
              start: queuedJob.queuedAt,
              end: performance.now(),
              detail: metrics
            });
          }
        } catch {
          /* Instrumentation must not break worker release. */
        }
        this._admit();
        this.returnWorkerToQueue(workerThread);
      }
    } else {
      this.returnWorkerToQueue(workerThread);
    }
  }

  /**
   * Returns a worker to the idle queue
   * Destroys the worker if
   *  - pool is destroyed
   *  - if this pool doesn't reuse workers
   *  - if maxConcurrency has been lowered
   * @param worker
   */
  returnWorkerToQueue(worker: WorkerThread) {
    const shouldDestroyWorker =
      // Aborted jobs terminate their worker immediately.
      worker.terminated ||
      // If the pool is destroyed, there is no reason to keep the worker around
      this.isDestroyed ||
      // If the app has disabled worker reuse, any completed workers should be destroyed
      !this.reuseWorkers ||
      // If concurrency has been lowered, this worker might be surplus to requirements
      this.count > this._getMaxConcurrency();

    if (shouldDestroyWorker) {
      if (worker.terminated && !this.isDestroyed) this.totals.workerRestarts++;
      if (!worker.terminated) {
        worker.destroy();
      }
      void worker.destroy().then(() => this.workers.delete(worker));
      this.count--;
    } else {
      worker.unref();
      this.idleQueue.push(worker);
    }

    if (!this.isDestroyed) {
      this._startQueuedJob(); // eslint-disable-line @typescript-eslint/no-floating-promises
    }
    this._checkDrained();
  }

  /**
   * Returns idle worker or creates new worker if maxConcurrency has not been reached
   */
  _getAvailableWorker(): WorkerThread | null {
    // If a worker has completed and returned to the queue, it can be used
    while (this.idleQueue.length > 0) {
      const worker = this.idleQueue.shift();
      if (worker && (worker.terminated || this.count > this._getMaxConcurrency())) {
        if (worker.terminated) this.totals.workerRestarts++;
        void worker.destroy().then(() => this.workers.delete(worker));
        this.count--;
      } else if (worker) {
        return worker;
      }
    }

    // Create fresh worker if we haven't yet created the max amount of worker threads for this worker source
    if (this.count < this._getMaxConcurrency()) {
      this.count++;
      const name = `${this.name.toLowerCase()} (#${this.count} of ${this.maxConcurrency})`;
      try {
        const worker = new WorkerThread({
          name,
          source: this.source,
          url: this.url,
          workerType: this.workerType,
          getUrl: this.getUrl,
          loadWorker: this.loadWorker
        });
        this.totals.workersCreated++;
        this.workers.add(worker);
        return worker;
      } catch (error) {
        this.count--;
        throw error;
      }
    }

    // No worker available, have to wait
    return null;
  }

  _getMaxConcurrency() {
    return isMobile ? this.maxMobileConcurrency : this.maxConcurrency;
  }
}
