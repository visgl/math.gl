# parsePGM

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.4-blue.svg?style=flat-square" alt="From-v3.4" />
</p>

Parse header of "Earth Gravity Model" \*.pgm file.

## Functions

### parsePGM(data, options)

Parse "Earth Gravity Model" loaded from a \*.pgm file, e.g. https://geographiclib.sourceforge.io/html/geoid.html

```ts
parsePGM(data: Uint8Array, options: object}): GeoidHeightModel
```

- `data` - binary buffer of pgm file
- `options` - loader options
- `GeoidHeightModel` - instance of `GeoidHeightModel` class
