"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MailNewFileNotifier {
    constructor(dest, mailer) {
        this.dest = dest;
        this.mailer = mailer;
    }
    static to(dest, mailer) {
        return new MailNewFileNotifier(dest, mailer);
    }
    notify(event) {
        return this.mailer.send({
            to: this.dest,
            subject: `📬  New file available: ${event.name}!`,
            text: `Hi,

A new file is available for download: ${event.downloadURL}.
to delete the file you can use this URL: ${event.deleteURL}.

Cheers  ❤️ 
-- your server`
        }).then(message => message.response);
    }
}
exports.MailNewFileNotifier = MailNewFileNotifier;
class MailStopServerNotifier {
    constructor(dest, mailer) {
        this.dest = dest;
        this.mailer = mailer;
    }
    static to(dest, mailer) {
        return new MailNewFileNotifier(dest, mailer);
    }
    notify(event) {
        return this.mailer.send({
            to: this.dest,
            subject: "💻  I just started!",
            text: `Hi,

I just started, if you want to stop me, clink on the link bellow:
${event.stopURL}

Best  ❤️ 
-- your server`
        }).then(message => message.response);
    }
}
exports.MailStopServerNotifier = MailStopServerNotifier;
//# sourceMappingURL=MailNotifier.js.map