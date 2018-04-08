/**
 * Created by rtholmes on 2016-06-19.
 */

import fs = require("fs");
import restify = require("restify");
import Log from "../Util";
import {InsightDatasetKind, InsightResponse} from "../controller/IInsightFacade";
import InsightFacade from "../controller/InsightFacade";

/**
 * This configures the REST endpoints for the server.
 */
export default class Server {

    private port: number;
    private rest: restify.Server;
    private static UBCinsight: InsightFacade;

    constructor(port: number) {
        Log.info("Server::<init>( " + port + " )");
        this.port = port;
    }

    public static getFacade() {
        if (!Server.UBCinsight) {
            this.UBCinsight = new InsightFacade();
        }
        return this.UBCinsight;
    }

    /**
     * Stops the server. Again returns a promise so we know when the connections have
     * actually been fully closed and the port has been released.
     *
     * @returns {Promise<boolean>}
     */
    public stop(): Promise<boolean> {
        Log.info("Server::close()");
        const that = this;
        return new Promise(function (fulfill) {
            that.rest.close(function () {
                fulfill(true);
            });
        });
    }

    /**
     * Starts the server. Returns a promise with a boolean value. Promises are used
     * here because starting the server takes some time and we want to know when it
     * is done (and if it worked).
     *
     * @returns {Promise<boolean>}
     */
    public start(): Promise<boolean> {
        const that = this;
        return new Promise(function (fulfill, reject) {
            try {
                Log.info("Server::start() - start");

                that.rest = restify.createServer({
                    name: "insightUBC",
                });

                that.rest.use(
                    function crossOrigin(req, res, next) {
                        res.header("Access-Control-Allow-Origin", "*");
                        res.header("Access-Control-Allow-Headers", "X-Requested-With");
                        return next();
                    });
                that.rest.use(restify.bodyParser( {mapFiles: true}));

                // NOTE: your endpoints should go here
                that.rest.put("/dataset/:id/:kind", Server.putDataset);
                that.rest.del("/dataset/:id", Server.removeDataset);
                that.rest.get("/datasets", Server.getDatasets);
                that.rest.post("/query", Server.postQuery);
                // that.rest.get("/echo/310", Server.echo);
                // This must be the last endpoint!
                that.rest.get("/.*", Server.getStatic);

                that.rest.listen(that.port, function () {
                    Log.info("Server::start() - restify listening: " + that.rest.url);
                    fulfill(true);
                });

                that.rest.on("error", function (err: string) {
                    // catches errors in restify start; unusual syntax due to internal
                    // node not using normal exceptions here
                    Log.info("Server::start() - restify ERROR: " + err);
                    reject(err);
                });

            } catch (err) {
                Log.error("Server::start() - ERROR: " + err);
                reject(err);
            }
        });
    }

    private static putDataset(req: restify.Request, res: restify.Response, next: restify.Next) {
        const id = req.params.id;
        const kind = req.params.kind;
        const content = req.params.body.toString("base64");
        Server.getFacade().addDataset(id, content, kind).then(function (response: InsightResponse) {
            res.send(response.code);
            return next();
        }).catch(function (err: InsightResponse) {
            res.send(err.code);
            return next();
        });
    }

    private static removeDataset(req: restify.Request, res: restify.Response, next: restify.Next) {
        const id = req.params.id;
        Server.getFacade().removeDataset(id).then(function (response: InsightResponse) {
            res.send(response.code);
            return next();
        }).catch(function (err: InsightResponse) {
            res.send(err.code);
            return next();
        });
    }

    private static postQuery(req: restify.Request, res: restify.Response, next: restify.Next) {
        const query = req.body;
        Server.getFacade().performQuery(query).then(function (response: InsightResponse) {
            res.send(response.code, response.body);
            return next();
        }).catch(function (err: InsightResponse) {
            res.send(err.code, err.body);
            return next();
        });
    }

    private static getDatasets(req: restify.Request, res: restify.Response, next: restify.Next) {
        Server.getFacade().listDatasets().then(function (response: InsightResponse) {
            res.send(response.code, response.body);
            return next();
        }).catch(function (err: InsightResponse) {
            res.send(err.code, err.body);
            return next();
        });
    }

    private static getStatic(req: restify.Request, res: restify.Response, next: restify.Next) {
        const publicDir = "frontend/public/";
        Log.trace("RoutHandler::getStatic::" + req.url);
        let path = publicDir + "index.html";
        if (req.url !== "/") {
            path = publicDir + req.url.split("/").pop();
        }
        fs.readFile(path, function (err: Error, file: Buffer) {
            if (err) {
                res.send(500);
                Log.error(JSON.stringify(err));
                return next();
            }
            res.write(file);
            res.end();
            return next();
        });
    }

}
