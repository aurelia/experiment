import { IFilePath, ITypeCategory  } from '../../../helpers';

export interface TypeImport extends ITypeCategory, IFilePath {
    name: string;
    fromNodeModules: boolean;
}
