import { SourceFileInfo } from '../../api/models/source-file/source-file-info';
import { Project } from 'ts-morph';
import { SourceFileExtractor } from '../../api';
import { ApiConfiguration as config } from '../../api';

export function getAureliaSources(tsconfig?: string): SourceFileInfo {

  const project = new Project({
    tsConfigFilePath: tsconfig || config.files.tsConfig,
  });

  const sources = project
    .getSourceFiles()
    .filter(item => {

      // loop over excluding folders
      for (let index = 0; index < config.files.excludes.length; index++) {
        if (item.getFilePath().includes(config.files.excludes[index])) {
          return false;
        }
      }

      // loop over filter delegates
      if (config.files.filter) {
        for (let index = 0; index < config.files.filter.length; index++) {
          let functionFilters = config.files.filter[index](item);
          if (functionFilters === false) {
            return false;
          }
        }
      }

      //include this path/folder if none of above code applied
      return true;

    });

  const extractor = new SourceFileExtractor();
  const result = extractor.extractAll(sources);
  return result;
}
