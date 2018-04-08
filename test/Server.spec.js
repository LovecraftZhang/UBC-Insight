"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Server_1 = require("../src/rest/Server");
const InsightFacade_1 = require("../src/controller/InsightFacade");
const chai = require("chai");
const Util_1 = require("../src/Util");
const chaiHttp = require("chai-http");
const chai_1 = require("chai");
const fs = require("fs");
describe("Facade D3", function () {
    let facade = null;
    let server = null;
    chai.use(chaiHttp);
    before(function () {
        facade = new InsightFacade_1.default();
        server = new Server_1.default(4321);
        server.start().then(() => {
            return;
        }).catch((err) => {
            return;
        });
    });
    after(function () {
        server.stop();
    });
    beforeEach(function () {
    });
    afterEach(function () {
    });
    let courses = fs.readFileSync("./test/data/courses.zip");
    let rooms = fs.readFileSync("./test/data/rooms.zip");
    it("PUT test for courses dataset", function () {
        try {
            return chai.request("localhost:4321")
                .put("/dataset/courses/courses")
                .attach("body", courses, "courses.zip")
                .then(function (res) {
                chai_1.expect(res.status).to.be.equal(204);
            })
                .catch(function (err) {
                chai_1.expect.fail();
            });
        }
        catch (err) {
        }
    });
    it("PUT wrong kind for rooms dataset", function () {
        try {
            return chai.request("localhost:4321")
                .put("/dataset/rooms/teams")
                .attach("body", rooms, "rooms.zip")
                .then(function (res) {
                chai_1.expect.fail();
            })
                .catch(function (err) {
                chai_1.expect(err.status).to.be.equal(400);
            });
        }
        catch (err) {
        }
    });
    it("Fail deleting non-existent dataset", function () {
        try {
            return chai.request("localhost:4321")
                .del("/dataset/abcde")
                .then(function (res) {
                chai_1.expect.fail();
            })
                .catch(function (err) {
                chai_1.expect(err.status).to.be.equal(404);
            });
        }
        catch (err) {
        }
    });
    it("Server has started", function () {
        return chai.request("http://localhost:4321").get("/echo/310").then(function (response) {
            chai_1.expect(response.body.result).to.equal("310...310");
        }).catch(function (err) {
            chai_1.expect.fail();
        });
    });
    it("Server has listed datasets", function () {
        return chai.request("http://localhost:4321")
            .get("/datasets")
            .then(function (res) {
            chai_1.expect(res.status).to.be.equal(200);
            Util_1.default.trace(JSON.stringify(res.body));
        })
            .catch(function (err) {
            chai_1.expect.fail();
        });
    });
    it("Server has performed query", function () {
        let query = JSON.parse(fs.readFileSync("./test/testQueries/testQuery.json", "utf8"));
        Util_1.default.trace(JSON.stringify(query));
        return chai.request("http://localhost:4321")
            .post("/query")
            .send(query)
            .then(function (res) {
            chai_1.expect(res.status).to.be.equal(200);
        })
            .catch(function (err) {
            chai_1.expect.fail();
        });
    });
});
//# sourceMappingURL=Server.spec.js.map