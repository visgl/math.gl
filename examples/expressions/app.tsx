import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  BASIC_MATH_FUNCTION_LIBRARY,
  ExpressionFunctionRegistry,
  GEOSPATIAL_FUNCTION_LIBRARY,
  compileAsync,
  type ExpressionFunctionLibrary
} from '@math.gl/expressions';
/* The repository ESLint resolver does not understand package export subpaths. */
/* eslint-disable import/no-unresolved */
import {
  GEOHASH_FUNCTION_LIBRARY,
  QUADKEY_FUNCTION_LIBRARY,
  S2_FUNCTION_LIBRARY
} from '@math.gl/expressions/dggs';
/* eslint-enable import/no-unresolved */
import {EXPRESSION_SAMPLES, type ExpressionSample, type LibraryId} from './samples';
import './styles.css';

const WORLD_MAP_URL =
  'https://commons.wikimedia.org/wiki/Special:FilePath/BlankMap-Equirectangular.svg';

const LIBRARIES: Record<
  LibraryId,
  {label: string; description: string; functions: ExpressionFunctionLibrary}
> = {
  math: {
    label: 'Basic math',
    description: 'Angles, interpolation, trigonometry, and scalar helpers',
    functions: BASIC_MATH_FUNCTION_LIBRARY
  },
  geospatial: {
    label: 'WGS84',
    description: 'Ellipsoid conversion, normals, and local frames',
    functions: GEOSPATIAL_FUNCTION_LIBRARY
  },
  geohash: {
    label: 'GeoHash',
    description: 'Cell centers, bounds, and boundaries',
    functions: GEOHASH_FUNCTION_LIBRARY
  },
  quadkey: {
    label: 'Quadkey',
    description: 'Tile centers, world bounds, and boundaries',
    functions: QUADKEY_FUNCTION_LIBRARY
  },
  s2: {
    label: 'S2',
    description: 'Token conversion, child cells, and boundaries',
    functions: S2_FUNCTION_LIBRARY
  }
};

const INITIAL_SAMPLE = EXPRESSION_SAMPLES[3];

