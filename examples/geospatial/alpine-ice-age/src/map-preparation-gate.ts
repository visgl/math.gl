// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Keeps a cancelled selection from restarting on unrelated render updates. */
export function createMapPreparationGate<View = string>() {
  let cancelledView: View | null = null;
  return {
    cancel(request?: {opts: {view: View}; controller: AbortController} | null) {
      if (!request) return null;
      cancelledView = request.opts.view;
      request.controller.abort();
      return cancelledView;
    },
    allows(view: View) {
      if (cancelledView === view) return false;
      cancelledView = null;
      return true;
    },
    retry() {
      cancelledView = null;
    }
  };
}
