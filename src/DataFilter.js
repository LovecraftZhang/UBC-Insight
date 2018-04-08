"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const decimal_js_1 = require("decimal.js");
class DataFilter {
    static algorithm(query, result) {
        const where = query.WHERE;
        const operators = Object.keys(where);
        let responseBody;
        if (Object.keys(where).length !== 0) {
            for (const filter of operators) {
                result = DataFilter.filterAlgorithm(filter, where, result, false);
            }
        }
        if (!query["TRANSFORMATIONS"]) {
            responseBody = DataFilter.optionProcessor(query.OPTIONS, result);
        }
        else {
            const responseGroups = DataFilter.applyGroup(query["TRANSFORMATIONS"], result);
            const afterTransformations = DataFilter.
                aggregateTransformation(query["TRANSFORMATIONS"], responseGroups);
            responseBody = DataFilter.optionProcessor(query.OPTIONS, afterTransformations);
        }
        return responseBody;
    }
    static filterAlgorithm(filter, node, datasets, neg) {
        let result;
        switch (filter) {
            case "AND":
            case "OR":
                result = DataFilter.logicComparison(filter, node[filter], datasets, neg);
                break;
            case "LT":
            case "GT":
            case "EQ":
                result = DataFilter.mComparison(filter, node[filter], datasets, neg);
                break;
            case "IS":
                result = DataFilter.sComparison(node[filter], datasets, neg);
                break;
            case "NOT":
                result = DataFilter.negation(node[filter], datasets, neg);
                break;
        }
        return result;
    }
    static optionProcessor(node, result) {
        let responseBody = [];
        const columns = node.COLUMNS;
        for (const section of result) {
            const item = {};
            for (const column of columns) {
                const stringFormat = /(\w)+_(\w)+/;
                if (stringFormat.test(column)) {
                    const field = column.split("_")[1];
                    item[column] = section[field];
                }
                else {
                    const field = column;
                    item[column] = section[field];
                }
            }
            responseBody.push(item);
        }
        if (node.hasOwnProperty("ORDER")) {
            if (typeof node.ORDER === "string") {
                const orderField = node.ORDER;
                DataFilter.selectionSort(responseBody, [orderField], "UP");
            }
            else {
                const orderKeys = node["ORDER"]["keys"];
                const direction = node["ORDER"]["dir"];
                switch (direction) {
                    case "UP":
                        responseBody = DataFilter.selectionSort(responseBody, orderKeys, "UP");
                        break;
                    case "DOWN":
                        responseBody = DataFilter.selectionSort(responseBody, orderKeys, "DOWN");
                        break;
                }
            }
        }
        return responseBody;
    }
    static applyGroup(node, result) {
        const groupKeys = node["GROUP"];
        let groupArray = [result];
        for (const groupKey of groupKeys) {
            const pairArray = groupKey.split("_");
            const key = pairArray[1];
            const nextGroup = groupArray;
            groupArray = [];
            for (const group of nextGroup) {
                const newArray = group.map((item) => item[key])
                    .filter((value, index, self) => self.indexOf(value) === index);
                for (const val of newArray) {
                    groupArray.push(group.filter((item) => item[key] === val));
                }
            }
        }
        return groupArray;
    }
    static aggregateTransformation(node, groupArray) {
        const result = [];
        for (const group of groupArray) {
            const transformed = this.applyTransformation(node, group);
            result.push(transformed);
        }
        return result;
    }
    static applyTransformation(node, array) {
        const applyKeyObjects = node["APPLY"];
        const object = array[0];
        const result = {};
        if (applyKeyObjects.length === 0) {
            for (const item in result) {
                object[item] = result[item];
            }
        }
        else {
            for (const obj of applyKeyObjects) {
                for (const key in obj) {
                    const applyObject = obj[key];
                    for (const action in applyObject) {
                        const sortByPair = applyObject[action].split("_");
                        const sortBy = sortByPair[1];
                        result[key] = this.calculation(array, action, sortBy);
                    }
                }
            }
            for (const item in result) {
                object[item] = result[item];
            }
        }
        return object;
    }
    static calculation(array, keyType, sortBy) {
        let result;
        const valuesArray = array.map((item) => item[sortBy]);
        switch (keyType) {
            case "MAX":
                result = Math.max(...valuesArray);
                break;
            case "MIN":
                result = Math.min(...valuesArray);
                break;
            case "AVG":
                const decimalArray = valuesArray.map((item) => new decimal_js_1.default(item));
                let total = new decimal_js_1.default(0);
                for (const item of decimalArray) {
                    total = total.add(item);
                }
                const avg = total.toNumber() / decimalArray.length;
                result = Number(avg.toFixed(2));
                break;
            case "COUNT":
                const uniqueOccurrence = valuesArray
                    .filter((value, index, self) => self.indexOf(value) === index);
                result = uniqueOccurrence.length;
                break;
            case "SUM":
                const sumArray = valuesArray.map((item) => new decimal_js_1.default(item));
                let sumTotal = new decimal_js_1.default(0);
                for (const item of sumArray) {
                    sumTotal = sumTotal.add(item);
                }
                result = Number(sumTotal.toNumber().toFixed(2));
                break;
        }
        return result;
    }
    static mComparison(filter, node, datasets, neg) {
        let field;
        let value;
        for (const key in node) {
            if (node.hasOwnProperty(key)) {
                const items = key.split("_");
                field = items[1];
                value = node[key];
            }
        }
        let result;
        result = datasets.filter(function (e) {
            switch (filter) {
                case "GT":
                    if (neg) {
                        return e[field] <= value;
                    }
                    else {
                        return e[field] > value;
                    }
                case "LT":
                    if (neg) {
                        return e[field] >= value;
                    }
                    else {
                        return e[field] < value;
                    }
                case "EQ":
                    if (neg) {
                        return e[field] !== value;
                    }
                    else {
                        return e[field] === value;
                    }
            }
        });
        return result;
    }
    static logicComparison(filter, node, datasets, neg) {
        let result;
        let first = true;
        for (const object of node) {
            let part;
            for (const subfilter in object) {
                if (object.hasOwnProperty(subfilter)) {
                    part = DataFilter.filterAlgorithm(subfilter, object, datasets, neg);
                }
            }
            if (first) {
                result = part;
                first = false;
            }
            switch (filter) {
                case "AND":
                    if (neg) {
                        result = DataFilter.union(result, part);
                    }
                    else {
                        result = DataFilter.intersection(result, part);
                    }
                    break;
                case "OR":
                    if (neg) {
                        result = DataFilter.intersection(result, part);
                    }
                    else {
                        result = DataFilter.union(result, part);
                    }
                    break;
            }
        }
        return result;
    }
    static intersection(array1, array2) {
        return array1.filter((n) => array2.includes(n));
    }
    static union(array1, array2) {
        const combine = array1.concat(array2);
        return combine.filter(function (elem, index) { return combine.indexOf(elem) === index; });
    }
    static sComparison(node, datasets, neg) {
        let field;
        let value;
        for (const key in node) {
            if (node.hasOwnProperty(key)) {
                const items = key.split("_");
                field = items[1];
                value = node[key];
            }
        }
        const pattern = new RegExp("^" + value.replace(/[*]/g, ".*") + "$");
        return datasets.filter(function (elem) {
            if (neg) {
                return !pattern.test(elem[field].toString());
            }
            else {
                return pattern.test(elem[field].toString());
            }
        });
    }
    static negation(node, datasets, neg) {
        let result;
        for (const subfilter in node) {
            if (node.hasOwnProperty(subfilter)) {
                result = DataFilter.filterAlgorithm(subfilter, node, datasets, !neg);
            }
        }
        return result;
    }
    static compareWithPriority(node1, node2, priorityKeys, priority) {
        if (priority === priorityKeys.length) {
            return 0;
        }
        const first = priorityKeys[priority];
        if (node1[first] < node2[first]) {
            return -1;
        }
        else if (node1[first] > node2[first]) {
            return 1;
        }
        else {
            return this.compareWithPriority(node1, node2, priorityKeys, priority + 1);
        }
    }
    static selectionSort(objects, priorityKeys, dir) {
        for (let i = 1; i < objects.length; i++) {
            const temp = objects[i];
            let j = i;
            while (j > 0) {
                switch (dir) {
                    case "UP":
                        if (DataFilter.compareWithPriority(objects[j - 1], temp, priorityKeys, 0) > 0) {
                            objects[j] = objects[j - 1];
                            j--;
                            continue;
                        }
                        break;
                    case "DOWN":
                        if (DataFilter.compareWithPriority(objects[j - 1], temp, priorityKeys, 0) < 0) {
                            objects[j] = objects[j - 1];
                            j--;
                            continue;
                        }
                        break;
                }
                break;
            }
            objects[j] = temp;
        }
        return objects;
    }
}
exports.default = DataFilter;
//# sourceMappingURL=DataFilter.js.map