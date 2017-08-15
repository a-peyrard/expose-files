"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require("fs");
const util_1 = require("util");
function isFile(path) {
    return util_1.promisify(Fs.stat)(path)
        .then((stats) => stats.isFile())
        .catch(() => false); // non existing files are not files
}
exports.isFile = isFile;
//# sourceMappingURL=Files.js.map