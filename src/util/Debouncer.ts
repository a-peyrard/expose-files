import { Transform } from "stream";

export default class Debouncer extends Transform {
    public static seconds(delayInSec: number) {
        return new Debouncer(delayInSec * 1000);
    }

    public static millis(delayInMs: number) {
        return new Debouncer(delayInMs);
    }

    private readonly debounced: Map<string, NodeJS.Timer> = new Map();
    private finalizer?: Function;

    constructor(private readonly delay: number) {
        super();
    }

    _transform(chunkBytes: any, encoding: string, done: Function): void {
        const chunk = chunkBytes.toString();

        const oldTimeout = this.debounced.get(chunk);
        if (oldTimeout) {
            clearTimeout(oldTimeout);
        }

        this.debounced.set(chunk, setTimeout(
            () => {
                this.debounced.delete(chunk);
                this.push(chunk);
                this.mightFinalize();
            },
            this.delay
        ));

        done();
    }

    mightFinalize() {
        if (this.finalizer && this.debounced.size === 0) {
            this.finalizer();
        }
    }

    _final(done: Function): void {
        this.finalizer = done;
        this.mightFinalize();
    }
}
