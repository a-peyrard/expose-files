import Notification from "../Notification";
import WritableStream = NodeJS.WritableStream;

export class WritableStreamNewFileNotifier implements Notification.Notifier<Notification.NewFileEvent> {
    public static to(out: WritableStream) {
        return new WritableStreamNewFileNotifier(out);
    }

    constructor(private readonly out: WritableStream) {}

    notify(event: Notification.NewFileEvent): Promise<string | void> {
        this.out.write(
            `-- 📬  New file ${event.downloadURL}
  (removable using: ${event.deleteURL} )\n`
        );
        return Promise.resolve();
    }
}

export class WritableStreamStopNotifier implements Notification.Notifier<Notification.StopEvent> {
    public static to(out: WritableStream) {
        return new WritableStreamStopNotifier(out);
    }

    constructor(private readonly out: WritableStream) {}

    notify(event: Notification.StopEvent): Promise<string | void> {
        this.out.write(
            `-- ☠️  kill server by following ${event.stopURL}\n`
        );
        return Promise.resolve();
    }
}
