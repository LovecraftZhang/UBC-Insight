"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("./controller/IInsightFacade");
class CourseSet {
    constructor() {
        this.kind = IInsightFacade_1.InsightDatasetKind.Courses;
        this.content = [];
    }
    loadData(zip) {
        const that = this;
        const promises = [];
        return new Promise(function (fulfill, reject) {
            zip.folder("courses").forEach(function (relativePath, file) {
                promises.push(file.async("text"));
            });
            Promise.all(promises).then(function (parsedResult) {
                for (const course of parsedResult) {
                    const courseObj = JSON.parse(course).result;
                    if (courseObj instanceof Array && courseObj.length > 0) {
                        for (const sectionObj of courseObj) {
                            const section = {};
                            section["dept"] = sectionObj.Subject;
                            section["id"] = sectionObj.Course;
                            section["avg"] = sectionObj.Avg;
                            section["instructor"] = sectionObj.Professor;
                            section["title"] = sectionObj.Title;
                            section["pass"] = sectionObj.Pass;
                            section["fail"] = sectionObj.Fail;
                            section["audit"] = sectionObj.Audit;
                            section["uuid"] = sectionObj.id.toString();
                            if (sectionObj.Section === "overall") {
                                section["year"] = 1900;
                            }
                            else {
                                section["year"] = parseInt(sectionObj.Year, 10);
                            }
                            that.content.push(section);
                        }
                    }
                }
                if (that.content.length === 0) {
                    return reject({ code: 400, body: { error: "no course sectoin" } });
                }
                else {
                    return fulfill();
                }
            }).catch(function (err) {
                return reject({ code: 400, body: { error: "invalid file" } });
            });
        });
    }
}
exports.default = CourseSet;
//# sourceMappingURL=CourseSet.js.map