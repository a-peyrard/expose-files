"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isNoFileFound(ex) {
    return !!(ex.message && ex.message.indexOf("ENOENT") !== -1);
}
exports.isNoFileFound = isNoFileFound;
//# sourceMappingURL=Error.js.map