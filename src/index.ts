#!/usr/bin/env node

import Watcher from "./server/Watcher";
import { WritableStreamNewFileNotifier } from "./notification/console/ConsoleNotifier";
import { StaticFileServer } from "./server/StaticFileServer";
import * as program from "commander";
import * as Colors from "colors";
import Mailer from "./notification/mail/Mailer";
import Notification from "./notification/Notification";
import { MailNewFileNotifier } from "./notification/mail/MailNotifier";
import * as Fs from "fs";
import { isNoFileFound } from "./util/Error";

const OUT = process.stdout;

program
    .version("0.0.1")
    .description("watch some directory and expose new files via web server")
    .usage("[path-to-watch] [options]")
    .option(
        "--expose-out <path-to-expose>",
        "The path where the exposed file will be linked.",
        "/tmp"
    )
    .option(
        "--port <port>",
        "The port for the web server.",
    )
    .option(
        "--cert <cert-file-path>",
        "The path to the cert file (to use SSL, both cert and key must be defined)"
    )
    .option(
        "--key <key-file-path>",
        "The path to the cert file (to use SSL, both cert and key must be defined)"
    )
    .option(
        "--bindTo <hostname>",
        "The hostname where to bind the server (will be used for URLs generation)"
    )
    .option(
        "--smtp <username:password>",
        "The smtp server username and password (only Gmail smtp is supported)"
    )
    .option(
        "--email <email>",
        "The email to notify when a new file is exposed, this option required a smtp configuration"
    )
    .option(
        "--config <config-file-path>",
        "The config file to read options from."
    )
    .option(
        "--filter <regex>",
        "A regex to filter files."
    )
    .parse(process.argv);

/*
    --- main
 */

const start = new Date();

const computedOptions = extractOptions(program);
const pathToWatch = program.pathToWatch || computedOptions.watch;

if (!pathToWatch) {
    program.outputHelp(make_red as any);
    process.exit(-1);
}

/*
    ---- Start express to expose files, then start a watcher, and pipe it to server
 */
let staticFileServer = StaticFileServer.serve(computedOptions.exposeOut);

const sslOptions = extractSSLOptions(computedOptions.cert, computedOptions.key);
if (sslOptions) {
    staticFileServer = staticFileServer.useSSL(sslOptions);
}
if (computedOptions.bindTo) {
    staticFileServer = staticFileServer.bindTo(computedOptions.bindTo);
}

let notifier: Notification.Notifier<Notification.NewFileEvent> =
    WritableStreamNewFileNotifier.to(process.stdout);
const mailOptions = extractMailOptions(computedOptions.smtp, computedOptions.email);
if (mailOptions) {
    const [to, mailConfig] = mailOptions;
    notifier = Notification.compose(
        notifier,
        MailNewFileNotifier.to(
            to,
            Mailer.withConfig(mailConfig)
        )
    )
}
staticFileServer = staticFileServer.onNewFile(notifier);

staticFileServer
    .start(computedOptions.port || 3000)
    .then(server => {
        OUT.write(`👓  watching ${pathToWatch}\n`);
        watcher(pathToWatch, computedOptions.filter).pipe(server);
        OUT.write(
            `💻  server started on ${server.address} in ${elapsedTimeSince(start)}ms\n`
        );
    });

function watcher(pathToWatch: string, filter?: any) {
    if (filter) {
        return Watcher.watchMatching(
            pathToWatch,
            new RegExp(filter)
        );
    }
    return Watcher.watch(pathToWatch);
}

function extractOptions(clOptions: any): any {
    if (clOptions.config) {
        try {
            return {
                ...Fs.readFileSync(clOptions.config)
                     .toString()
                     .split("\n")
                     .reduce(
                         (acc: any, cur: string) => {
                             const [key, value] = cur.split("=");
                             if (key && value) {
                                 acc[key] = value;
                             }
                             return acc;
                         },
                         {}
                     ),
                ...clOptions
            }
        } catch (ex) {
            throw new Error(
                `unable to extract options ${clOptions.config}!
${isNoFileFound(ex) && "-- unable to find config file!"}`
            );
        }
    }
    return clOptions;
}


function extractSSLOptions(cert: string | undefined, key: string | undefined): StaticFileServer.SSLConfig | void {
    if (cert && key) {
        return { cert, key }
    }
    if (cert && !key || key && !cert) {
        OUT.write("[WARNING] to use ssl, both cert and key must be specified!\n");
    }
    return;
}

function extractMailOptions(smtp: string, to: string): [string, Mailer.Config] | void {
    if (smtp && to) {
        const [username, password] = smtp.split(":");
        if (username && password) {
            return [
                to,
                {
                    username,
                    password
                }
            ]
        }
    }
    if (!smtp && to || !to && smtp) {
        OUT.write("[WARNING] to enable mail notifications, both email and smtp options must be specified!\n");
    }
    return;
}

function make_red(txt: string) {
    return Colors.red(txt); //display the help text in red on the console
}

function elapsedTimeSince(start: Date) {
    return new Date().getTime() - start.getTime();
}
