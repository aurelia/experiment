import { IApiConfiguration } from './configuration';
import { IApiExtractor } from './api-extractor';
import { SourceFile } from 'ts-morph';

function notADeclarationFile(item:SourceFile){
  return !item.isDeclarationFile();
}

const defaultConfiguration: IApiConfiguration = {
  exports: {excludes:[]},
  files: {
    tsConfig: '',
    excludes: [
      '__tests__',
      '__e2e__',
      'node_modules',
      'dist'
    ], filter: [ notADeclarationFile   ]
  },
};

let configuration: IApiConfiguration = defaultConfiguration;

const apiExtractor: IApiExtractor = {
    configure: (configureAction?: (defaultConfig: IApiConfiguration) => IApiConfiguration) => {
        configuration = configureAction
            ? configureAction(Object.assign({}, defaultConfiguration))
            : defaultConfiguration;
    },
    reset: () => {
        configuration = defaultConfiguration;
    },
};

export {
    apiExtractor as ApiExtractor, configuration as ApiConfiguration,
    IApiExtractor, IApiConfiguration
};
