#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Express = require("express");
const Fs = require("fs");
const Path = require("path");
const Crypto = require("crypto");
const DIR_TO_WATCH = "/tmp/private";
const DIR_TO_EXPOSE = "/tmp/public";
const HOSTNAME = "localhost";
const PORT = 3000;
const OUT = process.stdout;
const ERROR = process.stderr;
function exposeNewFile(path) {
    const hash = hashFile(path);
    const destination = `${DIR_TO_EXPOSE}/${hash}`;
    Fs.symlink(path, destination, () => {
        notifyNewExposedFile(destination);
    });
}
function hashFile(path) {
    return Crypto.createHash("md5")
        .update(path)
        .digest("hex");
}
function notifyNewExposedFile(path) {
    const relativePath = Path.relative(DIR_TO_EXPOSE, path);
    OUT.write(`-- 🍫  new file available: http://${HOSTNAME}:${PORT}/${relativePath}\n`);
}
/*
    ---- Start watcher to watch new file
 */
try {
    OUT.write(`👓  watching ${DIR_TO_WATCH}\n`);
    Fs.watch(DIR_TO_WATCH, { recursive: true }, (eventType, fileName) => {
        if (eventType === 'rename') {
            exposeNewFile(`${DIR_TO_WATCH}/${fileName}`);
        }
    });
}
catch (ex) {
    ERROR.write(`unable to watch ${DIR_TO_WATCH}!\n`);
    if (ex.message && ex.message.indexOf("ENOENT")) {
        ERROR.write("-- directory does not exists!");
    }
    process.exit(-1);
}
/*
    ---- Start express to expose files
 */
const start = new Date();
Express()
    .use(Express.static(DIR_TO_EXPOSE))
    .listen(PORT, () => {
    OUT.write(`💻  server started on http://localhost:${PORT} in ${new Date().getTime() - start.getTime()}ms\n`);
});
//# sourceMappingURL=index.js.map