// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Keeps a cancelled selection from restarting on unrelated render updates. */
export function createMapPreparationGate() {
  let cancelledView = null;
  return {
    cancel(request) {
      if (!request) return null;
      cancelledView = request.opts.view;
      request.controller.abort();
      return cancelledView;
    },
    allows(view) {
      if (cancelledView === view) return false;
      cancelledView = null;
      return true;
    },
    retry() {
      cancelledView = null;
    }
  };
}
