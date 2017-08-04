import * as Nodemailer from "nodemailer";
import { SentMessageInfo, Transporter } from "nodemailer";

module Mailer {
    export interface Config {
        username: string;
        password: string;
    }

    export interface Mail {
        to: string;
        subject: string;
        text: string;
    }

    export function withConfig(config: Mailer.Config) {
        return new Sender(config);
    }

    export class Sender {
        private readonly transporter: Transporter;

        constructor(private readonly config: Mailer.Config) {
            this.transporter = Nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: this.config.username,
                    pass: this.config.password,
                }
            });
        }

        public async send(mail: Mailer.Mail): Promise<SentMessageInfo> {
            return this.transporter.sendMail({
                ...mail,
                from: this.config.username
            });
        }
    }
}

export default Mailer;
