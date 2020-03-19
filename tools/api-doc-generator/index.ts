import { generateApiDoc, TemplateGenerator, ApiExtractor } from "./src";
import { environment } from './environment';

/*function excludeVeryLargeFilesHere(item: SourceFile) {

  var path = item.getFilePath();
  return true;

}*/

ApiExtractor.configure(configuration => {

  configuration.files.tsConfig = environment.tsConfigFile;

  configuration.exports.excludes.push('aot/src/vm', 'testing/src/data');

  //configuration.files.filter.push(excludeVeryLargeFilesHere);

  return configuration;

});

generateApiDoc("./docs/user-docs/api", './docs/user-docs/TOC.md', 'api');
