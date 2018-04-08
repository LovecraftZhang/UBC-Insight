import {InsightDatasetKind, InsightResponse} from "./controller/IInsightFacade";
import * as JSZip from "jszip";
import IDataSet from "./IDataSet";

export default class CourseSet implements IDataSet {
    public kind: InsightDatasetKind = InsightDatasetKind.Courses;
    public content: Array<{[key: string]: string | number}>;
    constructor() {
        this.content = [];
    }
    public loadData (zip: JSZip): Promise<InsightResponse> {
        const that = this;
        const promises: Array<Promise<string>> = [];
        return new Promise<InsightResponse>(function (fulfill, reject) {
            zip.folder("courses").forEach(function (relativePath, file) {
                promises.push(file.async("text"));
            });
            Promise.all(promises).then(function (parsedResult) {
                for (const course of parsedResult) {
                    const courseObj = JSON.parse(course).result;
                    if (courseObj instanceof Array && courseObj.length > 0) {
                        for (const sectionObj of courseObj) {
                            const section: {[key: string]: string | number} = {};
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
                            } else {
                                section["year"] = parseInt(sectionObj.Year, 10);
                            }
                            that.content.push(section);
                        }
                    }
                }
                if (that.content.length === 0) {
                    return reject({code: 400, body: {error: "no course sectoin"}});
                } else {
                    return fulfill();
                }
            }).catch(function (err) {
                return reject({code: 400, body: {error: "invalid file"}});
            });
        });
    }
}
