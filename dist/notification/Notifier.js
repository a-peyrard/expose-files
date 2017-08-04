"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Notification;
(function (Notification) {
    function compose(...notifiers) {
        return (event) => {
            notifiers.forEach(notifier => notifier.notify(event));
        };
    }
    Notification.compose = compose;
})(Notification || (Notification = {}));
exports.default = Notification;
//# sourceMappingURL=Notifier.js.map