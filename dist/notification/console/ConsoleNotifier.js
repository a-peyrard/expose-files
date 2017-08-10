"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class WritableStreamNewFileNotifier {
    constructor(out) {
        this.out = out;
    }
    static to(out) {
        return new WritableStreamNewFileNotifier(out);
    }
    notify(event) {
        this.out.write(`-- 📬  New file ${event.name} @ ${event.downloadURL}
  (removable using: ${event.deleteURL} )\n`);
        return Promise.resolve();
    }
}
exports.WritableStreamNewFileNotifier = WritableStreamNewFileNotifier;
class WritableStreamStopNotifier {
    constructor(out) {
        this.out = out;
    }
    static to(out) {
        return new WritableStreamStopNotifier(out);
    }
    notify(event) {
        this.out.write(`-- ☠️  kill server by following ${event.stopURL}\n`);
        return Promise.resolve();
    }
}
exports.WritableStreamStopNotifier = WritableStreamStopNotifier;
//# sourceMappingURL=ConsoleNotifier.js.map