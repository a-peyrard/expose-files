import * as Fs from "fs";
import { isNoFileFound } from "../util/Error";
import { Readable } from "stream";
import * as Path from "path";

export default class Watcher extends Readable {
    public static watch(dirToWatch: string): Watcher {
        return new Watcher(dirToWatch);
    }

    public static watchMatching(dirToWatch: string, filter: RegExp): Watcher {
        return new Watcher(dirToWatch, filter);
    }

    private constructor(private readonly dirToWatch: string,
                        private readonly filter: RegExp = /.*/) {
        super();
    }

    _read(size: number): void {
        try {
            Fs.watch(
                this.dirToWatch,
                { recursive: true },
                (ignored, fileName) => {
                    if (this.filter.test(fileName)) {
                        this.push(Path.resolve(this.dirToWatch, fileName));
                    }
                }
            );
        } catch (ex) {
            throw new Error(
                `unable to watch ${this.dirToWatch}! ${isNoFileFound(ex) && "-- directory does not exists!"}`
            );
        }
    }
}
