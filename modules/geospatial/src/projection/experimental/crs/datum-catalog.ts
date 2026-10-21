// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {CRSNormalizationOptions, DatumDefinition} from './types';

const wgs84: DatumDefinition = {towgs84: '0,0,0', ellipse: 'WGS84'};
const nad83: DatumDefinition = {towgs84: '0,0,0', ellipse: 'GRS80'};
const builtins: Readonly<Record<string, DatumDefinition>> = {
  wgs84,
  WGS84: wgs84,
  nad83,
  North_American_Datum_1983: nad83
};
const resolved = new WeakMap<
  CRSNormalizationOptions,
  {
    catalogs: CRSNormalizationOptions['datumCatalogs'];
    definitions: Readonly<Record<string, DatumDefinition>>;
  }
>();
export const datumNameKey = (name: string): string => name.toLowerCase().replace(/[\s_-]/g, '');

/** Resolve catalogues without global registration or a dependency on the regional table. */
export function getDatumDefinitions(
  options: CRSNormalizationOptions
): Readonly<Record<string, DatumDefinition>> {
  if (!options.datumCatalogs?.length) return builtins;
  const cached = resolved.get(options);
  if (cached?.catalogs === options.datumCatalogs) return cached.definitions;
  const definitions: Record<string, DatumDefinition> = Object.assign(Object.create(null), builtins);
  const names = new Map(
    Object.entries(builtins).map(([name, definition]) => [
      datumNameKey(name),
      {definition, owner: -1}
    ])
  );
  options.datumCatalogs.forEach((catalog, owner) => {
    if (!catalog.name || !catalog.datums) throw new Error('Invalid datum catalogue plugin');
    for (const [name, definition] of Object.entries(catalog.datums)) {
      const key = datumNameKey(name);
      if (
        !key ||
        key === 'none' ||
        !definition ||
        ['ellipse', 'towgs84', 'nadgrids'].some(
          field => definition[field] !== undefined && typeof definition[field] !== 'string'
        )
      )
        throw new Error('Invalid datum definition: ' + name);
      const previous = names.get(key);
      if (
        previous &&
        (previous.owner !== owner ||
          previous.definition.ellipse !== definition.ellipse ||
          previous.definition.towgs84 !== definition.towgs84 ||
          previous.definition.nadgrids !== definition.nadgrids)
      )
        throw new Error('Conflicting datum registration: ' + name);
      names.set(key, {definition, owner});
      definitions[name] = definition;
    }
  });
  resolved.set(options, {catalogs: options.datumCatalogs, definitions});
  return definitions;
}