export default function ExpressionPlayground(): JSX.Element {
  const [sampleId, setSampleId] = useState(INITIAL_SAMPLE.id);
  const [expression, setExpression] = useState(INITIAL_SAMPLE.expression);
  const [contextText, setContextText] = useState(formatJson(INITIAL_SAMPLE.context));
  const [enabledLibraries, setEnabledLibraries] = useState<LibraryId[]>(INITIAL_SAMPLE.libraries);
  const [result, setResult] = useState<unknown>();
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const registry = useMemo(() => {
    const nextRegistry = new ExpressionFunctionRegistry();
    for (const libraryId of enabledLibraries) {
      nextRegistry.registerFunctions(LIBRARIES[libraryId].functions, {replace: true});
    }
    return nextRegistry;
  }, [enabledLibraries]);

  const functionNames = useMemo(() => Object.keys(registry.getFunctionTable()).sort(), [registry]);

  const runExpression = useCallback(async () => {
    setIsRunning(true);
    try {
      const context = JSON.parse(contextText) as Record<string, unknown>;
      const evaluate = compileAsync(expression, {registry});
      setResult(await evaluate(context));
      setError('');
    } catch (caughtError) {
      setResult(undefined);
      setError(caughtError instanceof Error ? caughtError.message : String(caughtError));
    } finally {
      setIsRunning(false);
    }
  }, [contextText, expression, registry]);

  const startEvaluation = useCallback((): void => {
    runExpression().catch((caughtError: unknown) => {
      setResult(undefined);
      setError(caughtError instanceof Error ? caughtError.message : String(caughtError));
      setIsRunning(false);
    });
  }, [runExpression]);

  useEffect(() => {
    startEvaluation();
  }, [startEvaluation]);

  function selectSample(sample: ExpressionSample): void {
    setSampleId(sample.id);
    setExpression(sample.expression);
    setContextText(formatJson(sample.context));
    setEnabledLibraries(sample.libraries);
  }

  function toggleLibrary(libraryId: LibraryId): void {
    setEnabledLibraries(current =>
      current.includes(libraryId) ? current.filter(id => id !== libraryId) : [...current, libraryId]
    );
  }

  return (
    <main className="expression-playground">
      <header className="playground-header">
        <div>
          <p className="eyebrow">@math.gl/expressions</p>
          <h1>Expression playground</h1>
          <div className="release-status" aria-label="Release status">
            <span>Experimental</span>
            <span>From v4.2</span>
          </div>
        </div>
        <label className="sample-picker">
          <span>Sample</span>
          <select
            value={sampleId}
            onChange={event => {
              const sample = EXPRESSION_SAMPLES.find(
                candidate => candidate.id === event.target.value
              );
              if (sample) {
                selectSample(sample);
              }
            }}
          >
            <option value="" disabled>
              Custom expression
            </option>
            {groupSamples(EXPRESSION_SAMPLES).map(([group, samples]) => (
              <optgroup key={group} label={group}>
                {samples.map(sample => (
                  <option key={sample.id} value={sample.id}>
                    {sample.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </header>

      <section className="library-strip" aria-label="Function libraries">
        {(Object.keys(LIBRARIES) as LibraryId[]).map(libraryId => {
          const library = LIBRARIES[libraryId];
          return (
            <label className="library-toggle" key={libraryId}>
              <input
                type="checkbox"
                checked={enabledLibraries.includes(libraryId)}
                onChange={() => toggleLibrary(libraryId)}
              />
              <span>
                <strong>{library.label}</strong>
                <small>{library.description}</small>
              </span>
            </label>
          );
        })}
      </section>

      <div className="workbench">
        <section className="editor-pane">
          <div className="pane-heading">
            <h2>Expression</h2>
            <button type="button" onClick={startEvaluation} disabled={isRunning}>
              {isRunning ? 'Running' : 'Run'}
            </button>
          </div>
          <textarea
            className="expression-input"
            aria-label="Expression"
            value={expression}
            spellCheck={false}
            onChange={event => {
              setSampleId('');
              setExpression(event.target.value);
            }}
            onKeyDown={event => {
              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                event.preventDefault();
                startEvaluation();
              }
            }}
          />

          <h2>Context</h2>
          <textarea
            className="context-input"
            aria-label="JSON context"
            value={contextText}
            spellCheck={false}
            onChange={event => {
              setSampleId('');
              setContextText(event.target.value);
            }}
          />

          <div className="function-index">
            <h2>Available functions</h2>
            <div className="function-list">
              {functionNames.length ? (
                functionNames.map(name => <code key={name}>{name}</code>)
              ) : (
                <span className="empty-message">Select a function library.</span>
              )}
            </div>
          </div>
        </section>

        <section className="result-pane" aria-live="polite">
          <div className="pane-heading">
            <h2>Result</h2>
            <span className={error ? 'status status-error' : 'status'}>
              {error ? 'Evaluation error' : 'Ready'}
            </span>
          </div>

          {error ? (
            <pre className="error-output">{error}</pre>
          ) : (
            <pre className="result-output">{formatJson(result)}</pre>
          )}

          <GeometryPreview value={result} />
        </section>
      </div>

      <footer className="playground-footer">
        <span>Run with ⌘ Enter or Ctrl Enter.</span>
        <a
          href="https://commons.wikimedia.org/wiki/File:BlankMap-Equirectangular.svg"
          target="_blank"
          rel="noreferrer"
        >
          Public-domain map
        </a>
      </footer>
    </main>
  );
}

function GeometryPreview({value}: {value: unknown}): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const coordinates = useMemo(() => extractCoordinates(value), [value]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    // Canvas setup and path rendering are kept together to make resize redraws atomic.
    // eslint-disable-next-line max-statements
    const draw = (): void => {
      const bounds = canvas.getBoundingClientRect();
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(bounds.width * pixelRatio));
      canvas.height = Math.max(1, Math.round(bounds.height * pixelRatio));

      const context = canvas.getContext('2d');
      if (!context) {
        return;
      }
      context.scale(pixelRatio, pixelRatio);
      context.clearRect(0, 0, bounds.width, bounds.height);
      if (!coordinates.length) {
        return;
      }

      context.beginPath();
      coordinates.forEach(([longitude, latitude], index) => {
        const x = ((longitude + 180) / 360) * bounds.width;
        const y = ((90 - latitude) / 180) * bounds.height;
        if (index === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      });
      context.lineJoin = 'round';
      context.lineCap = 'round';
      context.strokeStyle = '#ffffff';
      context.lineWidth = 6;
      context.stroke();
      context.strokeStyle = '#d94736';
      context.lineWidth = 3;
      context.stroke();

      if (coordinates.length === 1) {
        const [longitude, latitude] = coordinates[0];
        const x = ((longitude + 180) / 360) * bounds.width;
        const y = ((90 - latitude) / 180) * bounds.height;
        context.beginPath();
        context.arc(x, y, 6, 0, Math.PI * 2);
        context.fillStyle = '#d94736';
        context.fill();
        context.strokeStyle = '#ffffff';
        context.lineWidth = 2;
        context.stroke();
      }
    };

    draw();
    const resizeObserver = new ResizeObserver(draw);
    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [coordinates]);

  return (
    <div className="geometry-preview">
      <div className="preview-heading">
        <h2>Geometry</h2>
        <span>{coordinates.length ? `${coordinates.length} positions` : 'No coordinates'}</span>
      </div>
      <div className="map-stage">
        <img src={WORLD_MAP_URL} alt="Equirectangular world map" />
        <canvas ref={canvasRef} aria-label="Expression geometry preview" />
      </div>
    </div>
  );
}

function extractCoordinates(value: unknown): [number, number][] {
  const normalized = ArrayBuffer.isView(value)
    ? Array.from(value as unknown as ArrayLike<number>)
    : value;

  if (Array.isArray(normalized) && normalized.length >= 1 && normalized.every(isPosition)) {
    return normalized.map(position => [position[0], position[1]]);
  }

  if (
    Array.isArray(normalized) &&
    normalized.length >= 2 &&
    normalized.length % 2 === 0 &&
    normalized.every(coordinate => typeof coordinate === 'number')
  ) {
    const coordinates: [number, number][] = [];
    for (let index = 0; index < normalized.length; index += 2) {
      coordinates.push([normalized[index], normalized[index + 1]]);
    }
    return coordinates;
  }

  return [];
}

function isPosition(value: unknown): value is [number, number, ...unknown[]] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number'
  );
}

function formatJson(value: unknown): string {
  if (value === undefined) {
    return '';
  }
  return JSON.stringify(
    value,
    (_key, nestedValue: unknown) => {
      if (typeof nestedValue === 'bigint') {
        return `${nestedValue}n`;
      }
      if (ArrayBuffer.isView(nestedValue)) {
        return Array.from(nestedValue as unknown as ArrayLike<number>);
      }
      return nestedValue;
    },
    2
  );
}

function groupSamples(samples: ExpressionSample[]): Array<[string, ExpressionSample[]]> {
  const groups = new Map<string, ExpressionSample[]>();
  for (const sample of samples) {
    const group = groups.get(sample.group) || [];
    group.push(sample);
    groups.set(sample.group, group);
  }
  return Array.from(groups);
}
