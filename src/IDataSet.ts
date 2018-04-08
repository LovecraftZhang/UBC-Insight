import {InsightDatasetKind} from "./controller/IInsightFacade";

export default interface IDataSet {
    kind: InsightDatasetKind;
    content: any[];
}
