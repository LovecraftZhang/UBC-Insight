"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parse5 = require("parse5/lib");
class ASTUtil {
    static getNodeInfo(nodes) {
        const nodeInfo = {};
        const buildingShortNameInfo = parse5.treeAdapters.default.getChildNodes(nodes[1]);
        let buildingShortName = parse5.treeAdapters.default.getTextNodeContent(buildingShortNameInfo[0]);
        buildingShortName = buildingShortName.replace(/^\s\s*/, "")
            .replace(/\s\s*$/, "");
        nodeInfo["shortname"] = buildingShortName;
        const buildingFullNameParent = parse5.treeAdapters.default.getChildNodes(nodes[2]);
        const buildingFullNameChild = parse5.treeAdapters.default.getChildNodes(buildingFullNameParent[1]);
        let buildingFullName = parse5.treeAdapters.default.getTextNodeContent(buildingFullNameChild[0]);
        buildingFullName = buildingFullName.replace(/^\s\s*/, "")
            .replace(/\s\s*$/, "");
        nodeInfo["fullname"] = buildingFullName;
        const buildingAddressInfo = parse5.treeAdapters.default.getChildNodes(nodes[3]);
        let buildingAddress = parse5.treeAdapters.default.getTextNodeContent(buildingAddressInfo[0]);
        buildingAddress = buildingAddress.replace(/^\s\s*/, "")
            .replace(/\s\s*$/, "");
        nodeInfo["address"] = buildingAddress;
        const roomLinkParent = parse5.treeAdapters.default.getChildNodes(nodes[4]);
        const roomLinkChild = parse5.treeAdapters.default.getAttrList(roomLinkParent[1]);
        const roomLink = roomLinkChild[0].value;
        nodeInfo["linkToFile"] = roomLink.replace(/^.\//, "");
        return nodeInfo;
    }
    static parseOneRoom(roomNodeInfo, shortname, fullname, address, geoResponse) {
        const room = {};
        const RoomNode = ASTUtil.findAllChildNodes(roomNodeInfo, "td", ASTUtil.findTagName);
        room["shortname"] = shortname;
        room["fullname"] = fullname;
        room["address"] = address;
        room["lat"] = geoResponse.lat;
        room["lon"] = geoResponse.lon;
        const nameInfoParent = parse5.treeAdapters.default.getChildNodes(RoomNode[0]);
        const nameInfoChild = parse5.treeAdapters.default.getChildNodes(nameInfoParent[1]);
        const roomNumber = parse5.treeAdapters.default.getTextNodeContent(nameInfoChild[0]);
        room["number"] = roomNumber;
        room["name"] = shortname + "_" + roomNumber;
        const capacityInfo = parse5.treeAdapters.default.getChildNodes(RoomNode[1]);
        const roomSeatsString = parse5.treeAdapters.default.getTextNodeContent(capacityInfo[0]);
        room["seats"] = Number(roomSeatsString.replace(/[^a-z0-9]/g, ""));
        const furnitureInfo = parse5.treeAdapters.default.getChildNodes(RoomNode[2]);
        const roomFurniture = parse5.treeAdapters.default.getTextNodeContent(furnitureInfo[0]);
        room["furniture"] = roomFurniture.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
        const typeInfo = parse5.treeAdapters.default.getChildNodes(RoomNode[3]);
        const roomType = parse5.treeAdapters.default.getTextNodeContent(typeInfo[0]);
        room["type"] = roomType.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
        const roomHrefInfo = parse5.treeAdapters.default.getChildNodes(RoomNode[4]);
        const roomHrefAttr = parse5.treeAdapters.default.getAttrList(roomHrefInfo[1]);
        room["href"] = roomHrefAttr[0].value;
        return room;
    }
    static findNode(parent, value, func) {
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
    static findTagName(node, value) {
        const tag = parse5.treeAdapters.default.getTagName(node);
        if (tag === undefined) {
            return false;
        }
        if (tag === value) {
            return true;
        }
        return false;
    }
    static findAttribute(node, value) {
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
    static findAllChildNodes(parent, value, func) {
        const result = [];
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
exports.default = ASTUtil;
//# sourceMappingURL=ASTUtil.js.map