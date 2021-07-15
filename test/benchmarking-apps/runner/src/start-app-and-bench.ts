/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { join, resolve } from 'path';
import * as Mocha from 'mocha';
import * as kill from 'tree-kill';
import { Data, FrameworkMetadata } from './shared';

async function main({ framework, iterations }: { framework: Data<FrameworkMetadata>; iterations: number }) {
  let app: ChildProcessWithoutNullStreams = null!;
  let failures: number = 0;
  try {
    const fxName = framework.name;
    const appPath = resolve(process.cwd(), framework.localPath);
    await buildApp(fxName, framework.version !== 'local', appPath);

    const port = framework.port;
    app = await startApp(fxName, appPath, port);

    // Run bench
    // Inject globals
    (globalThis as any).$$framework = fxName;
    (globalThis as any).$$frameworkVersion = framework.version;
    (globalThis as any).$$port = port;
    (globalThis as any).$$iterations = iterations;
    const measurements = (globalThis as any).$$measurements = [];
    const mocha = new Mocha({
      ui: 'bdd',
      color: true,
      reporter: 'spec',
      timeout: 1200000,
    });
    mocha.addFile(join(__dirname, 'bench.spec.js'));
    await new Promise<void>((res, rej) => {
      mocha.run(function ($failures) {
        failures = $failures;
        if ($failures === 0) {
          res();
        } else {
          rej(new Error(`mocha failed for '${fxName}'.`));
        }
      });
    });
    process.send!(measurements);
  } catch (e) {
    console.error(`run for the framework '${framework.name}' failed with`, e);
    ++failures;
  } finally {
    if (app !== null) {
      kill(app.pid);
    }
    process.exit(failures);
  }
}

async function buildApp(fxName: string, needDepsInstallation: boolean, appPath: string) {
  const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  if (needDepsInstallation) {
    await new Promise<void>((res) => {
      const installation = spawn(cmd, ['i'], { cwd: appPath, shell: true });
      installation.stdout.on('data', function (d) { console.log(d.toString()); });
      installation.stderr.on('data', function (d) { console.warn(d.toString()); });
      installation.on('exit', res);
    });
  }
  return new Promise<void>((res, rej) => {
    const build = spawn(cmd, ['run', 'build-app'], { cwd: appPath });
    build.stdout.on('data', function (d) { console.log(d.toString()); });
    build.stderr.on('data', function (d) {
      const err = d.toString();
      if (err.includes('DeprecationWarning')) {
        console.warn(err);
      } else {
        rej(new Error(`The app for the framework '${fxName}' cannot be built. Error: ${err}`));
      }
    });
    build.on('exit', res);
  });
}

async function startApp(fxName: string, appPath: string, port: string) {
  return new Promise<ChildProcessWithoutNullStreams>((res, rej) => {
    const app = spawn(
      'node',
      [
        '../../../packages/http-server/dist/esm/cli.js',
        '--root',
        join(appPath, 'dist'),
        '--port',
        port,
        '--responseCacheControl',
        'no-store'
      ]
    );
    app.stdout.on('data', function (d) {
      const message: string = d.toString();
      console.log(message);
      if (new RegExp(`listening.+:${port}`).test(message)) {
        res(app);
      }
    });
    app.stderr.on('data', function (d) {
      rej(new Error(`The app for the framework '${fxName}' cannot be started. Error: ${d.toString()}`));
    });
  });
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.on('message', main);
