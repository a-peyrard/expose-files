import * as Fs from "fs";
import * as Express from "express";
import { isNoFileFound } from "../util/Error";
import Notification from "../notification/Notification"
import * as Crypto from "crypto";
import { Writable } from "stream";
import * as https from "https";
import * as http from "http";
import * as ipify from "ipify";
import * as Path from "path";

const OUT = process.stdout;

export module StaticFileServer {
    export interface Config {
        dirToExpose: string,
        notifier?: Notification.Notifier<Notification.NewFileEvent>,
        ssl?: SSLConfig,
        bindingName?: string
    }

    export interface SSLConfig {
        cert: string,
        key: string
    }

    export const serve = (dirToExpose: string): ReadyToRun => {
        return new ReadyToRun({ dirToExpose });
    };

    export class ReadyToRun {
        constructor(private readonly config: StaticFileServer.Config) {}

        public onNewFile(notifier: Notification.Notifier<Notification.NewFileEvent>): ReadyToRun {
            return new ReadyToRun({
                ...this.config,
                notifier
            });
        }

        public useSSL(ssl: SSLConfig) {
            return new ReadyToRun({
                ...this.config,
                ssl
            });
        }

        public bindTo(bindingName: string) {
            return new ReadyToRun({
                ...this.config,
                bindingName
            });
        }

        public start(port = 3000): Promise<StaticFileServer.Running> {
            const { dirToExpose } = this.config;

            return new Promise((resolve, ignored) => {
                const app = Express()
                    .get("/:hash/clean", this.handleClean.bind(this))
                    .use(Express.static(dirToExpose));

                let server;
                let ssl = false;
                if (this.config.ssl) {
                    const cert = Fs.readFileSync(this.config.ssl.cert);
                    const key = Fs.readFileSync(this.config.ssl.key);
                    server = https.createServer({ key, cert }, app);
                    ssl = true;
                } else {
                    OUT.write("[WARNING] no key nor cert specified, so fallback to HTTP, " +
                        "exchanges will not be encrypted!\n");
                    server = http.createServer(app)
                }

                server.listen(port, () => {
                    this.getPublicIp()
                        .then((ip: string) => {
                            resolve(new Running(ip, port, this.config, ssl));
                        })
                });
            })
        }

        getPublicIp(): Promise<string> {
            let promise;
            if (this.config.bindingName) {
                promise = Promise.resolve(this.config.bindingName);
            } else {
                promise = ipify()
                    .catch(() => {
                        OUT.write("[WARNING] Unable to get public ip address, will use `127.0.0.1` in notification.");
                        return "127.0.0.1";
                    });
            }
            return promise;
        }

        handleClean(req: Express.Request, res: Express.Response) {
            const { dirToExpose } = this.config;

            const file = req.params.hash;
            if (file) {
                try {
                    OUT.write(`-- 🌪  cleaning file ${file}\n`);
                    const filePath = `${dirToExpose}/${file}`;
                    Fs.unlinkSync(filePath);
                    res.send(`🌪&nbsp;&nbsp;file ${file} successfully deleted!`);
                } catch (ex) {
                    if (isNoFileFound(ex)) {
                        error404(res);
                    } else {
                        error500(ex, res);
                    }
                }
                return;
            }
            // can't reach this!
            res.status(418);
            res.send("☕&nbsp;&nbsp;Do you want some covfefe?");
        }
    }


    export class Running extends Writable {
        public readonly address: string;
        constructor(private readonly ip: string,
                    private readonly port: number,
                    private readonly config: StaticFileServer.Config,
                    private readonly ssl: boolean) {
            super();
            this.address = `${ssl ? "https" : "http"}://${ip}:${port}`;
        }

        _write(chunk: any, encoding: string, done: (error?: Error) => void): void {
            this.exposeFile(chunk.toString());
            done();
        }

        exposeFile(file: string) {
            const { dirToExpose } = this.config;

            const hash = hashFile(file);
            const destination = `${dirToExpose}/${hash}`;
            Fs.symlink(
                file,
                destination,
                () => this.notifyNewExposedFile(Path.basename(file), hash)
            )
        }

        notifyNewExposedFile(name: string, relativePath: string) {
            const { notifier = Notification.noopNotifier() } = this.config;
            const downloadURL = `${this.address}/${relativePath}`;
            return notifier.notify({
                name,
                downloadURL,
                deleteURL: `${downloadURL}/clean`
            });
        }
    }
}

function hashFile(path: string): string {
    return Crypto.createHash("md5")
                 .update(path)
                 .digest("hex");
}

function error404(res: Express.Response) {
    res.status(404);
    res.send("4️⃣0️⃣4️⃣&nbsp;&nbsp;&nbsp;😱");
}

function error500(ex: Error, res: Express.Response) {
    res.status(500);
    res.send(`unknown error: ${ex}`);
}
