import { trimmer } from 'dtrim';
import type { pino } from 'pino';
import { err, errWithCause } from 'pino-std-serializers';

import { DEFAULT_MAX_OBJECT_DEPTH } from '../formatters/index.js';

import { createOmitPropertiesSerializer } from './omitPropertiesSerializer.js';
import type { SerializerFn, TrimmerFn } from './types.js';

export const DEFAULT_OMIT_HEADER_NAMES = Object.freeze([
  'x-envoy-attempt-count',
  'x-envoy-decorator-operation',
  'x-envoy-expected-rq-timeout-ms',
  'x-envoy-external-address',
  'x-envoy-internal',
  'x-envoy-peer-metadata',
  'x-envoy-peer-metadata-id',
  'x-envoy-upstream-service-time',
]);

export interface SerializerOptions {
  /**
   * The request headers to omit from serialized logs.
   *
   * The properties listed will be removed under `headers` and `req.headers`.
   * Matching is currently case sensitive.
   * You will typically express the header names in lowercase,
   * as server frameworks normalise incoming headers.
   *
   * You can use this option to reduce logging costs.
   * Defaults to `DEFAULT_OMIT_HEADER_NAMES`,
   * and can be disabled by supplying an empty array `[]`.
   */
  omitHeaderNames?: readonly string[];

  maxObjectDepth?: number;

  serializers?: pino.LoggerOptions['serializers'];
}

interface Socket {
  remoteAddress?: string;
  remotePort?: string;
}
interface Request extends Record<string, unknown> {
  method: string;
  url: string;
  headers: Record<string, string>;
  socket?: Socket;
}

interface Response extends Record<string, unknown> {
  statusCode?: number;
  status?: number;
}

const getHeaders = ({ _header, header, headers }: Response) =>
  _header || header || headers;
const getStatus = ({ statusCode, status }: Response): number | undefined =>
  statusCode ?? status;

const isObject = (value: unknown): boolean => {
  const type = typeof value;
  return value != null && (type === 'object' || type === 'function');
};

const createReqSerializer =
  (serializeHeaders: SerializerFn) => (request: Request) =>
    isObject(request)
      ? {
          method: request.method,
          url: request.url,
          headers: serializeHeaders(request.headers),
          remoteAddress: request?.socket?.remoteAddress,
          remotePort: request?.socket?.remotePort,
        }
      : request;

const res = (response: Response) =>
  isObject(response)
    ? {
        statusCode: getStatus(response),
        headers: getHeaders(response),
      }
    : response;

export const trimSerializerOutput =
  (serializer: SerializerFn, trim: TrimmerFn): SerializerFn =>
  (input) =>
    trim(serializer(input));

export const createSerializers = (opts: SerializerOptions) => {
  const serializeHeaders = createOmitPropertiesSerializer(
    opts.omitHeaderNames ?? DEFAULT_OMIT_HEADER_NAMES,
  );

  // We are trimming inside one level of property nesting.
  const depth = Math.max(
    0,
    (opts.maxObjectDepth ?? DEFAULT_MAX_OBJECT_DEPTH) - 1,
  );

  const errSerializers = trimSerializers(
    {
      err,
      errWithCause,
    },
    // Retain long stack traces for troubleshooting purposes.
    trimmer({ depth, retain: new Set(['stack']) }),
  );

  const restSerializers = trimSerializers(
    {
      req: createReqSerializer(serializeHeaders),
      res,
      headers: serializeHeaders,
      ...opts.serializers,
    },
    trimmer({ depth }),
  );

  const serializers = {
    ...errSerializers,
    error: errSerializers.err,
    ...restSerializers,
  } satisfies pino.LoggerOptions['serializers'];

  return serializers;
};

const trimSerializers = <T extends string>(
  serializers: Record<T, SerializerFn>,
  trim: TrimmerFn,
) =>
  Object.fromEntries(
    Object.entries<SerializerFn>(serializers).map(
      ([property, serializer]) =>
        [property, trimSerializerOutput(serializer, trim)] as const,
    ),
  ) as Record<T, SerializerFn>;
