"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const JSZip = require("jszip");
const CourseSet_1 = require("../CourseSet");
const DataFilter_1 = require("../DataFilter");
const QueryValidator_1 = require("../QueryValidator");
const Util_1 = require("../Util");
const IInsightFacade_1 = require("./IInsightFacade");
const RoomSet_1 = require("../RoomSet");
class InsightFacade {
    constructor() {
        Util_1.default.trace("InsightFacadeImpl::init()");
        this.datasets = {};
        if (!fs.existsSync("./src/Data/")) {
            fs.mkdirSync("./src/Data");
        }
        const files = fs.readdirSync("./src/Data/");
        if (files.length !== 0) {
            for (const file of files) {
                const id = file.replace((/\.[^/.]+$/), "");
                const fileContent = fs.readFileSync("./src/Data/" + file);
                this.datasets[id] = JSON.parse(fileContent.toString());
            }
        }
    }
    addDataset(id, content, kind) {
        const jszip = JSZip();
        const that = this;
        let dataset;
        switch (kind) {
            case IInsightFacade_1.InsightDatasetKind.Courses:
                dataset = new CourseSet_1.default();
                break;
            case IInsightFacade_1.InsightDatasetKind.Rooms:
                dataset = new RoomSet_1.default();
                break;
        }
        return new Promise(function (fulfill, reject) {
            if (id === null || id === undefined) {
                return reject({ code: 400, body: { error: "Invalid id" } });
            }
            if (that.datasets.hasOwnProperty(id)) {
                return reject({ code: 400, body: { error: "The dataset has been previously added" } });
            }
            jszip.loadAsync(content, { base64: true }).then(function (zip) {
                dataset.loadData(zip).then(function () {
                    that.datasets[id] = dataset;
                    fs.writeFile("./src/Data/" + id + ".json", JSON.stringify(dataset), (err) => {
                        if (err) {
                            throw err;
                        }
                        return fulfill({ code: 204, body: { result: "The dataset has been successfully added" } });
                    });
                }).catch(function (errorbody) {
                    return reject(errorbody);
                });
            }).catch(function (err) {
                return reject({ code: 400, body: { error: "jszip cannot be loaded" } });
            });
        });
    }
    removeDataset(id) {
        const that = this;
        return new Promise(function (fulfill, reject) {
            if (id === null || id === undefined) {
                return reject({ code: 404, body: { error: "Invalid id" } });
            }
            if (!that.datasets.hasOwnProperty(id)) {
                return reject({ code: 404, body: { result: "The dataset has not been previously added" } });
            }
            Object.keys(that.datasets).forEach(function (key) {
                if (key === id) {
                    delete that.datasets[key];
                    fs.unlink("./src/Data/" + id + ".json", (err) => {
                        if (err) {
                            throw err;
                        }
                        return fulfill({ code: 204, body: { result: "The dataset has been successfully deleted" } });
                    });
                }
            });
        });
    }
    performQuery(query) {
        const that = this;
        return new Promise(function (fulfill, reject) {
            let targetId;
            const queryValidator = new QueryValidator_1.default(that.datasets);
            if (!queryValidator.isQueryValid(query)) {
                return reject({ code: 400, body: { error: queryValidator.error } });
            }
            else {
                targetId = queryValidator.datasetID;
            }
            const responseBody = DataFilter_1.default.algorithm(query, that.datasets[targetId].content);
            return fulfill({ code: 200, body: { result: responseBody } });
        });
    }
    listDatasets() {
        const datasetsInsight = [];
        const that = this;
        return new Promise(function (fulfill, reject) {
            for (const key in that.datasets) {
                if (that.datasets.hasOwnProperty(key)) {
                    datasetsInsight.push({
                        id: key,
                        kind: that.datasets[key].kind,
                        numRows: that.datasets[key].content.length,
                    });
                }
            }
            return fulfill({ code: 200, body: { result: datasetsInsight } });
        });
    }
}
exports.default = InsightFacade;
//# sourceMappingURL=InsightFacade.js.map