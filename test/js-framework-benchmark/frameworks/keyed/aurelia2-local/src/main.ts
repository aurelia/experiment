import {
  Aurelia,
  StandardConfiguration
} from '@aurelia/runtime-html';

import { App } from './app';

new Aurelia().register(StandardConfiguration).app({
  host: document.querySelector('app') as HTMLElement,
  component: App
}).start();
