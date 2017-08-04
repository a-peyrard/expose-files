"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require("fs");
const Express = require("express");
const Error_1 = require("../util/Error");
const OUT = process.stdout;
class StaticFileServer {
    constructor(dirToExpose) {
        this.dirToExpose = dirToExpose;
    }
    static serve(dirToExpose) {
        return new StaticFileServer(dirToExpose);
    }
    start(port) {
        const start = new Date();
        Express()
            .get("/:hash/clean", this.handleClean.bind(this))
            .use(Express.static(this.dirToExpose))
            .listen(port, () => {
            OUT.write(`💻  server started on http://localhost:${port} in ${new Date().getTime() - start.getTime()}ms\n`);
        });
    }
    handleClean(req, res) {
        const file = req.params.hash;
        if (file) {
            try {
                OUT.write(`-- 🌪  cleaning file ${file}\n`);
                const filePath = `${this.dirToExpose}/${file}`;
                Fs.unlinkSync(filePath);
                res.send(`🌪&nbsp;&nbsp;file ${file} successfully deleted!`);
            }
            catch (ex) {
                if (Error_1.isNoFileFound(ex)) {
                    error404(res);
                }
                else {
                    error500(ex, res);
                }
            }
            return;
        }
        // can't reach this!
        res.status(418);
        res.send("☕&nbsp;&nbsp;Do you want some covfefe?");
    }
}
exports.default = StaticFileServer;
function error404(res) {
    res.status(404);
    res.send("4️⃣0️⃣4️⃣&nbsp;&nbsp;&nbsp;😱");
}
function error500(ex, res) {
    res.status(500);
    res.send(`unknown error: ${ex}`);
}
//# sourceMappingURL=StaticFileServer.js.map