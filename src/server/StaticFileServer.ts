import * as Fs from "fs";
import * as Express from "express";
import { isNoFileFound } from "../util/Error";
import Notification from "../notification/Notification"
import * as Crypto from "crypto";
import { Writable } from "stream";

const OUT = process.stdout;
const HOSTNAME = "localhost";

export module StaticFileServer {
    export interface Config {
        dirToExpose: string,
        notifier?: Notification.Notifier<Notification.NewFileEvent>
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

        public start(port = 3000): Promise<StaticFileServer.Running> {
            const { dirToExpose } = this.config;

            return new Promise((resolve, ignored) => {
                Express()
                    .get("/:hash/clean", this.handleClean.bind(this))
                    .use(Express.static(dirToExpose))
                    .listen(port, () => {
                        resolve(new Running(port, this.config));
                    });
            })
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
        constructor(public readonly port: number,
                    private readonly config: StaticFileServer.Config) {
            super()
        }

        _write(chunk: any, encoding: string, done: (error?: Error) => void): void {
            this.exposeFile(chunk);
            done();
        }

        exposeFile(file: string) {
            const { dirToExpose } = this.config;

            const hash = hashFile(file);
            const destination = `${dirToExpose}/${hash}`;
            Fs.symlink(
                file,
                destination,
                () => this.notifyNewExposedFile(hash)
            )
        }

        notifyNewExposedFile(relativePath: string) {
            const { notifier = Notification.noopNotifier() } = this.config;
            return notifier.notify({
                downloadURL: `http://${HOSTNAME}:${this.port}/${relativePath}`,
                deleteURL: `http://${HOSTNAME}:${this.port}/${relativePath}/clean`
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
