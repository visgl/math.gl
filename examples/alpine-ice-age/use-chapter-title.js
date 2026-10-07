// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import { useEffect, useState } from "react";
// Introduce each chapter briefly, then leave the map unobstructed.
export function useChapterTitle(chapter, enabled, ready) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!enabled || !ready) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, [chapter, enabled, ready]);
  return enabled && ready && visible;
}
