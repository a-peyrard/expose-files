"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require("fs");
const Error_1 = require("../util/Error");
const stream_1 = require("stream");
class Watcher extends stream_1.Readable {
    constructor(dirToWatch) {
        super();
        this.dirToWatch = dirToWatch;
    }
    static watch(dirToWatch) {
        return new Watcher(dirToWatch);
    }
    _read(size) {
        try {
            Fs.watch(this.dirToWatch, { recursive: true }, (eventType, fileName) => {
                if (eventType === 'rename') {
                    this.push(`${this.dirToWatch}/${fileName}`);
                }
            });
        }
        catch (ex) {
            throw new Error(`unable to watch ${this.dirToWatch}! ${Error_1.isNoFileFound(ex) && "-- directory does not exists!"}`);
        }
    }
}
exports.default = Watcher;
//# sourceMappingURL=Watcher.js.map