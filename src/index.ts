#!/usr/bin/env node

import Watcher from "./server/Watcher";
import { WritableStreamNewFileNotifier } from "./notification/console/ConsoleNotifier";
import { StaticFileServer } from "./server/StaticFileServer";
import * as program from "Commander";
import * as Colors from "colors";
import Mailer from "./notification/mail/Mailer";
import Notification from "./notification/Notification";
import { MailNewFileNotifier } from "./notification/mail/MailNotifier";

const OUT = process.stdout;

program
    .version("0.0.1")
    .description("watch some directory and expose new files via web server")
    .usage("<path-to-watch> [options]")
    .option(
        "--expose-out <path-to-expose>",
        "The path where the exposed file will be linked.",
        "/tmp"
    )
    .option(
        "--port <port>",
        "The port for the web server.",
        3000
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
    .action((pathToWatch: string, options: any) => {
        const start = new Date();
        /*
            ---- Start express to expose files, then start a watcher, and pipe it to server
         */
        let staticFileServer = StaticFileServer.serve(options.exposeOut);

        const sslOptions = extractSSLOptions(options.cert, options.key);
        if (sslOptions) {
            staticFileServer = staticFileServer.useSSL(sslOptions);
        }
        if (options.bindTo) {
            staticFileServer = staticFileServer.bindTo(options.bindTo);
        }

        let notifier: Notification.Notifier<Notification.NewFileEvent> =
            WritableStreamNewFileNotifier.to(process.stdout);
        const mailOptions = extractMailOptions(options.smtp, options.email);
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
            .start(options.port)
            .then(server => {
                OUT.write(`👓  watching ${pathToWatch}\n`);
                Watcher.watch(pathToWatch)
                       .pipe(server);
                OUT.write(
                    `💻  server started on ${server.address} in ${elapsedTimeSince(start)}ms\n`
                );
            });

    })
    .parse(process.argv);

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

if (!process.argv.slice(2).length) {
    program.outputHelp(make_red as any);
}

function make_red(txt: string) {
    return Colors.red(txt); //display the help text in red on the console
}

function elapsedTimeSince(start: Date) {
    return new Date().getTime() - start.getTime();
}
