import { TypeInfo } from '../../Api/models/type/type-info';
import * as nj from 'nunjucks';
import { AlternativeTagsName } from '../models/alternative-tags-name';

export interface ITemplateConfiguration {
  typeMapper: (typeInfo: TypeInfo) => string;
  appendComments?: boolean;
  environment: nj.Environment;
  alterTags?: AlternativeTagsName[];
}
