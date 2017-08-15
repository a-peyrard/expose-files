import * as Fs from "fs";
import { promisify } from "util";

export function isFile(path: string): Promise<boolean> {
    return promisify(Fs.stat)(path)
        .then((stats: Fs.Stats) => stats.isFile())
        .catch(() => false); // non existing files are not files
}
