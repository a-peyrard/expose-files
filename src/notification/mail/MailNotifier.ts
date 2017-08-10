import Mailer from "./Mailer";
import Notification from "../Notification";

export class MailNewFileNotifier implements Notification.Notifier<Notification.NewFileEvent> {

    public static to(dest: string, mailer: Mailer.Sender) {
        return new MailNewFileNotifier(dest, mailer);
    }

    constructor(private readonly dest: string, private readonly mailer: Mailer.Sender) {}

    notify(event: Notification.NewFileEvent): Promise<string | void> {
        return this.mailer.send({
            to: this.dest,
            subject: `📬  New file available: ${event.name}!`,
            text:
`Hi,

A new file is available for download: ${event.downloadURL}.
to delete the file you can use this URL: ${event.deleteURL}.

Cheers  ❤️ 
-- your server`
        }).then(message => message.response)
    }
}

export class MailStopServerNotifier implements Notification.Notifier<Notification.StopEvent> {

    public static to(dest: string, mailer: Mailer.Sender) {
        return new MailNewFileNotifier(dest, mailer);
    }

    constructor(private readonly dest: string, private readonly mailer: Mailer.Sender) {}

    notify(event: Notification.StopEvent): Promise<string | void> {
        return this.mailer.send({
            to: this.dest,
            subject: "💻  I just started!",
            text:
`Hi,

I just started, if you want to stop me, clink on the link bellow:
${event.stopURL}

Best  ❤️ 
-- your server`
        }).then(message => message.response)
    }
}
