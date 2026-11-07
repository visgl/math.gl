// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.setContent(`<div id="unrelated" class="app" style="color:rgb(1,2,3)"><p>Documentation</p><label>Label</label><button>Button</button><select><option>Option</option></select><aside class="example-panel">Another panel</aside></div>`);
  const outsideStyles = () => page.locator('#unrelated').evaluate(root => {
    const styles = selector => getComputedStyle(root.querySelector(selector));
    return {
      background: getComputedStyle(root).backgroundColor,
      paragraph: styles('p').color,
      label: styles('label').margin,
      button: styles('button').backgroundColor,
      select: styles('select').display,
      panel: styles('aside').position,
      panelWidth: styles('aside').width
    };
  });
  const before = await outsideStyles();
  for (const [example, scope] of [
    ['geometry/culling-queries', 'culling-queries-example'],
    ['geometry/spatial-index', 'spatial-index-example'],
    ['geospatial/geographic-tiles', 'geographic-example']
  ]) {
    await page.addStyleTag({content: readFileSync(new URL(`../../../../examples/${example}/src/app.css`, import.meta.url), 'utf8')});
    assert.deepEqual(await outsideStyles(), before, `${example}: styles stay inside the example`);
    await page.evaluate(scope => {
      const root = document.createElement('div');
      root.className = scope;
      root.textContent = 'Example';
      document.body.append(root);
    }, scope);
    assert.equal(await page.locator(`.${scope}`).evaluate(root => getComputedStyle(root).backgroundColor), 'rgb(7, 19, 33)');
  }
  console.log('Example styles stay scoped in culling queries, spatial index, and geographic tiles.');
} finally {
  await browser.close();
}
