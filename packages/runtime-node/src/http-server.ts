import * as http from 'http';

import { ILogger, bound, all, IContainer } from '@aurelia/kernel';
import { IHttpServer, IHttpServerOptions, IRequestHandler, StartOutput } from './interfaces';
import { AddressInfo } from 'net';
import { HTTPStatusCode, readBuffer } from './http-utils';
import { HttpContext } from './http-context';

import * as ws from 'ws';

export class HttpServer implements IHttpServer {
  private server: http.Server | null = null;

  public constructor(
    @ILogger
    private readonly logger: ILogger,
    @IHttpServerOptions
    private readonly opts: IHttpServerOptions,
    @IContainer
    private readonly container: IContainer,
    @all(IRequestHandler)
    private readonly handlers: readonly IRequestHandler[],
  ) {
    this.logger = logger.root.scopeTo('HttpServer');
  }

  public async start(configureWsClient?: (client: ws) => void): Promise<StartOutput> {
    this.logger.debug(`start()`);

    const { hostName, port } = this.opts;

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.server = http.createServer(this.handleRequest).listen(port, hostName);
    await new Promise(resolve => this.server!.on('listening', resolve));

    const { address, port: realPort } = this.server.address() as AddressInfo;
    this.logger.info(`Now listening on ${address}:${realPort} (configured: ${hostName}:${port})`);

    if (configureWsClient !== void 0) {
      this.server.on('upgrade', (req, socket, head) => {
        this.logger.info(`Opening WebSocket`);

        const wss = new ws.Server({ noServer: true, perMessageDeflate: false });
        wss.handleUpgrade(req, socket, head, configureWsClient);
      });

    }

    return new StartOutput(realPort);
  }

  public async stop(): Promise<void> {
    this.logger.debug(`start()`);

    await new Promise(resolve => this.server!.close(resolve));
  }

  @bound
  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    this.logger.debug(`handleRequest(url=${req.url})`);

    try {
      const buffer = await readBuffer(req);
      const context = new HttpContext(this.container, req, res, buffer);
      for (const handler of this.handlers) {
        // eslint-disable-next-line no-await-in-loop
        await handler.handleRequest(context);
      }
    } catch (err) {
      this.logger.error(`handleRequest Error: ${err.message}\n${err.stack}`);

      res.statusCode = HTTPStatusCode.InternalServerError;
      res.end();
    }
  }
}
