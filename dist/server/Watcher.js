"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require("fs");
const Error_1 = require("../util/Error");
const stream_1 = require("stream");
const Path = require("path");
class Watcher extends stream_1.Readable {
    constructor(dirToWatch, filter = /.*/) {
        super();
        this.dirToWatch = dirToWatch;
        this.filter = filter;
    }
    static watch(dirToWatch) {
        return new Watcher(dirToWatch);
    }
    static watchMatching(dirToWatch, filter) {
        return new Watcher(dirToWatch, filter);
    }
    _read(size) {
        try {
            Fs.watch(this.dirToWatch, { recursive: true }, (ignored, fileName) => {
                if (this.filter.test(fileName)) {
                    console.log(`${ignored} -- ${fileName} ${new Date().getTime()}`);
                    this.push(Path.resolve(this.dirToWatch, fileName));
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