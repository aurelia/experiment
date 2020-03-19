import { CoverageItemInfo } from './coverage-item-info';

export interface CoverageInfo {
    items: CoverageItemInfo[] | undefined;
    documentedCount: number;
    undocumentedCount: number;
    percent: number;
}
