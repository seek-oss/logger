import type pino from 'pino';
import { err, errWithCause } from 'pino-std-serializers';

import { createOmitPropertiesSerializer } from './omitPropertiesSerializer';
import type { SerializerFn } from './types';

export const defaultOmitHeaderNames = [
  'x-envoy-attempt-count',
  'x-envoy-decorator-operation',
  'x-envoy-expected-rq-timeout-ms',
  'x-envoy-external-address',
  'x-envoy-internal',
  'x-envoy-peer-metadata',
  'x-envoy-peer-metadata-id',
  'x-envoy-upstream-service-time',
];

export interface SerializerOptions {
  omitHeaderNames?: string[];
}

interface Socket {
  remoteAddress?: string;
  remotePort?: string;
}
export interface Request extends Record<string, unknown> {
  method: string;
  url: string;
  headers: Record<string, string>;
  socket: Socket;
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

export const createSerializers = (
  opts: SerializerOptions & Pick<pino.LoggerOptions, 'serializers'>,
) => {
  const serializeHeaders = createOmitPropertiesSerializer(
    opts.omitHeaderNames ?? defaultOmitHeaderNames,
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
