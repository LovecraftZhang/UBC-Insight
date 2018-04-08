import * as fs from "fs";
import * as JSZip from "jszip";
import Courses, {default as CourseSet} from "../CourseSet";
import DataFilter from "../DataFilter";
import QueryValidator from "../QueryValidator";
import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightResponse} from "./IInsightFacade";
import IDataSet from "../IDataSet";
import RoomSet from "../RoomSet";

/**
 * This is the main programmatic entry point for the project.
 */
export default class InsightFacade implements IInsightFacade {
    public datasets: {[id: string]: IDataSet};

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.datasets = {};
        if (!fs.existsSync("./src/Data/")) {
            fs.mkdirSync("./src/Data");
        }
        const files = fs.readdirSync("./src/Data/");
        if ( files.length !== 0) {
            for (const file of files) {
                const id = file.replace((/\.[^/.]+$/), "");
                const fileContent: Buffer = fs.readFileSync("./src/Data/" + file);
                this.datasets[id] = JSON.parse(fileContent.toString());
            }
        }
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<InsightResponse> {
        const jszip = JSZip();
        const that = this;
        let dataset: any;
        switch (kind) {
            case InsightDatasetKind.Courses:
                dataset = new CourseSet();
                break;
            case InsightDatasetKind.Rooms:
                dataset = new RoomSet();
                break;
        }
        return new Promise<InsightResponse>(function (fulfill, reject) {
            if (id === null || id === undefined) {
                return reject({code: 400, body: {error: "Invalid id"}});
            }
            if (that.datasets.hasOwnProperty(id)) {
                return reject({code: 400, body: {error: "The dataset has been previously added"}});
            }
            jszip.loadAsync(content, {base64: true}).then(function (zip) {
                dataset.loadData(zip).then(function () {
                    that.datasets[id] = dataset;
                    fs.writeFile("./src/Data/" + id + ".json", JSON.stringify(dataset), (err) => {
                        if (err) {throw err; }
                        return fulfill({code: 204, body: {result: "The dataset has been successfully added"}});
                    });
                }).catch(function (errorbody: InsightResponse) {
                    return reject(errorbody);
                });
            }).catch(function (err) {
                return reject({code: 400, body: {error: "jszip cannot be loaded"}});
            });
        });
    }

    public removeDataset(id: string): Promise<InsightResponse> {
        const that = this;
        return new Promise<InsightResponse>(function (fulfill, reject) {
            if (id === null || id === undefined) {
                return reject({code: 404, body: {error: "Invalid id"}});
            }
            if (!that.datasets.hasOwnProperty(id)) {
                return reject({code: 404, body: {result: "The dataset has not been previously added"}});
            }
            Object.keys(that.datasets).forEach(function (key) {
                if (key === id) {
                    delete that.datasets[key];
                    fs.unlink("./src/Data/" + id + ".json", (err) => {
                        if (err) {throw err; }
                        return fulfill({code: 204, body: {result: "The dataset has been successfully deleted"}});
                    });
                }
            });
        });
    }

    public performQuery(query: any): Promise <InsightResponse> {
        const that = this;
        return new Promise<InsightResponse>(function (fulfill, reject) {
            let targetId: string;
            const queryValidator = new QueryValidator(that.datasets);
            if (!queryValidator.isQueryValid(query)) {
                return reject({code: 400, body: {error: queryValidator.error}});
            } else {
                targetId = queryValidator.datasetID;
            }
            const responseBody = DataFilter.algorithm(query, that.datasets[targetId].content);
            return fulfill({code: 200, body: {result: responseBody}});
        });
    }

    public listDatasets(): Promise<InsightResponse> {
        const datasetsInsight: InsightDataset[] = [];
        const that = this;
        return new Promise<InsightResponse>(function (fulfill, reject) {
            for (const key in that.datasets) {
                if (that.datasets.hasOwnProperty(key)) {
                    datasetsInsight.push({
                        id: key,
                        kind: that.datasets[key].kind,
                        numRows: that.datasets[key].content.length,
                    });
                }
            }
            return fulfill({code: 200, body: {result: datasetsInsight}});
        });
    }
}
