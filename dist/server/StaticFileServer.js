"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require("fs");
const Express = require("express");
const Error_1 = require("../util/Error");
const Notification_1 = require("../notification/Notification");
const Crypto = require("crypto");
const stream_1 = require("stream");
const OUT = process.stdout;
const HOSTNAME = "localhost";
var StaticFileServer;
(function (StaticFileServer) {
    StaticFileServer.serve = (dirToExpose) => {
        return new ReadyToRun({ dirToExpose });
    };
    class ReadyToRun {
        constructor(config) {
            this.config = config;
        }
        onNewFile(notifier) {
            return new ReadyToRun(Object.assign({}, this.config, { notifier }));
        }
        start(port = 3000) {
            const { dirToExpose } = this.config;
            return new Promise((resolve, ignored) => {
                Express()
                    .get("/:hash/clean", this.handleClean.bind(this))
                    .use(Express.static(dirToExpose))
                    .listen(port, () => {
                    resolve(new Running(port, this.config));
                });
            });
        }
        handleClean(req, res) {
            const { dirToExpose } = this.config;
            const file = req.params.hash;
            if (file) {
                try {
                    OUT.write(`-- 🌪  cleaning file ${file}\n`);
                    const filePath = `${dirToExpose}/${file}`;
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
    StaticFileServer.ReadyToRun = ReadyToRun;
    class Running extends stream_1.Writable {
        constructor(port, config) {
            super();
            this.port = port;
            this.config = config;
        }
        _write(chunk, encoding, done) {
            this.exposeFile(chunk);
            done();
        }
        exposeFile(file) {
            const { dirToExpose } = this.config;
            const hash = hashFile(file);
            const destination = `${dirToExpose}/${hash}`;
            Fs.symlink(file, destination, () => this.notifyNewExposedFile(hash));
        }
        notifyNewExposedFile(relativePath) {
            const { notifier = Notification_1.default.noopNotifier() } = this.config;
            return notifier.notify({
                downloadURL: `http://${HOSTNAME}:${this.port}/${relativePath}`,
                deleteURL: `http://${HOSTNAME}:${this.port}/${relativePath}/clean`
            });
        }
    }
    StaticFileServer.Running = Running;
})(StaticFileServer = exports.StaticFileServer || (exports.StaticFileServer = {}));
function hashFile(path) {
    return Crypto.createHash("md5")
        .update(path)
        .digest("hex");
}
function error404(res) {
    res.status(404);
    res.send("4️⃣0️⃣4️⃣&nbsp;&nbsp;&nbsp;😱");
}
function error500(ex, res) {
    res.status(500);
    res.send(`unknown error: ${ex}`);
}
//# sourceMappingURL=StaticFileServer.js.map