"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("./controller/IInsightFacade");
var fieldType;
(function (fieldType) {
    fieldType["Number"] = "number";
    fieldType["String"] = "string";
    fieldType["Any"] = "any";
})(fieldType = exports.fieldType || (exports.fieldType = {}));
class QueryValidator {
    constructor(datasets) {
        this.keyFormate = /(\w)+_(\w)+/;
        this.inputstringFormat = /[^*]*/;
        this.applystringFormat = /^[^_]+$/;
        this.datasets = datasets;
    }
    isQueryValid(input) {
        const validFilters = ["WHERE", "OPTIONS", "TRANSFORMATIONS"];
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
    isWhereValid(input) {
        if (Object.keys(input).length === 0) {
            return true;
        }
        else {
            return this.isFilterValid(input);
        }
    }
    isFilterValid(input) {
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
    isLogicComparisonValid(input) {
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
    isMComparisonValid(input) {
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
    isSComparisonValid(input) {
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
            const validInput = new RegExp("^[*]?" + this.inputstringFormat.source + "[*]?$");
            if (!validInput.test(input[key])) {
                this.error = "wrong value format";
                return false;
            }
        }
        return true;
    }
    isNegationValid(input) {
        if (Object.keys(input).length !== 1) {
            this.error = "Wrong number of keys in the object";
            return false;
        }
        return this.isFilterValid(input);
    }
    isOptionsBodyValid(input) {
        const validFilters = ["COLUMNS", "ORDER", "FORM"];
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
        if (order) {
            return this.isColumnsValid(columns) && this.isOrderValid(order);
        }
        else {
            return this.isColumnsValid(columns);
        }
    }
    isColumnsValid(input) {
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
            }
            else if (!this.isKeyValid(key, fieldType.Any)) {
                this.error = "Wrong key or applystring structure";
                return false;
            }
            if (!this.availableOrderKeys) {
                this.availableOrderKeys = [];
            }
            this.availableOrderKeys.push(key);
        }
        return true;
    }
    isOrderValid(input) {
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
    isKeyValid(key, type) {
        if (!this.keyFormate.test(key)) {
            this.error = "Wrong key structure";
            return false;
        }
        const pairArray = key.split("_");
        const id = pairArray[0];
        const field = pairArray[1];
        if (!this.datasetID && this.datasets.hasOwnProperty(id)) {
            this.datasetID = id;
            this.updateField();
        }
        else if (this.datasetID !== id) {
            this.error = "Dataset nonexist or id is not consistent";
            return false;
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
    updateField() {
        switch (this.datasets[this.datasetID].kind) {
            case IInsightFacade_1.InsightDatasetKind.Courses:
                this.validAnyFields = ["dept", "id", "avg", "instructor", "title", "pass", "fail", "audit",
                    "uuid", "year"];
                this.validStringFields = ["dept", "id", "instructor", "title", "uuid"];
                this.validNumberFields = ["fail", "audit", "pass", "avg", "year"];
                break;
            case IInsightFacade_1.InsightDatasetKind.Rooms:
                this.validAnyFields = ["fullname", "shortname", "name", "address", "type", "furniture", "href",
                    "lat", "lon", "number", "seats"];
                this.validStringFields = ["fullname", "shortname", "number", "name", "address", "type",
                    "furniture", "href"];
                this.validNumberFields = ["lat", "lon", "seats"];
                break;
        }
    }
    isTransformationValid(input) {
        if (!input) {
            return true;
        }
        const validFilters = ["GROUP", "APPLY"];
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
    isGroupValid(input) {
        if (!Array.isArray(input)) {
            this.error = "the object should be an array";
            return false;
        }
        if (input.length < 1) {
            this.error = "No element in the array";
            return false;
        }
        if (!this.availableColumnsKeys) {
            this.availableColumnsKeys = [];
        }
        for (const key of input) {
            if (!this.isKeyValid(key, fieldType.Any)) {
                return false;
            }
            this.availableColumnsKeys.push(key);
        }
        return true;
    }
    isApplyValid(input) {
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
    isApplyKeyValid(input) {
        if (Object.keys(input).length !== 1) {
            this.error = "Wrong number of keys in the object";
            return false;
        }
        for (const apstring in input) {
            if (!this.applystringFormat.test(apstring)) {
                this.error = "Wrong applyKeyStructure";
                return false;
            }
            if (!this.applyKey) {
                this.applyKey = [];
            }
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
exports.default = QueryValidator;
//# sourceMappingURL=QueryValidator.js.map