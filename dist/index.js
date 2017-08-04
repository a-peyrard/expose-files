#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Watcher = require("./server/Watcher");
const ConsoleNotifier_1 = require("./notification/console/ConsoleNotifier");
const StaticFileServer_1 = require("./server/StaticFileServer");
const DIR_TO_WATCH = "/tmp/private";
const DIR_TO_EXPOSE = "/tmp/public";
const PORT = 3000;
/*
    ---- Start watcher to watch new file
 */
Watcher.start(DIR_TO_WATCH, DIR_TO_EXPOSE, ConsoleNotifier_1.WritableStreamNewFileNotifier.to(process.stdout));
/*
    ---- Start express to expose files
 */
StaticFileServer_1.default.serve(DIR_TO_EXPOSE)
    .start(PORT);
//# sourceMappingURL=index.js.map