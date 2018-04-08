import * as parse5 from "parse5/lib";
import * as http from "http";
import Log from "./Util";
import {InsightResponse} from "./controller/IInsightFacade";
import {IncomingMessage} from "http";

export default class ASTUtil {

    public static getNodeInfo(nodes: any[]): { [key: string]: string } {
        const nodeInfo: { [key: string]: string } = {};
        const buildingShortNameInfo = parse5.treeAdapters.default.getChildNodes(nodes[1]);
        // short name
        let buildingShortName = parse5.treeAdapters.default.getTextNodeContent(buildingShortNameInfo[0]);
        buildingShortName = buildingShortName.replace(/^\s\s*/, "")
            .replace(/\s\s*$/, "");
        nodeInfo["shortname"] = buildingShortName;
        // full name
        const buildingFullNameParent = parse5.treeAdapters.default.getChildNodes(nodes[2]);
        const buildingFullNameChild = parse5.treeAdapters.default.getChildNodes(buildingFullNameParent[1]);
        let buildingFullName = parse5.treeAdapters.default.getTextNodeContent(buildingFullNameChild[0]);
        buildingFullName = buildingFullName.replace(/^\s\s*/, "")
            .replace(/\s\s*$/, "");
        nodeInfo["fullname"] = buildingFullName;
        // address
        const buildingAddressInfo = parse5.treeAdapters.default.getChildNodes(nodes[3]);
        let buildingAddress = parse5.treeAdapters.default.getTextNodeContent(buildingAddressInfo[0]);
        buildingAddress = buildingAddress.replace(/^\s\s*/, "")
            .replace(/\s\s*$/, "");
        nodeInfo["address"] = buildingAddress;
        // link to access the room info file
        const roomLinkParent = parse5.treeAdapters.default.getChildNodes(nodes[4]);
        const roomLinkChild = parse5.treeAdapters.default.getAttrList(roomLinkParent[1]);
        const roomLink = roomLinkChild[0].value;
        nodeInfo["linkToFile"] = roomLink.replace(/^.\//, "");
        return nodeInfo;
    }

    public static parseOneRoom(roomNodeInfo: any, shortname: string, fullname: string, address: string,
                               geoResponse: any): {[key: string]: string | number} {
        const room: { [key: string]: string | number } = {};
        const RoomNode = ASTUtil.findAllChildNodes(roomNodeInfo, "td", ASTUtil.findTagName);
        // room short name, fullname, address
        room["shortname"] = shortname;
        room["fullname"] = fullname;
        room["address"] = address;
        room["lat"] = geoResponse.lat;
        room["lon"] = geoResponse.lon;
        // room number
        const nameInfoParent = parse5.treeAdapters.default.getChildNodes(RoomNode[0]);
        const nameInfoChild = parse5.treeAdapters.default.getChildNodes(nameInfoParent[1]);
        const roomNumber = parse5.treeAdapters.default.getTextNodeContent(nameInfoChild[0]);
        room["number"] = roomNumber;
        // room name
        room["name"] = shortname + "_" + roomNumber;
        // room capacity
        const capacityInfo = parse5.treeAdapters.default.getChildNodes(RoomNode[1]);
        const roomSeatsString = parse5.treeAdapters.default.getTextNodeContent(capacityInfo[0]);
        room["seats"] = Number(roomSeatsString.replace(/[^a-z0-9]/g, ""));
        // room furniture
        const furnitureInfo = parse5.treeAdapters.default.getChildNodes(RoomNode[2]);
        const roomFurniture = parse5.treeAdapters.default.getTextNodeContent(furnitureInfo[0]);
        room["furniture"] = roomFurniture.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
        // room type
        const typeInfo = parse5.treeAdapters.default.getChildNodes(RoomNode[3]);
        const roomType = parse5.treeAdapters.default.getTextNodeContent(typeInfo[0]);
        room["type"] = roomType.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
        // Remove Trailing white space
        const roomHrefInfo = parse5.treeAdapters.default.getChildNodes(RoomNode[4]);
        const roomHrefAttr = parse5.treeAdapters.default.getAttrList(roomHrefInfo[1]);
        room["href"] = roomHrefAttr[0].value;
        return room;
    }

    public static findNode(parent: any, value: string, func: (node: any, value: string) => boolean): any {
        if (func(parent, value)) {
            return parent;
        }
        const children = parse5.treeAdapters.default.getChildNodes(parent);
        if (children !== undefined) {
            for (const element of children) {
                const result = ASTUtil.findNode(element, value, func);
                if (result !== null) {
                    return result;
                }
            }
        }
        return null;
    }

    public static findTagName(node: any, value: string): boolean {
        const tag = parse5.treeAdapters.default.getTagName(node);
        if (tag === undefined) {
            return false;
        }
        if (tag === value) {
            return true;
        }
        return false;
    }

    public static findAttribute(node: any, value: string): boolean {
        const attrs = parse5.treeAdapters.default.getAttrList(node);
        if (attrs === undefined) {
            return false;
        }
        for (const attr of attrs) {
            if (attr.value === value) {
                return true;
            }
        }
        return false;
    }

    public static findAllChildNodes(parent: any, value: string, func: (node: any, value: string) => boolean): any[] {
        const result: any[] = [];
        const children = parse5.treeAdapters.default.getChildNodes(parent);
        if (children !== undefined) {
            for (const element of children) {
                if (func(element, value)) {
                    result.push(element);
                }
            }
        }
        return result;
    }
}
