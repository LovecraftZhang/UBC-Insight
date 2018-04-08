import * as fs from "fs";
import Log from "../src/Util";
import IDataSet from "./IDataSet";
import {InsightDatasetKind} from "./controller/IInsightFacade";

export enum fieldType {
    Number = "number",
    String = "string",
    Any = "any",
}

export default class QueryValidator {
    public datasetID: string;
    public error: string;
    protected datasets: { [id: string]: IDataSet };
    private keyFormate = /(\w)+_(\w)+/;
    private inputstringFormat = /[^*]*/;
    private applystringFormat = /^[^_]+$/;
    private validNumberFields: any[];
    private validStringFields: any[];
    private validAnyFields: any[];
    private availableOrderKeys: string[];
    private availableColumnsKeys: string[];
    private applyKey: string[];

    constructor(datasets: { [id: string]: IDataSet }) {
        this.datasets = datasets;
    }

    public isQueryValid(input: any): boolean {
        const validFilters: string[] = ["WHERE", "OPTIONS", "TRANSFORMATIONS"];
        for (const filter in input) {
            if (!validFilters.includes(filter)) {
                this.error = "invalid filter out " + filter + "   " + JSON.stringify(input);
                return false;
            }
        }
        const where = input["WHERE"];
        if (!where) {
            this.error = "No where object exists";
            return false;
        }
        const options = input["OPTIONS"];
        if (!options) {
            this.error = "No options exists";
            return false;
        }
        const transformations = input["TRANSFORMATIONS"];
        return this.isWhereValid(where) && this.isTransformationValid(transformations)
            && this.isOptionsBodyValid(options);
    }

    private isWhereValid(input: any): boolean {
        if (Object.keys(input).length === 0) {return true;
        } else {return this.isFilterValid(input); }
    }

    private isFilterValid(input: any): boolean {
        if (Object.keys(input).length !== 1) {
            this.error = "wrong number of filter";
            return false;
        }
        for (const filter in input) {
            switch (filter) {
                case "AND":
                case "OR":
                    return this.isLogicComparisonValid(input[filter]);
                case "GT":
                case "LT":
                case "EQ":
                    return this.isMComparisonValid(input[filter]);
                case "IS":
                    return this.isSComparisonValid(input[filter]);
                case "NOT":
                    return this.isNegationValid(input[filter]);
                default:
                    this.error = "invalid filter in where";
                    return false;
            }
        }
    }

    private isLogicComparisonValid(input: any): boolean {
        if (!Array.isArray(input)) {
            this.error = "the object should be an array";
            return false;
        }
        if (input.length < 1) {
            this.error = "No element in the array";
            return false;
        }
        let result = true;
        for (const item of input) {
            result = result && this.isFilterValid(item);
        }
        return result;
    }

    private isMComparisonValid(input: any): boolean {
        if (Object.keys(input).length !== 1) {
            this.error = "Wrong number of keys in the object";
            return false;
        }
        for (const key in input) {
            if (!this.isKeyValid(key, fieldType.Number)) {
                return false;
            }
            if (typeof input[key] !== "number") {
                this.error = "Wrong type of value";
                return false;
            }
        }
        return true;
    }

    private isSComparisonValid(input: any): boolean {
        if (Object.keys(input).length !== 1) {
            this.error = "Wrong number of keys in the object";
            return false;
        }
        for (const key in input) {
            if (!this.isKeyValid(key, fieldType.String)) {
                this.error = "Wrong key structure";
                return false;
            }
            if (typeof input[key] !== "string") {
                this.error = "Wrong type of value";
                return false;
            }
            const validInput: RegExp = new RegExp("^[*]?" + this.inputstringFormat.source + "[*]?$");
            if (!validInput.test(input[key])) {
                this.error = "wrong value format";
                return false;
            }
        }
        return true;
    }

    private isNegationValid(input: any): boolean {
        if (Object.keys(input).length !== 1) {
            this.error = "Wrong number of keys in the object";
            return false;
        }
        return this.isFilterValid(input);
    }

    private isOptionsBodyValid(input: any): boolean {
        // let isOptionsValid: boolean = true;
        const validFilters: string[] = ["COLUMNS", "ORDER", "FORM"];
        for (const filter in input) {
            if (!validFilters.includes(filter)) {
                this.error = "invalid filter in options";
                return false;
            }
        }
        const columns = input["COLUMNS"];
        if (!columns) {
            this.error = "No columns exits";
            return false;
        }
        const order = input["ORDER"];
        if (order) {return this.isColumnsValid(columns) && this.isOrderValid(order);
        } else { return this.isColumnsValid(columns); }
    }

    private isColumnsValid(input: any): boolean {
        if (!Array.isArray(input)) {
            this.error = "the object should be an array";
            return false;
        }
        if (input.length < 1) {
            this.error = "No element in the array";
            return false;
        }
        for (const key of input) {
            if (this.availableColumnsKeys) {
                if (!this.availableColumnsKeys.includes(key)) {
                    this.error = "keys in Column must be in Groups and Apply";
                    return false;
                }
            } else if (!this.isKeyValid(key, fieldType.Any)) {
                this.error = "Wrong key or applystring structure";
                return false;
            }
            if (!this.availableOrderKeys) {this.availableOrderKeys = []; }
            this.availableOrderKeys.push(key);
        }
        return true;
    }

