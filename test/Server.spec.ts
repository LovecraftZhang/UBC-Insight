import Server from "../src/rest/Server";

import InsightFacade from "../src/controller/InsightFacade";
import chai = require("chai");
import Log from "../src/Util";
import chaiHttp = require("chai-http");
import { expect } from "chai";
import * as fs from "fs";

describe("Facade D3", function () {

    let facade: InsightFacade = null;
    let server: Server = null;

    chai.use(chaiHttp);

    before(function () {
        facade = new InsightFacade();
        server = new Server(4321);
        // TODO: start server here once and handle errors properly
        server.start().then(() => {
            return ;
        }).catch((err) => {
            return;
        });
    });

    after(function () {
        // TODO: stop server here once!
        server.stop();
    });

    beforeEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    afterEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    // TODO: read your courses and rooms datasets here once!
    let courses = fs.readFileSync("./test/data/courses.zip");
    let rooms = fs.readFileSync("./test/data/rooms.zip");

    // Hint on how to test PUT requests
    it("PUT test for courses dataset", function () {
        try {
            return chai.request("localhost:4321")
                .put("/dataset/courses/courses")
                .attach("body", courses, "courses.zip")
                .then(function (res) {
                    // some logging here please!
                    expect(res.status).to.be.equal(204);
                })
                .catch(function (err) {
                    // some logging here please!
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
        }
    });

    it("PUT wrong kind for rooms dataset", function () {
        try {
            return chai.request("localhost:4321")
                .put("/dataset/rooms/teams")
                .attach("body", rooms, "rooms.zip")
                .then(function (res) {
                    // some logging here please!
                    expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            // and some more logging here!
        }
    });
    // it("Delete courses dataset", function () {
    //     try {
    //         return chai.request("localhost:4321")
    //             .del("/dataset/courses")
    //             .then(function (res) {
    //                 // some logging here please!
    //                 expect(res.status).to.be.equal(204);
    //             })
    //             .catch(function (err) {
    //                 // some logging here please!
    //                 expect.fail();
    //             });
    //     } catch (err) {
    //         // and some more logging here!
    //     }
    // });
    it("Fail deleting non-existent dataset", function () {
        try {
            return chai.request("localhost:4321")
                .del("/dataset/abcde")
                .then(function (res) {
                    // some logging here please!
                    expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    expect(err.status).to.be.equal(404);
                });
        } catch (err) {
            // and some more logging here!
        }
    });

    it("Server has started", function () {
        return chai.request("http://localhost:4321").get("/echo/310").then(function (response) {
            expect(response.body.result).to.equal("310...310");
        }).catch(function (err) {
            expect.fail();
        });
    });
    it("Server has listed datasets", function () {
        return chai.request("http://localhost:4321")
            .get("/datasets")
            .then(function (res) {
                expect(res.status).to.be.equal(200);
                Log.trace(JSON.stringify(res.body));
            })
            .catch(function (err) {
            expect.fail();
        });
    });
    it("Server has performed query", function () {
        let query = JSON.parse(fs.readFileSync("./test/testQueries/testQuery.json", "utf8"));
        Log.trace(JSON.stringify(query));
        return chai.request("http://localhost:4321")
            .post("/query")
            .send(query)
            .then(function (res) {
                expect(res.status).to.be.equal(200);
            })
            .catch(function (err) {
                expect.fail();
            });
    });
});
