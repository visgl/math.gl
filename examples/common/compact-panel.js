// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Collapse controls on phones without remounting their content or resetting values. */
export function configureCompactPanel(host, box) {
  const compact = window.matchMedia(
    '(max-width: 767px), (max-width: 996px) and (max-height: 500px)'
  );
  const update = () => {
    host.dataset.compactPanel = String(compact.matches);
    box.setProps({ open: !compact.matches });
  };
  box.setProps({ onOpenChange: (open) => box.setProps({ open }) });
  update();
  compact.addEventListener('change', update);
  return () => compact.removeEventListener('change', update);
}
