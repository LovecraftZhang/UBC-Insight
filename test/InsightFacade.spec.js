"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const IInsightFacade_1 = require("../src/controller/IInsightFacade");
const InsightFacade_1 = require("../src/controller/InsightFacade");
const Util_1 = require("../src/Util");
const TestUtil_1 = require("./TestUtil");
describe("InsightFacade Add/Remove Dataset", function () {
    const datasetsToLoad = {
        courses: "./test/data/courses.zip",
        courses2: "./test/data/courses2.zip",
        courses_wrongCourse: "./test/data/courses_wrongcourse.zip",
        courses_wrongFolder: "./test/data/courses_wrongfolder.zip",
        emptyfile: "./test/data/emptyfile.zip",
        invalidfile: "./test/data/invalidfile.zip",
        noCourses: "./test/data/nocourse.zip",
        rooms: "./test/data/rooms.zip",
        rooms2: "./test/data/rooms.zip",
        twoFolders: "./test/data/twoFolders.zip",
        zerocoursesection: "./test/data/zerocoursesection.zip",
    };
    let insightFacade;
    let datasets;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            Util_1.default.test(`Before: ${this.test.parent.title}`);
            try {
                const loadDatasetPromises = [];
                for (const [id, path] of Object.entries(datasetsToLoad)) {
                    loadDatasetPromises.push(TestUtil_1.default.readFileAsync(path));
                }
                const loadedDatasets = (yield Promise.all(loadDatasetPromises)).map((buf, i) => {
                    return { [Object.keys(datasetsToLoad)[i]]: buf.toString("base64") };
                });
                datasets = Object.assign({}, ...loadedDatasets);
                chai_1.expect(Object.keys(datasets)).to.have.length.greaterThan(0);
            }
            catch (err) {
                chai_1.expect.fail("", "", `Failed to read one or more datasets. ${JSON.stringify(err)}`);
            }
            try {
                insightFacade = new InsightFacade_1.default();
            }
            catch (err) {
                Util_1.default.error(err);
            }
            finally {
                chai_1.expect(insightFacade).to.be.instanceOf(InsightFacade_1.default);
            }
        });
    });
    beforeEach(function () {
        Util_1.default.test(`BeforeTest: ${this.currentTest.title}`);
    });
    after(function () {
        Util_1.default.test(`After: ${this.test.parent.title}`);
    });
    afterEach(function () {
        Util_1.default.test(`AfterTest: ${this.currentTest.title}`);
    });
    it("Should add a valid dataset", () => __awaiter(this, void 0, void 0, function* () {
        const id = "courses";
        const expectedCode = 204;
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response.code).to.equal(expectedCode);
        }
    }));
    it("Should not add a valid same dataset", () => __awaiter(this, void 0, void 0, function* () {
        const id = "courses";
        const expectedCode = 400;
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response.code).to.equal(expectedCode);
        }
    }));
    it("Should add a valid dataset2", () => __awaiter(this, void 0, void 0, function* () {
        const id = "courses2";
        const expectedCode = 204;
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response.code).to.equal(expectedCode);
        }
    }));
    it("Should add an idataset with correct folder name", () => __awaiter(this, void 0, void 0, function* () {
        const id = "twoFolders";
        const expectedCode = 204;
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response.code).to.equal(expectedCode);
        }
    }));
    it("Should not add an invalid dataset with wrong id", () => __awaiter(this, void 0, void 0, function* () {
        const id = "coursesWrong";
        const expectedCode = 400;
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response.code).to.equal(expectedCode);
            chai_1.expect(response.body).to.have.property("error");
        }
    }));
    it("Should not add an invalid dataset with null id", () => __awaiter(this, void 0, void 0, function* () {
        const id = null;
        const expectedCode = 400;
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response.code).to.equal(expectedCode);
            chai_1.expect(response.body).to.have.property("error");
        }
    }));
    it("Should not add an invalid dataset with undefined id", () => __awaiter(this, void 0, void 0, function* () {
        const id = undefined;
        const expectedCode = 400;
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response.code).to.equal(expectedCode);
            chai_1.expect(response.body).to.have.property("error");
        }
    }));
    it("Should not add an invalid dataset with wrong folder name", () => __awaiter(this, void 0, void 0, function* () {
        const id = "courses_wrongFolder";
        const expectedCode = 400;
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response.code).to.equal(expectedCode);
            chai_1.expect(response.body).to.have.property("error");
        }
    }));
    it("Should not add an invalid dataset with wrong course format", () => __awaiter(this, void 0, void 0, function* () {
        const id = "courses_wrongCourse";
        const expectedCode = 400;
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response.code).to.equal(expectedCode);
            chai_1.expect(response.body).to.have.property("error");
        }
    }));
    it("Should not add an invalid dataset with no courses folder", () => __awaiter(this, void 0, void 0, function* () {
        const id = "noCourses";
        const expectedCode = 400;
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response.code).to.equal(expectedCode);
            chai_1.expect(response.body).to.have.property("error");
        }
    }));
    it("Should not add an invalid dataset with empty file", () => __awaiter(this, void 0, void 0, function* () {
        const id = "emptyfile";
        const expectedCode = 400;
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response.code).to.equal(expectedCode);
            chai_1.expect(response.body).to.have.property("error");
        }
    }));
    it("Should not add an invalid dataset with invalid file", () => __awaiter(this, void 0, void 0, function* () {
        const id = "invalidfile";
        const expectedCode = 400;
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response.code).to.equal(expectedCode);
            chai_1.expect(response.body).to.have.property("error");
        }
    }));
    it("Should not add an invalid dataset with zero section", () => __awaiter(this, void 0, void 0, function* () {
        const id = "zerocoursesection";
        const expectedCode = 400;
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response.code).to.equal(expectedCode);
            chai_1.expect(response.body).to.have.property("error");
        }
    }));
    it("Should not add an invalid dataset with numerical id", () => __awaiter(this, void 0, void 0, function* () {
        const id = "12345";
        const expectedCode = 400;
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response.code).to.equal(expectedCode);
            chai_1.expect(response.body).to.have.property("error");
        }
    }));
    it("Should not add an corrupted dataset", () => __awaiter(this, void 0, void 0, function* () {
        const id = "corrupted";
        const expectedCode = 400;
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response.code).to.equal(expectedCode);
            chai_1.expect(response.body).to.have.property("error");
        }
    }));
    it("Should remove the courses2 dataset", () => __awaiter(this, void 0, void 0, function* () {
        const id = "courses2";
        const expectedCode = 204;
        let response;
        try {
            response = yield insightFacade.removeDataset(id);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response.code).to.equal(expectedCode);
        }
    }));
    it("Should not remove the courses dataset which is previously removed", () => __awaiter(this, void 0, void 0, function* () {
        const id = "courses2";
        const expectedCode = 404;
        let response;
        try {
            response = yield insightFacade.removeDataset(id);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response.code).to.equal(expectedCode);
        }
    }));
    it("Should not remove the courses dataset which is not exist ", () => __awaiter(this, void 0, void 0, function* () {
        const id = "coursesWrong";
        const expectedCode = 404;
        let response;
        try {
            response = yield insightFacade.removeDataset(id);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response.code).to.equal(expectedCode);
        }
    }));
    it("Should not remove the courses dataset with null id", () => __awaiter(this, void 0, void 0, function* () {
        const id = null;
        const expectedCode = 404;
        let response;
        try {
            response = yield insightFacade.removeDataset(id);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response.code).to.equal(expectedCode);
        }
    }));
    it("Should not remove the courses dataset with undefined id", () => __awaiter(this, void 0, void 0, function* () {
        const id = undefined;
        const expectedCode = 404;
        let response;
        try {
            response = yield insightFacade.removeDataset(id);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response.code).to.equal(expectedCode);
        }
    }));
    it("Should add a valid room dataset rooms", () => __awaiter(this, void 0, void 0, function* () {
        const id = "rooms";
        const expectedCode = 204;
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Rooms);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response.code).to.equal(expectedCode);
        }
    }));
    it("Should add a valid room dataset rooms2", () => __awaiter(this, void 0, void 0, function* () {
        const id = "rooms2";
        const expectedCode = 204;
        let response;
        try {
            response = yield insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Rooms);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response.code).to.equal(expectedCode);
        }
    }));
    it("Should remove a valid room dataset rooms", () => __awaiter(this, void 0, void 0, function* () {
        const id = "rooms2";
        const expectedCode = 204;
        let response;
        try {
            response = yield insightFacade.removeDataset(id);
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response.code).to.equal(expectedCode);
        }
    }));
    it("Test ListDatasets", () => __awaiter(this, void 0, void 0, function* () {
        const expectedCode = 200;
        let response;
        try {
            response = yield insightFacade.listDatasets();
        }
        catch (err) {
            response = err;
        }
        finally {
            chai_1.expect(response.code).to.equal(expectedCode);
        }
    }));
});
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery = {
        courses: "./test/data/courses.zip",
        rooms: "./test/data/rooms.zip",
    };
    let insightFacade;
    let testQueries = [];
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            Util_1.default.test(`Before: ${this.test.parent.title}`);
            try {
                testQueries = yield TestUtil_1.default.readTestQueries();
                chai_1.expect(testQueries).to.have.length.greaterThan(0);
            }
            catch (err) {
                chai_1.expect.fail("", "", `Failed to read one or more test queries. ${JSON.stringify(err)}`);
            }
            try {
                insightFacade = new InsightFacade_1.default();
            }
            catch (err) {
                Util_1.default.error(err);
            }
            finally {
                chai_1.expect(insightFacade).to.be.instanceOf(InsightFacade_1.default);
            }
            try {
                const loadDatasetPromises = [];
                for (const [id, path] of Object.entries(datasetsToQuery)) {
                    loadDatasetPromises.push(TestUtil_1.default.readFileAsync(path));
                }
                const loadedDatasets = (yield Promise.all(loadDatasetPromises)).map((buf, i) => {
                    return { [Object.keys(datasetsToQuery)[i]]: buf.toString("base64") };
                });
                chai_1.expect(loadedDatasets).to.have.length.greaterThan(0);
                const responsePromises = [];
                const datasets = Object.assign({}, ...loadedDatasets);
                for (const [id, content] of Object.entries(datasets)) {
                    responsePromises.push(insightFacade.addDataset(id, content, IInsightFacade_1.InsightDatasetKind.Courses));
                }
                try {
                    const responses = yield Promise.all(responsePromises);
                    responses.forEach((response) => chai_1.expect(response.code).to.equal(204));
                }
                catch (err) {
                    Util_1.default.warn(`Ignoring addDataset errors. For D1, you should allow errors to fail the Before All hook.`);
                }
            }
            catch (err) {
                chai_1.expect.fail("", "", `Failed to read one or more datasets. ${JSON.stringify(err)}`);
            }
        });
    });
    beforeEach(function () {
        Util_1.default.test(`BeforeTest: ${this.currentTest.title}`);
    });
    after(function () {
        Util_1.default.test(`After: ${this.test.parent.title}`);
    });
    afterEach(function () {
        Util_1.default.test(`AfterTest: ${this.currentTest.title}`);
    });
    it("Should run test queries", () => {
        describe("Dynamic InsightFacade PerformQuery tests", () => {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, () => __awaiter(this, void 0, void 0, function* () {
                    let response;
                    try {
                        response = yield insightFacade.performQuery(test.query);
                    }
                    catch (err) {
                        response = err;
                    }
                    finally {
                        chai_1.expect(response.code).to.equal(test.response.code);
                        if (test.response.code >= 400) {
                            chai_1.expect(response.body).to.have.property("error");
                        }
                        else {
                            chai_1.expect(response.body).to.have.property("result");
                            const expectedResult = test.response.body.result;
                            const actualResult = response.body.result;
                            chai_1.expect(actualResult).to.deep.equal(expectedResult);
                        }
                    }
                }));
            }
        });
    });
});
//# sourceMappingURL=InsightFacade.spec.js.map