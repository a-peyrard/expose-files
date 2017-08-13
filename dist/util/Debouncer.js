"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
class Debouncer extends stream_1.Transform {
    constructor(delay) {
        super();
        this.delay = delay;
        this.debounced = new Map();
    }
    static seconds(delayInSec) {
        return new Debouncer(delayInSec * 1000);
    }
    static millis(delayInMs) {
        return new Debouncer(delayInMs);
    }
    _transform(chunkBytes, encoding, done) {
        const chunk = chunkBytes.toString();
        const oldTimeout = this.debounced.get(chunk);
        if (oldTimeout) {
            clearTimeout(oldTimeout);
        }
        this.debounced.set(chunk, setTimeout(() => {
            this.debounced.delete(chunk);
            this.push(chunk);
            this.mightFinalize();
        }, this.delay));
        done();
    }
    mightFinalize() {
        if (this.finalizer && this.debounced.size === 0) {
            this.finalizer();
        }
    }
    _final(done) {
        this.finalizer = done;
        this.mightFinalize();
    }
}
exports.default = Debouncer;
//# sourceMappingURL=Debouncer.js.map