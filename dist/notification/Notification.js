"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Notification;
(function (Notification) {
    function compose(...notifiers) {
        return {
            notify: (event) => Promise.all(notifiers.map(notifier => notifier.notify(event))).then(results => {
                const result = results.reduce((acc, cur) => cur ? acc + cur : acc, "");
                return result ? result : undefined;
            })
        };
    }
    Notification.compose = compose;
})(Notification || (Notification = {}));
exports.default = Notification;
//# sourceMappingURL=Notification.js.map