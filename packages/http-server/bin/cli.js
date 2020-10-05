#!/usr/bin/env node

try {
  require('../dist/umd/cli.js');
} catch {
  require('../dist/esnext/cli.js');
}
