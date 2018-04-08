"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("./controller/IInsightFacade");
const parse5 = require("parse5/lib");
const ASTUtil_1 = require("./ASTUtil");
const http = require("http");
class RoomSet {
    constructor() {
        this.kind = IInsightFacade_1.InsightDatasetKind.Rooms;
        this.content = [];
    }
    static getLatLon(address) {
        const encodedAddress = encodeURIComponent(address);
        const modifiedAddress = encodedAddress.replace(/[\s]/g, "%20");
        const htmlAddress = "http://skaha.cs.ubc.ca:11316/api/v1/team10/" + modifiedAddress;
        return new Promise(function (fulfill, reject) {
            http.get(htmlAddress, (res) => {
                let body = "";
                res.on("data", (chunk) => {
                    body += chunk;
                });
                res.on("end", () => {
                    return fulfill(JSON.parse(body));
                });
            }).on("error", (err) => {
                return reject(err.message);
            });
        });
    }
    loadData(zip) {
        const that = this;
        return new Promise(function (fulfill, reject) {
            zip.file("index.htm").async("text").then(function (parsedResult) {
                const document = parse5.parse(parsedResult, { treeAdapter: parse5.treeAdapters.default });
                const buildingTableAll = ASTUtil_1.default.findNode(document, "views-table cols-5 table", ASTUtil_1.default.findAttribute);
                const buildingTable = ASTUtil_1.default.findNode(buildingTableAll, "tbody", ASTUtil_1.default.findTagName);
                const allBuildingNodes = ASTUtil_1.default.findAllChildNodes(buildingTable, "tr", ASTUtil_1.default.findTagName);
                const buildingInfoList = [];
                for (const node of allBuildingNodes) {
                    const allTableData = ASTUtil_1.default.findAllChildNodes(node, "td", ASTUtil_1.default.findTagName);
                    const infoNode = ASTUtil_1.default.getNodeInfo(allTableData);
                    buildingInfoList.push(infoNode);
                }
                return buildingInfoList;
            }).then(function (buildingInfoList) {
                const buildingPromises = [];
                for (const buildingInfo of buildingInfoList) {
                    const buildingDataPromises = [];
                    buildingDataPromises.push(RoomSet.getLatLon(buildingInfo.address));
                    buildingDataPromises.push(zip.file(buildingInfo.linkToFile).async("text"));
                    const buildingPromise = new Promise(function (solve, fail) {
                        Promise.all(buildingDataPromises).then(function (data) {
                            return solve({
                                shortname: buildingInfo.shortname, fullname: buildingInfo.fullname,
                                address: buildingInfo.address, geoResponse: data[0], text: data[1]
                            });
                        });
                    });
                    buildingPromises.push(buildingPromise);
                }
                Promise.all(buildingPromises).then(function (buildings) {
                    for (const building of buildings) {
                        const document = parse5.parse(building.text);
                        const roomTableAll = ASTUtil_1.default.findNode(document, "views-table cols-5 table", ASTUtil_1.default.findAttribute);
                        if (roomTableAll === null) {
                            continue;
                        }
                        const roomTable = ASTUtil_1.default.findNode(roomTableAll, "tbody", ASTUtil_1.default.findTagName);
                        const allRoomNodes = ASTUtil_1.default.findAllChildNodes(roomTable, "tr", ASTUtil_1.default.findTagName);
                        for (const roomNodeInfo of allRoomNodes) {
                            const room = ASTUtil_1.default.parseOneRoom(roomNodeInfo, building.shortname, building.fullname, building.address, building.geoResponse);
                            that.content.push(room);
                        }
                    }
                    return fulfill();
                });
            }).catch(function (erro) {
                return reject({ code: 400, body: { error: erro } });
            });
        });
    }
}
exports.default = RoomSet;
//# sourceMappingURL=RoomSet.js.map