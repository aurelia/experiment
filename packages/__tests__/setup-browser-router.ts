import { BrowserPlatform } from '@aurelia/platform-browser';
import { $setup } from './setup-shared.js';

const platform = new BrowserPlatform(window);
$setup(platform);

console.log(`Browser router test context initialized`);

const testContext = require.context('.', true, /router\/.[^_].*?\.spec\.js$/i);
// const testContext = require.context('.', true, /router\/__smoke.*?\.spec\.js$/i);
testContext.keys().forEach(testContext);
