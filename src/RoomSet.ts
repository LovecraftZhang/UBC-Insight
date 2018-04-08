import IDataSet from "./IDataSet";
import {InsightDatasetKind, InsightResponse} from "./controller/IInsightFacade";
import * as parse5 from "parse5/lib";
import * as JSZip from "jszip";
import ASTUtil from "./ASTUtil";
import Log from "./Util";
import * as http from "http";
import {error} from "util";

export interface IGeoResponse {
    lat?: number;
    lon?: number;
    error?: string;
}

export default class RoomSet implements IDataSet {

    private static getLatLon(address: string): Promise<IGeoResponse> {
            const encodedAddress = encodeURIComponent(address);
            const modifiedAddress = encodedAddress.replace(/[\s]/g, "%20");
            const htmlAddress = "http://skaha.cs.ubc.ca:11316/api/v1/team10/" + modifiedAddress;
            return new Promise<IGeoResponse> (function (fulfill, reject) {
                http.get(htmlAddress, (res) => {
                    let body: string = "";
                    res.on("data", (chunk: any) => {
                        body += chunk;
                    });
                    res.on("end", () => {
                        return fulfill(JSON.parse(body));
                    });
                }).on("error", (err) => {
                    return reject (err.message);
                });
        });
    }

    // public member
    public kind: InsightDatasetKind = InsightDatasetKind.Rooms;
    public content: Array<{ [key: string]: string | number }>;

    // rooms_fullname: string; Full building name (e.g., "Hugh Dempster Pavilion").
    // rooms_shortname: string; Short building name (e.g., "DMP").
    // rooms_number: string; The room number. Not always a number, so represented as a string.
    // rooms_name: string; The room id; should be rooms_shortname+"_"+rooms_number.
    // rooms_address: string; The building address. (e.g., "6245 Agronomy Road V6T 1Z4").
    // rooms_lat: number; The latitude of the building. Instructions for getting this field are below.
    // rooms_lon: number; The longitude of the building, as described under finding buildings' geolocation.
    // rooms_seats: number; The number of seats in the room.
    // rooms_type: string; The room type (e.g., "Small Group").
    // rooms_furniture: string; The room type (e.g., "Classroom-Movable Tables & Chairs").
    // rooms_href: string

    constructor() {
        this.content = [];
    }

    public loadData(zip: JSZip): Promise<InsightResponse> {
        const that = this;
        return new Promise<InsightResponse>(function (fulfill, reject) {
            zip.file("index.htm").async("text").then(function (parsedResult) {
                // parse index document as AST
                const document = parse5.parse(parsedResult, {treeAdapter: parse5.treeAdapters.default});
                // find table body
                const buildingTableAll = ASTUtil.findNode(document, "views-table cols-5 table", ASTUtil.findAttribute);
                const buildingTable = ASTUtil.findNode(buildingTableAll, "tbody", ASTUtil.findTagName);
                const allBuildingNodes = ASTUtil.findAllChildNodes(buildingTable, "tr", ASTUtil.findTagName);
                const buildingInfoList: Array<{ [key: string]: string }> = [];
                for (const node of allBuildingNodes) {
                    const allTableData = ASTUtil.findAllChildNodes(node, "td", ASTUtil.findTagName);
                    const infoNode = ASTUtil.getNodeInfo(allTableData);
                    buildingInfoList.push(infoNode);
                }
                return buildingInfoList;
            }).then(function (buildingInfoList) {
                const buildingPromises: Array<Promise<{ [key: string]: any }>> = [];
                for (const buildingInfo of buildingInfoList) {
                    const buildingDataPromises: Array<Promise<any>> = [];
                    buildingDataPromises.push(RoomSet.getLatLon(buildingInfo.address));
                    buildingDataPromises.push(zip.file(buildingInfo.linkToFile).async("text"));
                    const buildingPromise = new Promise (function (solve, fail) {
                        Promise.all(buildingDataPromises).then(function (data) {
                            return solve({
                                shortname: buildingInfo.shortname, fullname: buildingInfo.fullname,
                                address: buildingInfo.address, geoResponse: data[0], text: data[1]});
                        });
                    });
                    buildingPromises.push(buildingPromise);
                }
                Promise.all(buildingPromises).then(function (buildings) {
                    for (const building of buildings) {
                        const document = parse5.parse(building.text) as parse5.AST.Default.Document;
                        // find table body
                        const roomTableAll =
                            ASTUtil.findNode(document, "views-table cols-5 table", ASTUtil.findAttribute);
                        if (roomTableAll === null) {continue; }
                        const roomTable = ASTUtil.findNode(roomTableAll, "tbody", ASTUtil.findTagName);
                        const allRoomNodes = ASTUtil.findAllChildNodes(roomTable, "tr", ASTUtil.findTagName);
                        for (const roomNodeInfo of allRoomNodes) {
                            const room = ASTUtil.parseOneRoom(roomNodeInfo, building.shortname, building.fullname,
                                building.address, building.geoResponse);
                            that.content.push(room);
                        }
                    }
                    return fulfill();
                });
            }).catch(function (erro) {
                return reject({code: 400, body: {error: erro}});
            });
        });
    }
}
