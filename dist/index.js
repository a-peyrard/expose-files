#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Watcher_1 = require("./server/Watcher");
const ConsoleNotifier_1 = require("./notification/console/ConsoleNotifier");
const StaticFileServer_1 = require("./server/StaticFileServer");
const DIR_TO_WATCH = "/tmp/private";
const DIR_TO_EXPOSE = "/tmp/public";
const PORT = 3000;
const CERT = "localhost.crt";
const KEY = "localhost.key";
const OUT = process.stdout;
const start = new Date();
/*
    ---- Start express to expose files, then start a watcher, and pipe it to server
 */
StaticFileServer_1.StaticFileServer.serve(DIR_TO_EXPOSE)
    .onNewFile(ConsoleNotifier_1.WritableStreamNewFileNotifier.to(process.stdout))
    .useSSL({ cert: CERT, key: KEY })
    .start(PORT)
    .then(server => {
    OUT.write(`👓  watching ${DIR_TO_WATCH}\n`);
    Watcher_1.default.watch(DIR_TO_WATCH)
        .pipe(server);
    OUT.write(`💻  server started on http://localhost:${server.port} in ${elapsedTime()}ms\n`);
});
function elapsedTime() {
    return new Date().getTime() - start.getTime();
}
//# sourceMappingURL=index.js.map