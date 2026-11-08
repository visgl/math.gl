// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import WorkerThread from '../worker-utils/lib/worker-farm/worker-thread';
import {TaskChannel, type TaskChannelOptions, type TaskChannelMessage} from './task-channel';
import type {TaskWorker} from './task';

/** Owns a multiplexed task channel and its single physical worker. @internal */
export class TaskWorkerChannel {
  readonly channel: TaskChannel;
  private readonly thread: WorkerThread;

  constructor(name: string, target: TaskWorker, options: Omit<TaskChannelOptions, 'send'>) {
    this.thread = new WorkerThread({
      name,
      url: target.url?.toString(),
      loadWorker: target.create,
      workerType: 'module'
    });
    this.channel = new TaskChannel({
      ...options,
      send: (message, transfer) =>
        this.thread.postMessage(
          {source: 'loaders.gl/tasks', type: 'task-channel', payload: message},
          transfer
        )
    });
    this.thread.onMessage = message => {
      if (message?.type === 'task-channel')
        this.channel.receive(message.payload as TaskChannelMessage);
    };
    this.thread.onError = reason => {
      this.channel.close(reason);
      options.onFailure?.(reason);
    };
  }

  /** Settle pending calls and terminate the worker without replacing its state. */
  async destroy(reason?: unknown): Promise<void> {
    this.channel.close(reason);
    await this.thread.destroy();
  }
}
