import type pino from 'pino';
import { err, errWithCause } from 'pino-std-serializers';

import { createOmitPropertiesSerializer } from './omitPropertiesSerializer';
import type { SerializerFn } from './types';

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

export const createSerializers = (opts: SerializerOptions) => {
  const serializeHeaders = createOmitPropertiesSerializer(
    opts.omitHeaderNames ?? DEFAULT_OMIT_HEADER_NAMES,
  );

  const serializers = {
    err,
    errWithCause,
    req: createReqSerializer(serializeHeaders),
    res,
    headers: serializeHeaders,
  } satisfies pino.LoggerOptions['serializers'];

  return serializers;
};
