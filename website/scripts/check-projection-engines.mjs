// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';

/** Check projection boundaries and committed renders during engine/preset changes. */
export async function checkProjectionEngines(browser, base) {
  const page = await browser.newPage({viewport: {width: 1440, height: 1100}});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.addInitScript(() => {
      window.projectionSnapshots = {};
      window.projectionFailures = [];
      window.projectionCommits = 0;
      // A commit hook observes the render before passive effects can replace a stale projector.
      // Waiting for a settled DOM would miss the transient mismatch reported in review.
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
        supportsFiber: true,
        inject: () => 1,
        onCommitFiberRoot() {
          const map = document.querySelector('select[aria-label="Projection"]')?.value;
          const backend = document.querySelector('select[aria-label="Projection engine"]')?.value;
          const path = document.querySelector('svg[role="group"] path');
          const table = document.querySelector(
            'table[aria-label="Projected and inverse coordinates"]'
          );
          const expected = window.projectionSnapshots[`${map}/${backend}`];
          if (!path || !expected) return;
          window.projectionCommits++;
          if (path.getAttribute('d') !== expected.path || table?.textContent !== expected.table) {
            window.projectionFailures.push(`${map}/${backend}`);
          }
        }
      };
    });
    await page.goto(new URL('examples/external-projection-engines', base).href);
    const city = page.getByRole('button', {name: 'Sydney, Australia', exact: true});
    await city.focus();
    await city.press('Enter');
    const maps = ['mercator', 'equalEarth', 'albers', 'lambert', 'stereographic'];
    for (const map of maps) {
      await page.getByLabel('Projection', {exact: true}).selectOption(map);
      for (const backend of ['math.gl', 'proj4js', 'D3']) {
        await page.getByLabel('Projection engine', {exact: true}).selectOption(backend);
        await page.locator('svg circle[aria-pressed="true"]').waitFor();
        assert.equal(await city.getAttribute('aria-pressed'), 'true');
        assert.equal(await page.locator('svg circle[role="button"]').count(), 1000);
        await page.evaluate(() => {
          const map = document.querySelector('select[aria-label="Projection"]').value;
          const backend = document.querySelector('select[aria-label="Projection engine"]').value;
          window.projectionSnapshots[`${map}/${backend}`] = {
            path: document.querySelector('svg[role="group"] path').getAttribute('d'),
            table: document.querySelector('table[aria-label="Projected and inverse coordinates"]')
              .textContent
          };
        });
      }
    }
    // In polar stereographic, a latitude parallel's radius is 2R tan((90° - latitude) / 2).
    // Compare the northern and southern boundaries independently of screen fitting.
    const boundaryRatio = await page.locator('svg[role="group"]').evaluate(svg => {
      const paths = svg.querySelectorAll('path');
      return paths[paths.length - 1].getBBox().width / paths[13].getBBox().width;
    });
    // SVG bounding boxes have single-precision rounding; allow less than 0.001 screen pixels.
    assert.ok(
      Math.abs(boundaryRatio - Math.tan(Math.PI / 36) / Math.tan((7 * Math.PI) / 18)) < 1e-6
    );
    // Visit known snapshots in both directions, including D3 stereographic → Mercator.
    for (const backend of ['D3', 'proj4js', 'math.gl']) {
      await page.getByLabel('Projection engine', {exact: true}).selectOption(backend);
      for (const map of [...maps, ...maps.toReversed()]) {
        await page.getByLabel('Projection', {exact: true}).selectOption(map);
        await page.locator('svg circle[aria-pressed="true"]').waitFor();
        assert.equal(await city.getAttribute('aria-pressed'), 'true');
      }
    }
    assert.ok((await page.evaluate(() => window.projectionCommits)) >= 30);
    assert.deepEqual(await page.evaluate(() => window.projectionFailures), []);
    assert.equal(await page.locator('[role="alert"]').count(), 0);
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
}
