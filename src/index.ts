#!/usr/bin/env node

import Watcher from "./server/Watcher";
import { WritableStreamNewFileNotifier } from "./notification/console/ConsoleNotifier";
import { StaticFileServer } from "./server/StaticFileServer";

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
StaticFileServer.serve(DIR_TO_EXPOSE)
                .onNewFile(WritableStreamNewFileNotifier.to(process.stdout))
                .useSSL({cert: CERT, key: KEY})
                .start(PORT)
                .then(server => {
                    OUT.write(`👓  watching ${DIR_TO_WATCH}\n`);
                    Watcher.watch(DIR_TO_WATCH)
                           .pipe(server);
                    OUT.write(
                        `💻  server started on http://localhost:${server.port} in ${elapsedTime()}ms\n`
                    );
                });

function elapsedTime() {
    return new Date().getTime() - start.getTime();
}
