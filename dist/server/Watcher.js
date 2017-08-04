"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require("fs");
const Path = require("path");
const Crypto = require("crypto");
const Error_1 = require("../util/Error");
const OUT = process.stdout;
const ERROR = process.stderr;
// fixme use an URLMaker to create URL from relative paths.
const HOSTNAME = "localhost";
const PORT = 3000;
function start(dirToWatch, dirToExpose, notifier) {
    try {
        OUT.write(`👓  watching ${dirToWatch}\n`);
        Fs.watch(dirToWatch, { recursive: true }, (eventType, fileName) => {
            if (eventType === 'rename') {
                exposeNewFile(`${dirToWatch}/${fileName}`, dirToExpose, notifier);
            }
        });
    }
    catch (ex) {
        ERROR.write(`unable to watch ${dirToWatch}!\n`);
        if (Error_1.isNoFileFound(ex)) {
            ERROR.write("-- directory does not exists!");
        }
        process.exit(-1);
    }
}
exports.start = start;
function exposeNewFile(path, dirToExpose, notifier) {
    const hash = hashFile(path);
    const destination = `${dirToExpose}/${hash}`;
    Fs.symlink(path, destination, () => {
        notifyNewExposedFile(destination, dirToExpose, notifier);
    });
}
function hashFile(path) {
    return Crypto.createHash("md5")
        .update(path)
        .digest("hex");
}
function notifyNewExposedFile(path, dirToExpose, notifier) {
    const relativePath = Path.relative(dirToExpose, path);
    notifier.notify({
        downloadURL: `http://${HOSTNAME}:${PORT}/${relativePath}`,
        deleteURL: `http://${HOSTNAME}:${PORT}/${relativePath}/clean`
    });
}
//# sourceMappingURL=Watcher.js.map