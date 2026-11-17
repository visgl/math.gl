// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {Buffers} from 'apache-arrow/data';

/** Returns additional buffers used by newer Arrow variable-width view types. */
export function getArrowVariadicBuffers(data: arrow.Data): readonly Uint8Array[] {
  return (data as arrow.Data & {variadicBuffers?: readonly Uint8Array[]}).variadicBuffers ?? [];
}

/** Constructs Arrow Data across runtimes predating the optional eighth constructor argument. */
export function createArrowData<T extends arrow.DataType>(
  type: T,
  offset: number,
  length: number,
  nullCount: number,
  buffers: Partial<Buffers<T>>,
  children: arrow.Data[],
  dictionary?: arrow.Vector,
  variadicBuffers?: readonly Uint8Array[]
): arrow.Data<T> {
  return Reflect.construct(arrow.Data, [
    type,
    offset,
    length,
    nullCount,
    buffers,
    children,
    dictionary,
    variadicBuffers
  ]) as arrow.Data<T>;
}
