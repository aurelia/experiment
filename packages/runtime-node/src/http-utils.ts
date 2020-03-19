import * as http from 'http';

export const enum HTTPStatusCode {
  SwitchingProtocols = 101,

  OK = 200,
  Accepted = 202,
  NoContent = 204,

  Found = 302,

  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  MethodNotAllowed = 405,

  InternalServerError = 500,
  BadGateway = 502,
  ServiceUnavailable = 503,
  GatewayTimeout = 504,
}

export const enum ContentType {
  unknown = '',
  json = 'application/json; charset=utf-8',
  javascript = 'application/javascript; charset=utf-8',
  plain = 'text/plain; charset=utf-8',
  html = 'text/html; charset=utf-8',
  css = 'text/css; charset=utf-8',
}

export class HTTPError extends Error {
  public readonly statusCode: number;

  public constructor(statusCode: number, message?: string) {
    super(message);

    this.statusCode = statusCode;
  }
}

export async function readBuffer(req: http.IncomingMessage): Promise<Buffer> {
  let totalLength: number = 0;
  const chunks: Buffer[] = [];

  req.on('data', function (chunk: Buffer) {
    chunks.push(chunk);
    totalLength += chunk.length;
  });

  return new Promise(function (resolve, reject) {
    req.on('end', function () {
      const buffer = Buffer.concat(chunks, totalLength);

      resolve(buffer);
    });

    req.on('error', reject);
  });
}

export function getContentType(path: string): ContentType {
  const i = path.lastIndexOf('.');
  if (i >= 0) {
    switch (path.slice(i)) {
      case '.js': return ContentType.javascript;
      case '.css': return ContentType.css;
      case '.json': return ContentType.json;
      case '.html': return ContentType.html;
    }
  }

  return ContentType.plain;
}
