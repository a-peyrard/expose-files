#!/usr/bin/env node

import * as Watcher from "./server/Watcher";
import { WritableStreamNewFileNotifier } from "./notification/console/ConsoleNotifier";
import StaticFileServer from "./server/StaticFileServer";

const DIR_TO_WATCH = "/tmp/private";
const DIR_TO_EXPOSE = "/tmp/public";
const PORT = 3000;

/*
    ---- Start watcher to watch new file
 */
Watcher.start(
    DIR_TO_WATCH,
    DIR_TO_EXPOSE,
    WritableStreamNewFileNotifier.to(process.stdout)
);

/*
    ---- Start express to expose files
 */
StaticFileServer.serve(DIR_TO_EXPOSE)
                .start(PORT);
