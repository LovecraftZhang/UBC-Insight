
/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
CampusExplorer.buildQuery = function() {
    let query = {};

    let activeTab = document.getElementsByClassName("tab-panel active")[0];

    let datasetID = document.getElementsByClassName("tab-panel active")[0].getAttribute("data-type");

    let where = (function getwhere() {

        // let conditions = document.getElementsByClassName("control-group condition-type")[0];
        // let nodeALL = conditions.children[0].getElementsByTagName("input");
        // ['checkedbox', 'radio'].includes(element) -> whether type is checkbox radio button or not;

        // the button itself
        // input.checked returns whether the element is check or not
        let content = {};
        let NONE = false;
        let outer;
        let outerArray = [];
        let not = false;
        for (const cond of activeTab.getElementsByClassName("control-group condition-type")[0].children){
            if(cond.children[0].checked){
                outer = cond.children[0].value;
                break;   // when find the specific value, go out of the loop
            }
        }
        switch(outer){
            case "all":
                outer = "AND";
                break;
            case "any":
                outer = "OR";
                break;
            case "none":
                outer = "OR";
                NONE = true;
                break;
        }
        let condContainer = activeTab.getElementsByClassName("conditions-container")[0].children;
        // for each control group condition
        if (condContainer.length !== 0){
            for (const item of condContainer) {
                for (const option of item.getElementsByClassName("control not")[0].children) {
                    if (option.checked) {
                        not = true;
                        break;
                    }
                }
                let field;
                for (const obj of item.getElementsByClassName("control fields")[0].children[0].children) {
                    if (obj.selected) {
                        field = datasetID + "_" + obj.value;
                        break;
                    }
                }
                let operator;
                for (const op of item.getElementsByClassName("control operators")[0].children[0].children) {
                    if (op.selected) {
                        operator = op.value;
                        break;
                    }
                }
                let value = item.getElementsByClassName("control term")[0].children[0].value;
                if(!value){
                    value = null;
                }else if (operator !== "IS"){
                    let num = parseFloat(value);
                    if(!isNaN(num)){
                        value = num;
                    }
                }
                let fieldObj = {};
                let keyValue = {};
                keyValue[field] = value;
                fieldObj[operator] = keyValue;
                if (not) {
                    let NotObj = {};
                    NotObj["NOT"] = fieldObj;
                    outerArray.push(NotObj);
                } else {
                    outerArray.push(fieldObj);
                }
                not = false;
            }
        }
        if(outerArray.length === 1){
            content = outerArray[0];
        } else if (outerArray.length === 0) {
            content = {};
        } else {
                if(NONE){
                    let NONEobj = {};
                    NONEobj[outer] = outerArray;
                    content["NOT"]= NONEobj;
                }else{
                    content[outer] = outerArray;
                }
        }
        return content;
    })();

    let columns = (function getColumns() {
        let columns = [];
        for(const option of activeTab.getElementsByClassName("form-group columns")[0].children[1].children) {
            if(option.children[0].checked){
                let item;
                if (option.className === "control transformation"){
                    item = option.children[0].value;
                } else{
                    item = datasetID + "_" + option.children[0].value;
                }
                columns.push(item);
            }
        }
        if (columns.length === 0) return undefined;
        return columns;
    })();

    let orders = (function getOrders() {
        let orders = {};
        let dir = activeTab.getElementsByClassName("control descending")[0].children[0].checked;
        let keys = [];
        for(const option of activeTab.getElementsByClassName("control order fields")[0].children[0].children) {
            if(option.selected) keys.push(datasetID + "_" + option.value);
        }
        if (keys.length === 0) return undefined;
        if (dir) orders["dir"] = "DOWN";
        else orders["dir"] = "UP";
        orders["keys"] = keys;
        return orders;
    })();

    let options = {};
    if (columns) options["COLUMNS"] = columns;
    if(orders) options["ORDER"] = orders;

    let tranformations = (function getTransformations (){
        let transformation = {};
        let groups = [];
        for(const group of activeTab.getElementsByClassName("form-group groups")[0].children[1].children) {
            if (group.children[0].checked) groups.push(datasetID + "_" + group.children[0].value);
        }
        // if (groups.length === 0) return undefined;

        let apply = [];
        for (const elem of activeTab.getElementsByClassName("transformations-container")[0].children) {
            let applykey = elem.getElementsByClassName("control term")[0].children[0].value;
            let operator;
            for (const option of elem.getElementsByClassName("control operators")[0].children[0].children) {
                if (option.selected) {
                    operator = option.value; break;
                }
            }
            let fieldSelected = {};
            for (const field of elem.getElementsByClassName("control fields")[0].children[0].children) {
                if (field.selected) {
                    fieldSelected[operator] = datasetID + "_" + field.value; break;
                }
            }
            let inside = {};
            inside[applykey] = fieldSelected;
            apply.push(inside);
        }
        if (groups.length === 0 && apply.length === 0) return undefined;
        else return {"GROUP":groups, "APPLY":apply};
    })();

    query =  {"WHERE": where, "OPTIONS": options};
    if (tranformations) query["TRANSFORMATIONS"] = tranformations;

    return query;
};

