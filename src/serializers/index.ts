import { err, errWithCause } from 'pino-std-serializers';

interface Socket {
  remoteAddress?: string;
  remotePort?: string;
}
interface Request extends Record<string, unknown> {
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
  statusCode || status;

const isObject = (value: any): boolean => {
  const type = typeof value;
  return value != null && (type === 'object' || type === 'function');
};

const req = (request: Request) =>
  isObject(request)
    ? {
        method: request.method,
        url: request.url,
        headers: request.headers,
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

export default {
  err,
  errWithCause,
  res,
  req,
};
