import { Aurelia } from '../runtime/aurelia';
import { App } from './app';
import { GeneratedConfiguration } from './generated-configuration';
import { DebugConfiguration } from '../debug/configuration';
import { enableArrayObservation } from '../runtime/binding/observation/array-observer';

enableArrayObservation();
window['au'] = new Aurelia()
  .register(GeneratedConfiguration, DebugConfiguration)
  .app({ host: document.querySelector('app'), component: new App() })
  .start();
