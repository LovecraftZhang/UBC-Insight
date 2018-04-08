"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const restify = require("restify");
const Util_1 = require("../Util");
const InsightFacade_1 = require("../controller/InsightFacade");
class Server {
    constructor(port) {
        Util_1.default.info("Server::<init>( " + port + " )");
        this.port = port;
    }
    static getFacade() {
        if (!Server.UBCinsight) {
            this.UBCinsight = new InsightFacade_1.default();
        }
        return this.UBCinsight;
    }
    stop() {
        Util_1.default.info("Server::close()");
        const that = this;
        return new Promise(function (fulfill) {
            that.rest.close(function () {
                fulfill(true);
            });
        });
    }
    start() {
        const that = this;
        return new Promise(function (fulfill, reject) {
            try {
                Util_1.default.info("Server::start() - start");
                that.rest = restify.createServer({
                    name: "insightUBC",
                });
                that.rest.use(function crossOrigin(req, res, next) {
                    res.header("Access-Control-Allow-Origin", "*");
                    res.header("Access-Control-Allow-Headers", "X-Requested-With");
                    return next();
                });
                that.rest.use(restify.bodyParser({ mapFiles: true }));
                that.rest.put("/dataset/:id/:kind", Server.putDataset);
                that.rest.del("/dataset/:id", Server.removeDataset);
                that.rest.get("/datasets", Server.getDatasets);
                that.rest.post("/query", Server.postQuery);
                that.rest.get("/.*", Server.getStatic);
                that.rest.listen(that.port, function () {
                    Util_1.default.info("Server::start() - restify listening: " + that.rest.url);
                    fulfill(true);
                });
                that.rest.on("error", function (err) {
                    Util_1.default.info("Server::start() - restify ERROR: " + err);
                    reject(err);
                });
            }
            catch (err) {
                Util_1.default.error("Server::start() - ERROR: " + err);
                reject(err);
            }
        });
    }
    static putDataset(req, res, next) {
        const id = req.params.id;
        const kind = req.params.kind;
        const content = req.params.body.toString("base64");
        Server.getFacade().addDataset(id, content, kind).then(function (response) {
            res.send(response.code);
            return next();
        }).catch(function (err) {
            res.send(err.code);
            return next();
        });
    }
    static removeDataset(req, res, next) {
        const id = req.params.id;
        Server.getFacade().removeDataset(id).then(function (response) {
            res.send(response.code);
            return next();
        }).catch(function (err) {
            res.send(err.code);
            return next();
        });
    }
    static postQuery(req, res, next) {
        const query = req.body;
        Server.getFacade().performQuery(query).then(function (response) {
            res.send(response.code, response.body);
            return next();
        }).catch(function (err) {
            res.send(err.code, err.body);
            return next();
        });
    }
    static getDatasets(req, res, next) {
        Server.getFacade().listDatasets().then(function (response) {
            res.send(response.code, response.body);
            return next();
        }).catch(function (err) {
            res.send(err.code, err.body);
            return next();
        });
    }
    static getStatic(req, res, next) {
        const publicDir = "frontend/public/";
        Util_1.default.trace("RoutHandler::getStatic::" + req.url);
        let path = publicDir + "index.html";
        if (req.url !== "/") {
            path = publicDir + req.url.split("/").pop();
        }
        fs.readFile(path, function (err, file) {
            if (err) {
                res.send(500);
                Util_1.default.error(JSON.stringify(err));
                return next();
            }
            res.write(file);
            res.end();
            return next();
        });
    }
}
exports.default = Server;
//# sourceMappingURL=Server.js.map