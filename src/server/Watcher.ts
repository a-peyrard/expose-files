import * as Fs from "fs";
import Notification from "../notification/Notification";
import * as Path from "path";
import * as Crypto from "crypto";
import { isNoFileFound } from "../util/Error";

const OUT = process.stdout;
const ERROR = process.stderr;

// fixme use an URLMaker to create URL from relative paths.
const HOSTNAME = "localhost";
const PORT = 3000;

export function start(dirToWatch: string,
                      dirToExpose: string,
                      notifier: Notification.Notifier<Notification.NewFileEvent>) {
    try {
        OUT.write(`👓  watching ${dirToWatch}\n`);
        Fs.watch(dirToWatch, { recursive: true }, (eventType, fileName) => {
            if (eventType === 'rename') {
                exposeNewFile(`${dirToWatch}/${fileName}`, dirToExpose, notifier);
            }
        });
    } catch (ex) {
        ERROR.write(`unable to watch ${dirToWatch}!\n`);
        if (isNoFileFound(ex)) {
            ERROR.write("-- directory does not exists!");
        }
        process.exit(-1);
    }
}

function exposeNewFile(path: string,
                       dirToExpose: string,
                       notifier: Notification.Notifier<Notification.NewFileEvent>) {
    const hash = hashFile(path);
    const destination = `${dirToExpose}/${hash}`;
    Fs.symlink(path, destination, () => {
        notifyNewExposedFile(destination, dirToExpose, notifier);
    })
}

function hashFile(path: string): string {
    return Crypto.createHash("md5")
                 .update(path)
                 .digest("hex");
}

function notifyNewExposedFile(path: string,
                              dirToExpose: string,
                              notifier: Notification.Notifier<Notification.NewFileEvent>) {
    const relativePath = Path.relative(dirToExpose, path);
    notifier.notify({
        downloadURL: `http://${HOSTNAME}:${PORT}/${relativePath}`,
        deleteURL: `http://${HOSTNAME}:${PORT}/${relativePath}/clean`
    });
}
