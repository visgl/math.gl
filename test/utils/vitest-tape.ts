import {expect, test as vitestTest} from 'vitest';

type TestCallback = (test: Test) => void | Promise<void>;
type MatchPattern = RegExp | string;

let currentTapeTest: VitestTape | null = null;

function isArrayBufferView(value: unknown): value is ArrayBufferView {
  return ArrayBuffer.isView(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function normalizeValue(value: unknown, seenValues: WeakSet<object> = new WeakSet()): unknown {
  if (typeof value === 'number' && Object.is(value, -0)) {
    return 0;
  }
  if (isArrayBufferView(value)) {
    return Array.from(value as ArrayLike<number>, item => normalizeValue(item, seenValues));
  }
  if (Array.isArray(value)) {
    return value.map(item => normalizeValue(item, seenValues));
  }
  if (isPlainObject(value)) {
    if (seenValues.has(value)) {
      return '[Circular]';
    }
    seenValues.add(value);
    const normalizedObject: Record<string, unknown> = {};
    for (const [key, entryValue] of Object.entries(value)) {
      normalizedObject[key] = normalizeValue(entryValue, seenValues);
    }
    seenValues.delete(value);
    return normalizedObject;
  }
  return value;
}

function normalizeThrowsArgs(
  expectedOrMessage?: MatchPattern | (new (...args: never[]) => Error) | string,
  message?: string
): {expected?: MatchPattern | (new (...args: never[]) => Error); message?: string} {
  if (typeof expectedOrMessage === 'string' && message === undefined) {
    return {message: expectedOrMessage};
  }
  return {
    expected: expectedOrMessage as MatchPattern | (new (...args: never[]) => Error) | undefined,
    message
  };
}

function usesExplicitEndSignal(callback: TestCallback): boolean {
  return /\.end\s*\(/.test(callback.toString());
}

export interface Test {
  assert(value: unknown, message?: string): void;
  comment(...messages: unknown[]): void;
  deepEqual(actual: unknown, expected: unknown, message?: string): void;
  deepEquals(actual: unknown, expected: unknown, message?: string): void;
  doesNotThrow(callback: () => unknown, message?: string): void;
  end(): void;
  equal(actual: unknown, expected: unknown, message?: string): void;
  equals(actual: unknown, expected: unknown, message?: string): void;
  fail(message?: string): never;
  is(actual: unknown, expected: unknown, message?: string): void;
  notEqual(actual: unknown, expected: unknown, message?: string): void;
  notEquals(actual: unknown, expected: unknown, message?: string): void;
  notOk(value: unknown, message?: string): void;
  ok(value: unknown, message?: string): void;
  pass(message?: string): void;
  plan(assertionCount: number): void;
  same(actual: unknown, expected: unknown, message?: string): void;
  skip(message?: string): void;
  strictEqual(actual: unknown, expected: unknown, message?: string): void;
  test(name: string, callback: TestCallback): void;
  throws(
    callback: () => unknown,
    expectedOrMessage?: MatchPattern | (new (...args: never[]) => Error) | string,
    message?: string
  ): void;
  timeoutAfter(timeoutMilliseconds: number): void;
  typeOf(value: unknown, expectedType: string, message?: string): void;
}

class VitestTape implements Test {
  private actualAssertionCount = 0;
  private readonly childTestPromises: Promise<void>[] = [];
  private readonly endPromise: Promise<void>;
  private endResolver: (() => void) | null = null;
  private hasEnded = false;
  private plannedAssertionCount?: number;
  private timeoutMilliseconds?: number;

  constructor(private readonly skipCallback?: (message?: string) => void) {
    this.endPromise = new Promise(resolve => {
      this.endResolver = resolve;
    });
  }

  assert(value: unknown, message?: string): void {
    this.ok(value, message);
  }

  comment(..._messages: unknown[]): void {}

  deepEqual(actual: unknown, expected: unknown, message?: string): void {
    this.countAssertion();
    expect(normalizeValue(actual), message).toEqual(normalizeValue(expected));
  }

  deepEquals(actual: unknown, expected: unknown, message?: string): void {
    this.deepEqual(actual, expected, message);
  }

  doesNotThrow(callback: () => unknown, message?: string): void {
    this.countAssertion();
    expect(callback, message).not.toThrow();
  }

  end(): void {
    if (!this.hasEnded) {
      this.hasEnded = true;
      this.endResolver?.();
    }
  }

  equal(actual: unknown, expected: unknown, message?: string): void {
    this.countAssertion();
    if (
      typeof actual === 'number' &&
      typeof expected === 'number' &&
      actual === 0 &&
      expected === 0
    ) {
      expect(true, message).toBe(true);
      return;
    }
    expect(actual, message).toBe(expected);
  }

  equals(actual: unknown, expected: unknown, message?: string): void {
    this.equal(actual, expected, message);
  }

  fail(message?: string): never {
    this.countAssertion();
    throw new Error(message || 'Forced failure');
  }

  is(actual: unknown, expected: unknown, message?: string): void {
    this.equal(actual, expected, message);
  }

  notEqual(actual: unknown, expected: unknown, message?: string): void {
    this.countAssertion();
    expect(actual, message).not.toBe(expected);
  }

  notEquals(actual: unknown, expected: unknown, message?: string): void {
    this.notEqual(actual, expected, message);
  }

  notOk(value: unknown, message?: string): void {
    this.countAssertion();
    expect(Boolean(value), message).toBe(false);
  }

  ok(value: unknown, message?: string): void {
    this.countAssertion();
    expect(Boolean(value), message).toBe(true);
  }

  pass(message?: string): void {
    this.countAssertion();
    expect(true, message).toBe(true);
  }

  plan(assertionCount: number): void {
    this.plannedAssertionCount = assertionCount;
  }

  same(actual: unknown, expected: unknown, message?: string): void {
    this.deepEqual(actual, expected, message);
  }

  skip(message?: string): void {
    this.skipCallback?.(message);
  }

  strictEqual(actual: unknown, expected: unknown, message?: string): void {
    this.equal(actual, expected, message);
  }

  test(_name: string, callback: TestCallback): void {
    this.childTestPromises.push(new VitestTape(this.skipCallback).run(callback));
  }

  throws(
    callback: () => unknown,
    expectedOrMessage?: MatchPattern | (new (...args: never[]) => Error) | string,
    message?: string
  ): void {
    this.countAssertion();
    const {expected, message: normalizedMessage} = normalizeThrowsArgs(expectedOrMessage, message);
    if (expected === undefined) {
      expect(callback, normalizedMessage).toThrow();
    } else {
      expect(callback, normalizedMessage).toThrow(expected as MatchPattern);
    }
  }

  timeoutAfter(timeoutMilliseconds: number): void {
    this.timeoutMilliseconds = timeoutMilliseconds;
  }

  typeOf(value: unknown, expectedType: string, message?: string): void {
    this.equal(typeof value, expectedType, message);
  }

  async run(callback: TestCallback): Promise<void> {
    const waitsForEnd = usesExplicitEndSignal(callback);
    const previousTapeTest = currentTapeTest;
    currentTapeTest = this;
    let callbackResult: void | Promise<void>;
    try {
      callbackResult = callback(this);
    } finally {
      currentTapeTest = previousTapeTest;
    }
    const callbackPromise = Promise.resolve(callbackResult);
    const completionPromise = waitsForEnd
      ? callbackPromise.then(async () => this.endPromise)
      : callbackPromise;

    if (this.timeoutMilliseconds === undefined) {
      await completionPromise;
    } else {
      await Promise.race([
        completionPromise,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error(`Test timed out after ${this.timeoutMilliseconds}ms`)),
            this.timeoutMilliseconds
          )
        )
      ]);
    }

    await Promise.all(this.childTestPromises);

    if (this.plannedAssertionCount !== undefined) {
      expect(this.actualAssertionCount).toBe(this.plannedAssertionCount);
    }
  }

  private countAssertion(): void {
    this.actualAssertionCount++;
  }
}

export type TapeTestFunction = {
  (name: string, callback: TestCallback): ReturnType<typeof vitestTest>;
  only: (name: string, callback: TestCallback) => ReturnType<typeof vitestTest.only>;
  skip: (name: string, callback?: TestCallback) => ReturnType<typeof vitestTest.skip>;
};

function wrapTest(
  vitestImplementation: typeof vitestTest | typeof vitestTest.only
): (name: string, callback?: TestCallback) => ReturnType<typeof vitestImplementation> {
  return ((name: string, callback?: TestCallback) => {
    if (currentTapeTest && callback) {
      currentTapeTest.test(name, callback);
      return undefined as ReturnType<typeof vitestImplementation>;
    }
    return vitestImplementation(name, async context => {
      if (callback) {
        await new VitestTape(message => context.skip(message)).run(callback);
      }
    });
  }) as (name: string, callback?: TestCallback) => ReturnType<typeof vitestImplementation>;
}

const test = wrapTest(vitestTest) as TapeTestFunction;
test.only = wrapTest(vitestTest.only);
test.skip = wrapTest(vitestTest.skip);

export default test;