    private isOrderValid(input: any): boolean {
        const validDirection = ["UP", "DOWN"];
        const orderKey = new RegExp(this.keyFormate.source + "|" + this.applystringFormat.source);
        switch (typeof input) {
            case "object":
                const direction = input["dir"];
                const keys = input["keys"];
                if (!direction) {
                    this.error = "direction doesn't exist in order";
                    return false;
                }
                if (!keys) {
                    this.error = "direction doesn't exist in order";
                    return false;
                }
                if (!validDirection.includes(direction)) {
                    this.error = "invalid direction";
                    return false;
                }
                if (!Array.isArray(keys)) {
                    this.error = "the keys should be an array";
                    return false;
                }
                for (const key of keys) {
                    if (!this.availableOrderKeys.includes(key)) {
                        this.error = "the key must be in the COLUMNS array";
                        return false;
                    }
                }
                return true;
            case "string":
                if (!orderKey.test(input)) {
                    this.error = "Wrong key structure";
                    return false;
                }
                if (!this.availableOrderKeys.includes(input)) {
                    this.error = "the key must be in the COLUMNS array";
                    return false;
                }
                return true;
            default:
                this.error = "Wrong type of key";
                return false;
        }
    }

    private isKeyValid(key: any, type: fieldType): boolean {
        if (!this.keyFormate.test(key)) {
            this.error = "Wrong key structure";
            return false;
        }
        const pairArray: string[] = key.split("_");
        const id = pairArray[0];
        const field = pairArray[1];
        if (!this.datasetID && this.datasets.hasOwnProperty(id)) {
            this.datasetID = id;
            this.updateField();
        } else if (this.datasetID !== id) {
            this.error = "Dataset nonexist or id is not consistent";
            return false; // dataset should match with the first id being set
        }
        switch (type) {
            case fieldType.Number:
                if (!this.validNumberFields.includes(field)) {
                    this.error = "Invalid field";
                    return false;
                }
                break;
            case fieldType.String:
                if (!this.validStringFields.includes(field)) {
                    this.error = "Invalid field";
                    return false;
                }
                break;
            case fieldType.Any:
                if (!this.validAnyFields.includes(field)) {
                    this.error = "Invalid field";
                    return false;
                }
        }
        return true;
    }

    private updateField() {
        switch (this.datasets[this.datasetID].kind) {
            case InsightDatasetKind.Courses:
                this.validAnyFields = ["dept", "id", "avg", "instructor", "title", "pass", "fail", "audit",
                    "uuid", "year"];
                this.validStringFields = ["dept", "id", "instructor", "title", "uuid"];
                this.validNumberFields = ["fail", "audit", "pass", "avg", "year"];
                break;
            case InsightDatasetKind.Rooms:
                this.validAnyFields = ["fullname", "shortname", "name", "address", "type", "furniture", "href",
                    "lat", "lon", "number", "seats"];
                this.validStringFields = ["fullname", "shortname", "number", "name", "address", "type",
                    "furniture", "href"];
                this.validNumberFields = ["lat", "lon", "seats"];
                break;
        }
    }

    private isTransformationValid (input: any): boolean {
        if (!input) {return true; }
        const validFilters: string[] = ["GROUP", "APPLY"];
        for (const filter in input) {
            if (!validFilters.includes(filter)) {
                this.error = "invalid filter in transformation";
                return false;
            }
        }
        const group = input["GROUP"];
        if (!group) {
            this.error = "No group exists";
            return false;
        }
        const apply = input["APPLY"];
        if (!group) {
            this.error = "No group exists";
            return false;
        }
        return this.isGroupValid(group) && this.isApplyValid(apply);
    }

    private isGroupValid(input: any): boolean {
        if (!Array.isArray(input)) {
            this.error = "the object should be an array";
            return false;
        }
        if (input.length < 1) {
            this.error = "No element in the array";
            return false;
        }
        if (!this.availableColumnsKeys) { this.availableColumnsKeys = []; }
        for (const key of input) {
            if (!this.isKeyValid(key, fieldType.Any)) {
                return false;
            }
            this.availableColumnsKeys.push(key);
        }
        return true;
    }

    private isApplyValid(input: any): boolean {
        if (!Array.isArray(input)) {
            this.error = "the object should be an array";
            return false;
        }
        for (const key of input) {
            if (!this.isApplyKeyValid(key)) {
                return false;
            }
        }
        return true;
    }

    private isApplyKeyValid(input: any): boolean {
        if (Object.keys(input).length !== 1) {
            this.error = "Wrong number of keys in the object";
            return false;
        }
        for (const apstring in input) {
            if (!this.applystringFormat.test(apstring)) {
                this.error = "Wrong applyKeyStructure";
                return false;
            }
            if (!this.applyKey) {this.applyKey = []; }
            if (this.applyKey.includes(apstring)) {
                this.error = "The applykey in APPLY should be unique";
                return false;
            }
            this.applyKey.push(apstring);
            this.availableColumnsKeys.push(apstring);
            const keyPair = input[apstring];
            if (Object.keys(keyPair).length !== 1) {
                this.error = "Wrong number of keys in the keyPair";
                return false;
            }
            for (const key in keyPair) {
                switch (key) {
                    case "MAX":
                    case "MIN":
                    case "AVG":
                    case "SUM":
                        return this.isKeyValid(keyPair[key], fieldType.Number);
                    case "COUNT":
                        return this.isKeyValid(keyPair[key], fieldType.Any);
                    default:
                        this.error = "Invalid key in applystring inside applykey";
                        return false;
                }
            }
        }
    }
}
