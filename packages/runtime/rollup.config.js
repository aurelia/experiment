// @ts-check
import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

const isDevBuild = process.env.BUILD === 'dev';

export default {
  input: 'src/index.ts',
  external: Object.keys(pkg.dependencies).concat(pkg.rollupExternal),
  output: [
    {
      file: `dist/esm/index${isDevBuild ? `.dev` : ''}.js`,
      format: 'es',
      sourcemap: true,
    },
    {
      file: `dist/cjs/index${isDevBuild ? `.dev` : ''}.js`,
      format: 'cjs',
      sourcemap: true,
    },
  ],
  plugins: [
    typescript({
      tsconfig: 'tsconfig.build.json',
      sourceMap: true,
      inlineSources: isDevBuild,
      include: ['../global.d.ts', 'src/**/*.ts'],
    }),
    replace({
      values: {
        __DEV__: String(isDevBuild)
      },
      preventAssignment: true,
    }),
    isDevBuild
      ? null
      : terser({
          module: true,
          compress: {
            ecma: 2015,
            pure_getters: true
          },
          mangle: {
            properties: {
              regex: /^_/
            }
          }
        }),
  ].filter(Boolean)
};
