"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require("fs");
const Express = require("express");
const Error_1 = require("../util/Error");
const Notification_1 = require("../notification/Notification");
const Crypto = require("crypto");
const stream_1 = require("stream");
const https = require("https");
const http = require("http");
const ipify = require("ipify");
const Path = require("path");
const util_1 = require("util");
const OUT = process.stdout;
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
        useSSL(ssl) {
            return new ReadyToRun(Object.assign({}, this.config, { ssl }));
        }
        bindTo(bindingName) {
            return new ReadyToRun(Object.assign({}, this.config, { bindingName }));
        }
        start(port = 3000) {
            const { dirToExpose } = this.config;
            return new Promise((resolve, ignored) => {
                const app = Express()
                    .get("/:hash/clean", this.handleClean.bind(this))
                    .use(Express.static(dirToExpose));
                let server;
                let ssl = false;
                if (this.config.ssl) {
                    const cert = Fs.readFileSync(this.config.ssl.cert);
                    const key = Fs.readFileSync(this.config.ssl.key);
                    server = https.createServer({ key, cert }, app);
                    ssl = true;
                }
                else {
                    OUT.write("[WARNING] no key nor cert specified, so fallback to HTTP, " +
                        "exchanges will not be encrypted!\n");
                    server = http.createServer(app);
                }
                server.listen(port, () => {
                    this.getPublicIp()
                        .then((ip) => {
                        resolve(new Running(ip, port, this.config, ssl));
                    });
                });
            });
        }
        getPublicIp() {
            let promise;
            if (this.config.bindingName) {
                promise = Promise.resolve(this.config.bindingName);
            }
            else {
                promise = ipify()
                    .catch(() => {
                    OUT.write("[WARNING] Unable to get public ip address, will use `127.0.0.1` in notification.");
                    return "127.0.0.1";
                });
            }
            return promise;
        }
        handleClean(req, res) {
            const { dirToExpose } = this.config;
            const dirName = req.params.hash;
            if (dirName) {
                const dirPath = Path.resolve(dirToExpose, dirName);
                OUT.write(`-- 🌪  cleaning directory ${dirName}\n`);
                deleteDirectory(dirPath)
                    .then(() => res.send(`🌪&nbsp;&nbsp;dir ${dirPath} successfully deleted!`))
                    .catch(error => {
                    console.error(error);
                    if (Error_1.isNoFileFound(error)) {
                        error404(res);
                    }
                    else {
                        error500(error, res);
                    }
                });
            }
        }
    }
    StaticFileServer.ReadyToRun = ReadyToRun;
    class Running extends stream_1.Writable {
        constructor(ip, port, config, ssl) {
            super();
            this.ip = ip;
            this.port = port;
            this.config = config;
            this.ssl = ssl;
            this.address = `${ssl ? "https" : "http"}://${ip}:${port}`;
        }
        _write(chunk, encoding, done) {
            this.exposeFile(chunk.toString());
            done();
        }
        exposeFile(file) {
            const { dirToExpose } = this.config;
            const hash = hashFile(file);
            const fileName = Path.basename(file);
            const destinationDir = Path.resolve(dirToExpose, hash);
            const linkPath = Path.resolve(destinationDir, fileName);
            util_1.promisify(Fs.mkdir)(destinationDir)
                .then(() => util_1.promisify(Fs.symlink)(file, linkPath))
                .then(() => this.notifyNewExposedFile(fileName, Path.relative(dirToExpose, linkPath), hash))
                .catch(error => {
                console.error("unable to manage " + file, error);
            });
        }
        notifyNewExposedFile(name, relativePath, hash) {
            const { notifier = Notification_1.default.noopNotifier() } = this.config;
            const downloadURL = `${this.address}/${relativePath}`;
            const deleteURL = `${this.address}/${hash}/clean`;
            return notifier.notify({
                name,
                downloadURL,
                deleteURL
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
/*
    Note: this is not generic at all, this will just remove the directory, and the link inside it

    It does not work recursively.
 */
function deleteDirectory(dir) {
    const unlink = util_1.promisify(Fs.unlink);
    return util_1.promisify(Fs.readdir)(dir)
        .then(files => Promise.all(files.map(f => unlink(Path.resolve(dir, f)))))
        .then(() => util_1.promisify(Fs.rmdir)(dir));
}
//# sourceMappingURL=StaticFileServer.js.map