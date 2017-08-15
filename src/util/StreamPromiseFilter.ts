import { Transform } from "stream";

export default class StreamPromiseFilter<T> extends Transform {
    static filter<T>(filter: (T: any) => Promise<boolean>): StreamPromiseFilter<T> {
        return new StreamPromiseFilter(filter);
    }

    private finalizer?: Function;
    private pending: number = 0;

    constructor(private readonly filter: (T: any) => Promise<boolean>) {
        super();
    }

    _transform(chunk: any, encoding: string, done: Function): void {
        this.pending++;
        this.filter(chunk)
            .then(res => {
                if (res) {
                    this.push(chunk);
                }
                if (this.finalizer && --this.pending === 0) {
                    this.finalizer();
                }
            });
        done();
    }

    _final(done: Function) {
        this.finalizer = done;
    }
}
