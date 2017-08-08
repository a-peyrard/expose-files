import * as Fs from "fs";
import { isNoFileFound } from "../util/Error";
import { Readable } from "stream";

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
                (eventType, fileName) => {
                    if (eventType === 'rename' && this.filter.test(fileName)) {
                        this.push(`${this.dirToWatch}/${fileName}`);
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
