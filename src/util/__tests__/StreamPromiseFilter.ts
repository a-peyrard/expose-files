import { Readable, Writable } from "stream";
import StreamPromiseFilter from "../StreamPromiseFilter";

class Sink extends Writable {
    public readonly list: string[] = [];

    _write(chunk: any, encoding: string, done: Function): void {
        this.list.push(chunk.toString());
        done();
    }
}

export function promiseStreamConsumption(stream: NodeJS.EventEmitter) {
    return new Promise((resolve, reject) => {
        stream
            .setMaxListeners(stream.getMaxListeners() + 1)
            .on("finish", () => resolve())
            .on("error", error => reject(error));
    });
}

describe("StreamPromiseFilter", () => {
    it("should filter a stream", () => {
        // GIVEN
        class Generator extends Readable {
            private nbRead = 0;

            _read(size: number): void {
                if (this.nbRead > 4) {
                    this.push(null);
                } else if (this.nbRead++ % 2 === 0) {
                    this.push("foo");
                } else {
                    this.push("bar");
                }
            }
        }
        const onlyFoo = (val: string) => Promise.resolve(val.toString() === 'foo');
        const sink = new Sink();

        return promiseStreamConsumption(
            // WHEN
            new Generator()
                .pipe(StreamPromiseFilter.filter(onlyFoo))
                .pipe(sink)
        ).then(() => {
            // THEN
            expect(sink.list).toEqual(["foo", "foo", "foo"]);
        });
    });
});
