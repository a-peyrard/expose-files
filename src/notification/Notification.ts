module Notification {
    export interface NewFileEvent {
        downloadURL: string,
        deleteURL: string
    }

    export interface StopEvent {
        stopURL: string,
    }

    export function compose<E>(...notifiers: Notifier<E>[]): Notifier<E> {
        return {
            notify: (event: E) => Promise.all(
                notifiers.map(notifier => notifier.notify(event))
            ).then(results => {
                const result = results.reduce(
                    (acc, cur) => cur ? acc + cur : acc,
                    ""
                );
                return result ? result : undefined;
            })
        };
    }

    export interface Notifier<E> {
        notify: (event: E) => Promise<string | void>
    }
}

export default Notification;
