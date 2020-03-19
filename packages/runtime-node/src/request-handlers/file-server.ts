import * as url from 'url';
import { join, resolve } from 'path';

import { ILogger } from '@aurelia/kernel';

import { IRequestHandler, IHttpServerOptions, IFileSystem, Encoding } from '../interfaces';
import { IHttpContext, HttpContextState } from '../http-context';
import { getContentType, HTTPStatusCode } from '../http-utils';

export class FileServer implements IRequestHandler {
  private readonly root: string;

  public constructor(
    @IHttpServerOptions
    private readonly opts: IHttpServerOptions,
    @ILogger
    private readonly logger: ILogger,
    @IFileSystem
    private readonly fs: IFileSystem,
  ) {
    this.logger = logger.root.scopeTo('FileServer');

    this.root = resolve(opts.root);

    this.logger.debug(`Now serving files from: "${this.root}"`);
  }

  public async handleRequest(context: IHttpContext): Promise<void> {
    const parsedUrl = url.parse(context.request.url!);
    const path = join(this.root, parsedUrl.path!);

    if (await this.fs.isReadable(path)) {
      this.logger.debug(`Serving file "${path}"`);

      const content = await this.fs.readFile(path, Encoding.utf8);
      const contentType = getContentType(path);

      context.response.writeHead(HTTPStatusCode.OK, {
        'Content-Type': contentType,
      });

      await new Promise(function (resolve) {
        context.response.end(content, resolve);
      });

    } else {
      this.logger.debug(`File "${path}" could not be found`);

      context.response.writeHead(HTTPStatusCode.NotFound);

      await new Promise(function (resolve) {
        context.response.end(resolve);
      });
    }

    context.state = HttpContextState.end;
  }

}
