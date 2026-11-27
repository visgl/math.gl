// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import './coordinate-tooltip.css';

/** Show geographic hover details near the pointer without taking space from the map. */
export function createCoordinateTooltip(parent: HTMLElement) {
  const element = document.createElement('div');
  element.className = 'example-coordinate-tooltip';
  element.setAttribute('role', 'tooltip');
  element.hidden = true;
  parent.append(element);
  const abort = new AbortController();
  const hide = () => {
    element.hidden = true;
    element.textContent = '';
  };
  // Coordinates become stale when the map moves relative to a stationary pointer.
  window.addEventListener('scroll', hide, {capture: true, signal: abort.signal});
  window.addEventListener('resize', hide, {signal: abort.signal});
  window.addEventListener('blur', hide, {signal: abort.signal});
  return {
    show(text: string, event: PointerEvent) {
      if (event.pointerType === 'touch') {
        hide();
        return;
      }
      element.textContent = text;
      element.hidden = false;
      const box = parent.getBoundingClientRect();
      const x = event.clientX - box.left;
      const y = event.clientY - box.top;
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      // Flip at the map edges so the tooltip remains readable without covering the pointer.
      const left = x + 14 + width > box.width - 8 ? x - width - 14 : x + 14;
      const top = y + 14 + height > box.height - 8 ? y - height - 14 : y + 14;
      element.style.left = `${Math.max(8, Math.min(left, box.width - width - 8))}px`;
      element.style.top = `${Math.max(8, Math.min(top, box.height - height - 8))}px`;
    },
    hide,
    dispose() {
      abort.abort();
      element.remove();
    }
  };
}
