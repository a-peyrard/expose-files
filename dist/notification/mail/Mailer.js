"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Nodemailer = require("nodemailer");
var Mailer;
(function (Mailer) {
    function withConfig(config) {
        return new Sender(config);
    }
    Mailer.withConfig = withConfig;
    class Sender {
        constructor(config) {
            this.config = config;
            this.transporter = Nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: this.config.username,
                    pass: this.config.password,
                }
            });
        }
        send(mail) {
            return __awaiter(this, void 0, void 0, function* () {
                return this.transporter.sendMail(Object.assign({}, mail, { from: this.config.username }));
            });
        }
    }
    Mailer.Sender = Sender;
})(Mailer || (Mailer = {}));
exports.default = Mailer;
//# sourceMappingURL=Mailer.js.map