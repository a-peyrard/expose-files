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
import { promisify } from "util";

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

            const dirName = req.params.hash;
            if (dirName) {
                const dirPath = Path.resolve(dirToExpose, dirName);
                OUT.write(`-- 🌪  cleaning directory ${dirName}\n`);
                deleteDirectory(dirPath)
                    .then(() => res.send(`🌪&nbsp;&nbsp;dir ${dirPath} successfully deleted!`))
                    .catch(error => {
                        console.error(error);
                        if (isNoFileFound(error)) {
                            error404(res);
                        } else {
                            error500(error, res);
                        }
                    });
            }
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

            const fileName = Path.basename(file);
            const destinationDir = Path.resolve(dirToExpose, hash);
            const linkPath = Path.resolve(destinationDir, fileName);

            promisify(Fs.mkdir)(destinationDir)
                .then(() => promisify(Fs.symlink)(file, linkPath))
                .then(() => this.notifyNewExposedFile(fileName, Path.relative(dirToExpose, linkPath), hash))
                .catch(error => {
                    console.error("unable to manage " + file, error);
                });
        }

        notifyNewExposedFile(name: string, relativePath: string, hash: string) {
            const { notifier = Notification.noopNotifier() } = this.config;
            const downloadURL = `${this.address}/${relativePath}`;
            const deleteURL = `${this.address}/${hash}/clean`;
            return notifier.notify({
                name,
                downloadURL,
                deleteURL
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

/*
    Note: this is not generic at all, this will just remove the directory, and the link inside it

    It does not work recursively.
 */
function deleteDirectory(dir: string): Promise<void> {
    const unlink = promisify(Fs.unlink);
    return promisify(Fs.readdir)(dir)
        .then(files => Promise.all(
            files.map(f => unlink(Path.resolve(dir, f)))
        ))
        .then(() => promisify(Fs.rmdir)(dir))
}
