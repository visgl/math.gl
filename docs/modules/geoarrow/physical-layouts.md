# GeoArrow physical layouts

The descriptor model separates physical storage from the library that owns it. Descriptors are
plain, immutable TypeScript objects; typed arrays are borrowed views into caller-owned memory.

## Column envelope

```typescript
type GeoArrowColumn = Readonly<{
  encoding: GeoArrowEncoding;
  dimension: 'xy' | 'xyz' | 'xym' | 'xyzm';
  coordinateLayout: 'interleaved' | 'separated' | null;
  chunks: readonly GeoArrowArray[];
  spatialReference?: SpatialReference | null;
  edges?: 'planar' | 'spherical';
  metadata?: Readonly<Record<string, unknown>>;
}>;
```

The envelope contains semantic facts that cannot be recovered reliably from raw buffers. Each
chunk owns its logical `length`, validity, and physical views. Homogeneous columns declare
encoding, dimension, and layout at the column level. Dense-union children may override those
properties independently, which is required for mixed Point Z/Point M collections.

## Geometry nesting

Let `C` mean one coordinate tuple and `L<T>` mean a variable-size list.

| Encoding | Descriptor shape | Row meaning |
| --- | --- | --- |
| `geoarrow.point` | `C` | one coordinate |
| `geoarrow.linestring` | `L<C>` | coordinates in one line |
| `geoarrow.multipoint` | `L<C>` | points in one multi-point |
| `geoarrow.polygon` | `L<L<C>>` | rings in one polygon |
| `geoarrow.multilinestring` | `L<L<C>>` | lines in one multi-line |
| `geoarrow.multipolygon` | `L<L<L<C>>>` | polygons, rings, coordinates |
| `geoarrow.geometry` | dense union | one selected child geometry |
| `geoarrow.geometrycollection` | `L<dense union>` | zero or more child geometries |

LineString and MultiPoint deliberately share a physical shape; their extension encoding supplies
the semantic difference. The same is true for Polygon and MultiLineString.

## Coordinate layouts

Interleaved coordinates are a `GeoArrowFixedSizeList` whose child is a numeric primitive. Its
`size` must match the semantic dimension.

```text
XY   [x0, y0, x1, y1, ...]
XYZ  [x0, y0, z0, x1, y1, z1, ...]
XYM  [x0, y0, m0, x1, y1, m1, ...]
XYZM [x0, y0, z0, m0, x1, y1, z1, m1, ...]
```

Separated coordinates are a `GeoArrowStruct` with primitive children named `x`, `y`, and the
dimension-appropriate `z` and/or `m`. The semantic names matter: a three-component tuple is not
enough to decide whether the third component is Z or M.

## Primitive views

`GeoArrowPrimitive` supports logical views without creating typed-array slices:

```typescript
{
  kind: 'primitive',
  length: 100,
  values: sourceValues,
  offset: 2,
  stride: 4
}
```

Logical value `i` is read at `values[offset + i * stride]`. This can expose one component of an
application-owned interleaved buffer without copying it.

## Variable lists and Int64 offsets

A `GeoArrowList` borrows `Int32Array` or `BigInt64Array` offsets. `offset` selects the first logical
row in the offsets view. `offsetBase` maps absolute producer offsets back into the supplied child
view:

```text
first = offsets[offset + row]     - offsetBase
last  = offsets[offset + row + 1] - offsetBase
```

Offsets must be monotonic and within child storage. Int64 values must also be representable as safe
JavaScript integers before a child view can be indexed.

## Validity and slices

Every nesting level may carry a `GeoArrowValidity`:

```typescript
{values: nullBitmap, bitOffset: 5}
```

Bit `bitOffset + i` corresponds to logical value `i`; one means valid. `sliceGeoArrowArray` advances
the logical offset and bitmap bit offset while retaining the same backing buffers. A full slice is
an identity operation.

Null and empty are distinct:

- a null concrete/list row has a cleared top-level validity bit;
- a null dense-union row dispatches to a child value whose validity bit is cleared;
- an empty variable geometry is valid and has equal adjacent list offsets;
- an empty point is conventionally represented by non-finite coordinate ordinates.

## Dense unions

`GeoArrowDenseUnion` contains:

- one `typeIds` entry per logical row;
- one `valueOffsets` entry per logical row;
- named children with stable integer type IDs and optional child-specific encoding, dimension, and
  coordinate layout;

Arrow dense unions do not have a root validity buffer. Every row must contain a valid type ID and
child offset. A null geometry therefore dispatches to a real child slot whose child validity bit is
cleared. Builders and WKB decoders always emit this Arrow-compatible representation. Readers retain
support for a legacy descriptor-level validity bitmap, but adapters must not attempt to construct an
Arrow dense union from that legacy form.

For row `i`, `typeIds[offset + i]` selects a child and `valueOffsets[offset + i]` selects the value
inside that child. Child arrays remain compact; union rows do not require placeholder values.

`normalizeGeoArrowUnion` sorts child descriptors by type ID without changing dispatch buffers or
child buffer identity. Geometry collections use a variable list whose child is the same dense-union
shape, so nested members share the union traversal machinery.

For a mixed column, child metadata is authoritative:

```typescript
children: [
  {name: 'Point Z', typeId: 2, encoding: 'geoarrow.point', dimension: 'xyz', data: pointZ},
  {name: 'Point M', typeId: 3, encoding: 'geoarrow.point', dimension: 'xym', data: pointM}
]
```

Legacy descriptors that omit child metadata fall back to the parent column declaration. New
builders should always populate it so that Z and M remain distinguishable after adaptation.

## Serialized values

`GeoArrowSerialized` stores WKB as `binary` and WKT as `utf8`. It borrows a byte buffer plus Int32 or
Int64 offsets and supports the same `offset`, `offsetBase`, validity, slicing, and chunk rules as
native geometry. Arrow BinaryView-style values can instead borrow four-word view records and a list
of out-of-line data buffers; short values remain inline in the view record. No consolidation copy is
required at the descriptor boundary.

Inspection does not decode serialized payloads. Decode explicitly with `decodeGeoArrowWKB` or
`decodeGeoArrowWKT` from `@math.gl/geoarrow/wkb` before coordinate algorithms.

## Boxes

`geoarrow.box` uses struct storage with canonical minimum ordinates followed by maximum ordinates:
`xmin`, `ymin`, optional `zmin`/`mmin`, `xmax`, `ymax`, and optional `zmax`/`mmax`.

## Borrowing and ownership

Descriptors never claim ownership of buffers. The package follows these rules:

1. read-only kernels do not write or detach;
2. zero-copy slices retain backing buffer identity;
3. identity conversions return the original descriptor;
4. allocating kernels return new descriptors and buffers;
5. builder write mode borrows caller-provided targets;
6. `getGeoArrowTransferList` only reports transferable buffers—the caller decides whether to
   transfer and detach them.

Do not mutate borrowed input while a kernel is running. If concurrent writers are required, use
application-level synchronization or immutable snapshots.

## Validation boundary

Call `validateGeoArrowColumn` after adapting data from an external runtime. Diagnostics have stable
codes and physical paths. Validation checks logical lengths, bitmap coverage, primitive views,
fixed-list sizes, list bounds, coordinate field names, list nesting, serialized storage kind, and
dense-union dispatch.
