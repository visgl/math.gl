// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

let lookupModule: Promise<typeof import('@math.gl/timezone/lookup')> | undefined;

/** Looks up an approximate IANA timezone, loading the geographic table on first use. */
export async function lookupTimezoneAsync(coordinates: readonly [number, number]): Promise<string> {
  lookupModule ||= import('@math.gl/timezone/lookup').catch(error => {
    lookupModule = undefined;
    throw error;
  });
  const {lookupTimezone} = await lookupModule;
  return lookupTimezone(coordinates);
}
