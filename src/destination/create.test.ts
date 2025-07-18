import { EventEmitter } from 'events';

import { createDestination } from './create.js';

describe('createDestination', () => {
  const msg = JSON.stringify({
    key: { 1: 'a', 2: 'b' },
    name: 'test',
    timestamp: 1234567890,
    latency: 123,
    level: 30,
    msg: 'hello world',
    '~': { c: '3', d: '4' },
  });

  describe('mock', () => {
    it('can be enabled', () => {
      const { destination, stdoutMock } = createDestination({ mock: true });

      expect(destination).toBe(stdoutMock);
    });

    it('can be disabled', () => {
      const { destination, stdoutMock } = createDestination({ mock: false });

      expect(destination).not.toBe(stdoutMock);
      expect(destination).toBeInstanceOf(EventEmitter);
    });

    it('throws on malformed JSON', () => {
      const { stdoutMock } = createDestination({ mock: true });

      expect(() => stdoutMock.write('}')).toThrowErrorMatchingInlineSnapshot(
        `"Unexpected token '}', "}" is not valid JSON"`,
      );
    });

    it('throws on JSON primitive', () => {
      const { stdoutMock } = createDestination({ mock: true });

      expect(() => stdoutMock.write('null')).toThrowErrorMatchingInlineSnapshot(
        `"fast-redact: primitives cannot be redacted"`,
      );
    });

    it('throws on non-object JSON', () => {
      const { stdoutMock } = createDestination({ mock: true });

      expect(() => stdoutMock.write('[]')).toThrowErrorMatchingInlineSnapshot(
        `"@seek/logger mocking failed to process a log message: []"`,
      );
    });
  });

  describe('redact + remove', () => {
    it('applies defaults', () => {
      const { destination, stdoutMock } = createDestination({ mock: true });

      destination.write(msg);

      expect(stdoutMock.onlyCall()).toMatchInlineSnapshot(`
        {
          "key": {
            "1": "a",
            "2": "b",
          },
          "latency": "-",
          "level": 30,
          "msg": "hello world",
          "~": {
            "c": "3",
            "d": "4",
          },
        }
      `);
    });

    it('can be disabled', () => {
      const { destination, stdoutMock } = createDestination({
        mock: {
          redact: [],
          remove: [],
        },
      });

      destination.write(msg);

      expect(stdoutMock.onlyCall()).toMatchInlineSnapshot(`
        {
          "key": {
            "1": "a",
            "2": "b",
          },
          "latency": 123,
          "level": 30,
          "msg": "hello world",
          "name": "test",
          "timestamp": 1234567890,
          "~": {
            "c": "3",
            "d": "4",
          },
        }
      `);
    });

    it('can be overwritten', () => {
      const { destination, stdoutMock } = createDestination({
        mock: {
          redact: ['name', 'timestamp'],
          remove: ['latency', 'level', 'msg'],
        },
      });

      destination.write(msg);

      expect(stdoutMock.onlyCall()).toMatchInlineSnapshot(`
        {
          "key": {
            "1": "a",
            "2": "b",
          },
          "name": "-",
          "timestamp": "-",
          "~": {
            "c": "3",
            "d": "4",
          },
        }
      `);
    });

    it('can be extended', () => {
      const { destination, stdoutMock } = createDestination({
        mock: {
          redact: [
            ...createDestination.defaults.mock.redact,
            'key',
            'tryToRedactPropertyThatDoesNotExist',
          ],
          remove: [
            ...createDestination.defaults.mock.remove,
            "['~']",
            'tryToRemovePropertyThatDoesNotExist',
          ],
        },
      });

      destination.write(msg);

      expect(stdoutMock.onlyCall()).toMatchInlineSnapshot(`
        {
          "key": "-",
          "latency": "-",
          "level": 30,
          "msg": "hello world",
        }
      `);
    });

    it('supports nested properties', () => {
      const { destination, stdoutMock } = createDestination({
        mock: {
          redact: [...createDestination.defaults.mock.redact, "key['1']"],
          remove: [...createDestination.defaults.mock.remove, "['~'].d"],
        },
      });

      destination.write(msg);

      expect(stdoutMock.onlyCall()).toMatchInlineSnapshot(`
        {
          "key": {
            "1": "-",
            "2": "b",
          },
          "latency": "-",
          "level": 30,
          "msg": "hello world",
          "~": {
            "c": "3",
          },
        }
      `);
    });

    it('supports overwriting redact only', () => {
      const { destination, stdoutMock } = createDestination({
        mock: {
          redact: [],
        },
      });

      destination.write(JSON.stringify({ latency: 123, name: 'test' }));

      expect(stdoutMock.onlyCall()).toMatchInlineSnapshot(`
        {
          "latency": 123,
        }
      `);
    });

    it('supports overwriting remove only', () => {
      const { destination, stdoutMock } = createDestination({
        mock: {
          remove: [],
        },
      });

      destination.write(JSON.stringify({ latency: 123, name: 'test' }));

      expect(stdoutMock.onlyCall()).toMatchInlineSnapshot(`
        {
          "latency": "-",
          "name": "test",
        }
      `);
    });
  });

  describe('calls + onlyCall', () => {
    const { destination, stdoutMock } = createDestination({ mock: true });

    afterEach(stdoutMock.clear);

    test('no calls', () => {
      expect(stdoutMock.calls).toMatchInlineSnapshot(`[]`);

      expect(stdoutMock.onlyCall).toThrowErrorMatchingInlineSnapshot(
        `"stdoutMock.onlyCall() found 0 calls; expected exactly 1"`,
      );
    });

    test('1 call', () => {
      destination.write('{}');

      expect(stdoutMock.calls).toMatchInlineSnapshot(`
        [
          {},
        ]
      `);

      expect(stdoutMock.onlyCall()).toMatchInlineSnapshot(`{}`);
    });

    it('multiple calls', () => {
      destination.write('{}');
      destination.write('{}');

      expect(stdoutMock.calls).toMatchInlineSnapshot(`
        [
          {},
          {},
        ]
      `);

      expect(stdoutMock.onlyCall).toThrowErrorMatchingInlineSnapshot(
        `"stdoutMock.onlyCall() found 2 calls; expected exactly 1"`,
      );
    });
  });
});
