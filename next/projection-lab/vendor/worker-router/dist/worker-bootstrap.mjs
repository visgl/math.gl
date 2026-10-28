/*
 * Copyright (c) 2026 Will Cohen
 *
 * Part of worker-router, under the Apache License v2.0 with LLVM Exceptions.
 * See LICENSE for license information.
 * SPDX-License-Identifier: Apache-2.0 WITH LLVM-exception
 *
 * Worker-side bootstrap. Loaded by the pool as the worker entrypoint
 * (Node `new Worker(new URL(bootstrap))` or browser `new Worker(url,
 * {type:"module"})`). Waits for one bootstrap message carrying the
 * handlers map, dynamic-imports each handler module, runs its init,
 * and Comlink-exposes the result. Replies with a single ready message.
 *
 * Plain ES module. No build step; copied verbatim to dist/.
 */
// Comlink is imported dynamically inside main() from the URL the pool
// resolves and sends in the bootstrap message. Dedicated module workers
// have no import map, so a top-level bare `import "comlink"` fails to
// resolve here in the browser; the pool resolves it page-side (where the
// import map applies) and passes an absolute URL.

const WORKER_ROUTER_COORDINATOR_KEY = "__worker_router__";

async function loadHandler(spec) {
  const mod = await import(spec.module);
  const pick = mod.default ?? mod.handler ?? mod.create;
  if (!pick) {
    throw new Error(
      `worker-router: handler module ${spec.module} exports none of default/handler/create`,
    );
  }
  let handler;
  if (typeof pick === "function") {
    handler = await pick(spec.init);
  } else {
    if (typeof pick.init === "function") {
      await pick.init(spec.init);
    }
    handler = pick;
  }
  const destroy = typeof mod.destroy === "function" ? mod.destroy : undefined;
  return { handler, destroy };
}

async function loadAllHandlers(handlers) {
  const exposed = {};
  const destroys = [];
  for (const [key, spec] of Object.entries(handlers)) {
    const loaded = await loadHandler(spec);
    exposed[key] = loaded.handler;
    if (loaded.destroy) {
      const destroyArgs = spec.destroy;
      const destroyFn = loaded.destroy;
      destroys.push(async () => {
        await destroyFn(destroyArgs);
      });
    }
  }
  exposed[WORKER_ROUTER_COORDINATOR_KEY] = {
    async shutdown() {
      // Each destroy runs independently; errors are logged but not
      // rethrown so pool.terminate() completes its walk even if one
      // destroy throws.
      for (const d of destroys) {
        try {
          await d();
        } catch (err) {
          console.error("worker-router: destroy error", err);
        }
      }
    },
  };
  return { exposed };
}

function isNode() {
  const mp = globalThis.process;
  return typeof mp !== "undefined" && typeof mp.versions?.node === "string";
}

async function main() {
  if (isNode()) {
    const { parentPort } = await import("node:worker_threads");
    if (!parentPort) {
      throw new Error("worker-router: no parentPort in node worker");
    }
    const nodeEndpoint = (await import("comlink/dist/esm/node-adapter.mjs"))
      .default;
    parentPort.once("message", async (msg) => {
      try {
        // Node resolves bare specifiers via node_modules, so comlinkUrl is
        // optional here; fall back to the bare import for older pools.
        const Comlink = await import(msg.comlinkUrl ?? "comlink");
        const { exposed } = await loadAllHandlers(msg.handlers);
        Comlink.expose(exposed, nodeEndpoint(parentPort));
        parentPort.postMessage({ type: "worker-router/ready" });
      } catch (err) {
        // Without this catch the rejection kills the worker thread and
        // surfaces as an 'error' event on the parent Worker; reporting a
        // typed message lets the pool reject create() with the real cause.
        parentPort.postMessage({
          type: "worker-router/error",
          message: err?.message ?? String(err),
        });
      }
    });
  } else {
    const onMessage = async (ev) => {
      self.removeEventListener("message", onMessage);
      try {
        // Browser worker realm has no import map -> the pool sends comlink's
        // already-resolved absolute URL in the bootstrap message.
        const Comlink = await import(ev.data.comlinkUrl);
        const { exposed } = await loadAllHandlers(ev.data.handlers);
        Comlink.expose(exposed, self);
        self.postMessage({ type: "worker-router/ready" });
      } catch (err) {
        self.postMessage({
          type: "worker-router/error",
          message: err?.message ?? String(err),
        });
      }
    };
    self.addEventListener("message", onMessage);
  }
}

void main();
