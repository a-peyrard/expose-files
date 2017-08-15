"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
class StreamPromiseFilter extends stream_1.Transform {
    constructor(filter) {
        super();
        this.filter = filter;
        this.pending = 0;
    }
    static filter(filter) {
        return new StreamPromiseFilter(filter);
    }
    _transform(chunk, encoding, done) {
        this.pending++;
        this.filter(chunk)
            .then(res => {
            if (res) {
                this.push(chunk);
            }
            if (this.finalizer && --this.pending === 0) {
                this.finalizer();
            }
        });
        done();
    }
    _final(done) {
        this.finalizer = done;
    }
}
exports.default = StreamPromiseFilter;
//# sourceMappingURL=StreamPromiseFilter.js.map