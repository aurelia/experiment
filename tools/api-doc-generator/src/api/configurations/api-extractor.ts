import { IApiConfiguration } from './configuration';

export interface IApiExtractor {
    configure: (configureAction?: (defaultConfig: IApiConfiguration) => IApiConfiguration) => void;
    reset: () => void;
}
