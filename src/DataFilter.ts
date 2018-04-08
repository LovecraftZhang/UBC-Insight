import Decimal from "decimal.js";

export default class DataFilter {
    public static algorithm(query: any, result: any[]): any[] {
        const where = query.WHERE;
        const operators: string[] = Object.keys(where);
        let responseBody: any[];
        if (Object.keys(where).length !== 0) {
            for (const filter of operators) {
                result = DataFilter.filterAlgorithm(filter, where, result, false);
            }
        }
        if (!query["TRANSFORMATIONS"]) {
            responseBody = DataFilter.optionProcessor(query.OPTIONS, result);
        } else {
            const responseGroups = DataFilter.applyGroup(query["TRANSFORMATIONS"], result);
            const afterTransformations = DataFilter.
            aggregateTransformation(query["TRANSFORMATIONS"], responseGroups);
            responseBody = DataFilter.optionProcessor(query.OPTIONS, afterTransformations);
        }
        return responseBody;
    }

    public static filterAlgorithm(filter: string, node: any, datasets: any[], neg: boolean): any[] {
        let result: any[];
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
    public static optionProcessor (node: any, result: any[]): any[] {
        let responseBody: any[] = [];
        const columns = node.COLUMNS;
        for (const section of result) {
            const item: {[id: string]: string | number} = {};
            for (const column of columns) {
                const stringFormat = /(\w)+_(\w)+/;
                if (stringFormat.test(column)) {
                    const field = column.split("_")[1];
                    item[column] = section[field];
                } else {
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
            } else {
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
    public static applyGroup(node: any, result: any[]): any[][] {
        // const responseBody: any[] = [];
        const groupKeys: any[] = node["GROUP"];
        let groupArray: any[][] = [result];
        // const applyKeys = node["APPLY"];
        // an intermediate[][], that each subsequent key builds on the previous
        for (const groupKey of groupKeys) {
            const pairArray: any[] = groupKey.split("_");
            const key: string = pairArray[1];
            const nextGroup = groupArray;
            groupArray = [];
            for (const group of nextGroup) {
                // i.e. the format is [210,310] if the group key is course_id
                // The indexOf() method returns the first index at which a given element can be found in the array/-1
                const newArray: any[] = group.map((item) => item[key])
                    .filter((value, index, self) => self.indexOf(value) === index);
                for (const val of newArray) {
                    groupArray.push(group.filter((item) => item[key] === val));
                }
            }
        }
        return groupArray;
    }
    public static aggregateTransformation(node: any, groupArray: any[][]): any[] {
        const result: any[] = [];
        for (const group of groupArray) {
            const transformed = this.applyTransformation(node, group);
            result.push(transformed);
        }
        return result;
    }
    public static applyTransformation(node: any, array: any[]): {} {
        const applyKeyObjects: any[] = node["APPLY"];
        const object: {[id: string]: number|string} = array[0];
        const result: {[id: string]: number|string} = {};
        if (applyKeyObjects.length === 0) {
            for (const item in result) {
                object[item] = result[item];
            }
        } else {
            for (const obj of applyKeyObjects) {
                for (const key in obj) { // "i.e "maxSeats"
                    const applyObject = obj[key];
                    for (const action in applyObject) {
                        const sortByPair = applyObject[action].split("_"); // action = Max, Min, Avg etc.
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
    public static calculation(array: any[],  keyType: string, sortBy: string): any {
        // for(const group in group array)
        let result: number;
        const valuesArray = array.map((item) => item[sortBy]);
        switch (keyType) {
            case "MAX":
                result = Math.max(...valuesArray);
                break;
            case "MIN":
                result = Math.min(...valuesArray);
                break;
            case "AVG":
                const decimalArray = valuesArray.map((item) => new Decimal(item));
                let total = new Decimal(0);
                for (const item of decimalArray) {
                    total = total.add(item);
                }
                const avg = total.toNumber() / decimalArray.length;
                result =  Number(avg.toFixed(2));
                break;
            case "COUNT": // it's a separate case, could be number array or string array
                const uniqueOccurrence: any[] = valuesArray
                    .filter((value, index, self) => self.indexOf(value) === index);
                result = uniqueOccurrence.length;
                break;
            case "SUM":
                const sumArray = valuesArray.map((item) => new Decimal(item));
                let sumTotal = new Decimal(0);
                for (const item of sumArray) {
                    sumTotal = sumTotal.add(item);
                }
                result = Number(sumTotal.toNumber().toFixed(2));
                break;
        }
        return result;
    }

     private static mComparison(filter: string, node: any, datasets: any[], neg: boolean): any[] {
        let field: string;
        let value: number;
        for (const key in node) {
            if (node.hasOwnProperty(key)) {
                const items = key.split("_");
                field = items[1];
                value = node[key];
            }
        }
        let result: any[];
        result = datasets.filter(function (e) {
            switch (filter) {
                case "GT":
                    if (neg) {return e[field] <= value; } else {return e[field] > value; }
                case "LT":
                    if (neg) {return e[field] >= value; } else {return e[field] < value; }
                case "EQ":
                    if (neg) {return e[field] !== value; } else {return e[field] === value; }
            }
        });
        return result;
    }

    private static logicComparison(filter: string, node: any, datasets: any[], neg: boolean)
    : any[] {
        let result: any[];
        let first: boolean = true;
        for (const object of node) {
            let part: any[];
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
                    if (neg) {result = DataFilter.union(result, part);
                    } else {result = DataFilter.intersection(result, part); }
                    break;
                case "OR":
                    if (neg) {result = DataFilter.intersection(result, part);
                    } else {result = DataFilter.union(result, part); }
                    break;
            }
        }
        return result;
    }

    private static intersection(array1: any[], array2: any[]): any[] {
        return array1.filter((n) => array2.includes(n));
    }

    private static union(array1: any[], array2: any[]): any[] {
        const combine = array1.concat(array2);
        return combine.filter(function (elem, index) { return combine.indexOf(elem) === index; });
    }

    private static sComparison(node: any, datasets: any[], neg: boolean): any[] {
        let field: string;
        let value: string;
        for (const key in node) {
            if (node.hasOwnProperty(key)) {
                const items = key.split("_");
                field = items[1];
                value = node[key];
            }
        }
        const pattern: RegExp = new RegExp("^" + value.replace(/[*]/g, ".*") + "$");
        return datasets.filter(function (elem) {
            if (neg) {return !pattern.test(elem[field].toString());
            } else {return pattern.test(elem[field].toString()); }
        });
    }

    private static negation(node: any, datasets: any[], neg: boolean): any[] {
        let result: any[];
        for (const subfilter in node) {
            if (node.hasOwnProperty(subfilter)) {
                result = DataFilter.filterAlgorithm(subfilter, node, datasets, !neg);
            }
        }
        return result;
    }

    private static compareWithPriority(node1: any, node2: any, priorityKeys: string[], priority: number): number {
        if (priority === priorityKeys.length) { return 0; }
        const first = priorityKeys[priority];
        if (node1[first] < node2[first]) {
            return -1;
        } else if (node1[first] > node2[first]) {
            return 1;
        } else {
            return this.compareWithPriority(node1, node2, priorityKeys, priority + 1);
        }
    }

    private static selectionSort(objects: any[], priorityKeys: string[], dir: string) {
        for (let i = 1; i < objects.length; i++ ) {
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
