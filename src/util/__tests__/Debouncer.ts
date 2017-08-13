import { setTimeout } from "timers";
import { Readable, Writable } from "stream";
import Debouncer from "../Debouncer";

class WritableCollection extends Writable {

    private readonly list: string[] = [];
    public finalized = false;

    _write(chunk: any, encoding: string, done: Function): void {
        this.list.push(chunk.toString());
        done();
    }

    public _final(done: (error?: Error) => void) {
        this.finalized = true;
        done();
    }

    dump(): string[] {
        return [...this.list];
    }
}

describe("Debouncer", () => {
    it("should debounce a stream", () => {
        // GIVEN a stream issuing 3 times "foo", and then 100ms later 3 more "foo"
        class Generator extends Readable {
            private nbRead = 0;

            _read(size: number): void {
                if (this.nbRead === 3) {
                    setTimeout(
                        () => this.push("foo"),
                        100
                    );
                } else if (this.nbRead === 6) {
                    this.push(null);
                } else {
                    this.push("foo");
                }
                this.nbRead++;
            }
        }
        const snitch = new WritableCollection();

        // WHEN pipe with a debouncer the read of the stream
        new Generator()
            .pipe(Debouncer.millis(30))
            .pipe(snitch);

        return new Promise(((resolve, ignored) => {
            setTimeout(() => {
                // THEN 200ms later checking the result, and expecting 2 foo, one per spread
                expect(snitch.dump()).toEqual(["foo", "foo"]);

                resolve();
            }, 200);
        }));
    });

    it("should debounce multiple chunks in a stream", () => {
        // GIVEN a stream issuing 3 times "foo", and then 100ms later 3 more "foo"
        class Generator extends Readable {
            private nbRead = 0;
            private readonly chunks = [
                "foo", "foo", "fum", "fum", "fum", "bar", undefined,
                "bar", "bar", "foo",
            ];
            _read(size: number): void {
                if (this.nbRead >= this.chunks.length) {
                    this.push(null);
                } else if (this.chunks[this.nbRead] === undefined) {
                    setTimeout(
                        () => this.push(this.chunks[++this.nbRead]),
                        100,
                    )
                } else {
                    this.push(this.chunks[this.nbRead]);
                }
                this.nbRead++;
            }
        }
        const snitch = new WritableCollection();

        // WHEN pipe with a debouncer the read of the stream
        new Generator()
            .pipe(Debouncer.millis(30))
            .pipe(snitch);

        return new Promise(((resolve, ignored) => {
            setTimeout(() => {
                // THEN 200ms later checking the result, and expecting 2 foo, one per spread
                expect(snitch.dump()).toEqual(["foo", "fum", "bar", "bar", "foo"]);

                resolve();
            }, 200);
        }));
    });

    it("should finalize the stream when everything is written", () => {
        // GIVEN a stream issuing 3 times "foo", and then 100ms later 3 more "foo"
        class Generator extends Readable {
            private nbRead = 0;
            private readonly chunks = [
                "foo", "foo", undefined,
                "foo", "foo"
            ];
            _read(size: number): void {
                if (this.nbRead >= this.chunks.length) {
                    this.push(null);
                } else if (this.chunks[this.nbRead] === undefined) {
                    setTimeout(
                        () => this.push(this.chunks[++this.nbRead]),
                        100,
                    )
                } else {
                    this.push(this.chunks[this.nbRead]);
                }
                this.nbRead++;
            }
        }
        const snitch = new WritableCollection();

        // WHEN pipe with a debouncer the read of the stream
        new Generator()
            .pipe(Debouncer.millis(30))
            .pipe(snitch);

        return new Promise(((resolve, ignored) => {
            setTimeout(() => {
                expect(snitch.finalized).toBeTruthy();
                resolve();
            }, 200);
        }));
    });

});
