#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Watcher_1 = require("./server/Watcher");
const ConsoleNotifier_1 = require("./notification/console/ConsoleNotifier");
const StaticFileServer_1 = require("./server/StaticFileServer");
const program = require("Commander");
const Colors = require("colors");
const OUT = process.stdout;
program
    .version("0.0.1")
    .description("watch some directory and expose new files via web server")
    .usage("<path-to-watch> [options]")
    .option("--expose-out <path-to-expose>", "The path where the exposed file will be linked.", "/tmp")
    .option("--port <port>", "The port for the web server.", 3000)
    .option("--cert <cert-file-path>", "The path to the cert file (to use SSL, both cert and key must be defined)")
    .option("--key <key-file-path>", "The path to the cert file (to use SSL, both cert and key must be defined)")
    .option("--bindTo <hostname>", "The hostname where to bind the server (will be used for URLs generation)")
    .action((pathToWatch, options) => {
    const start = new Date();
    /*
        ---- Start express to expose files, then start a watcher, and pipe it to server
     */
    let staticFileServer = StaticFileServer_1.StaticFileServer.serve(options.exposeOut)
        .onNewFile(ConsoleNotifier_1.WritableStreamNewFileNotifier.to(process.stdout));
    const sslOptions = extractSSLOptions(options.cert, options.key);
    if (sslOptions) {
        staticFileServer = staticFileServer.useSSL(sslOptions);
    }
    if (options.bindTo) {
        staticFileServer = staticFileServer.bindTo(options.bindTo);
    }
    staticFileServer
        .start(options.port)
        .then(server => {
        OUT.write(`👓  watching ${pathToWatch}\n`);
        Watcher_1.default.watch(pathToWatch)
            .pipe(server);
        OUT.write(`💻  server started on ${server.address} in ${elapsedTimeSince(start)}ms\n`);
    });
})
    .parse(process.argv);
function extractSSLOptions(cert, key) {
    if (cert && key) {
        return { cert, key };
    }
    if (cert && !key || key && !cert) {
        OUT.write("[WARNING] to use ssl, both cert and key must be specified!\n");
    }
    return;
}
if (!process.argv.slice(2).length) {
    program.outputHelp(make_red);
}
function make_red(txt) {
    return Colors.red(txt); //display the help text in red on the console
}
function elapsedTimeSince(start) {
    return new Date().getTime() - start.getTime();
}
//# sourceMappingURL=index.js.map