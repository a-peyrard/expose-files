var Notifier;
(function (Notifier) {
    function compose(...notifiers) {
        return (event) => {
            notifiers.forEach(notifier => notifier.notify(event));
        };
    }
})(Notifier || (Notifier = {}));
//# sourceMappingURL=Notifier.js.map