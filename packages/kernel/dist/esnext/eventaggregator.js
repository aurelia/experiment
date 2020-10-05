import { DI } from './di';
import { Reporter } from './reporter';
/**
 * Represents a handler for an EventAggregator event.
 */
class Handler {
    constructor(messageType, callback) {
        this.messageType = messageType;
        this.callback = callback;
    }
    handle(message) {
        if (message instanceof this.messageType) {
            this.callback.call(null, message);
        }
    }
}
function invokeCallback(callback, message, channel) {
    try {
        callback(message, channel);
    }
    catch (e) {
        Reporter.error(0, e); // TODO: create error code
    }
}
function invokeHandler(handler, message) {
    try {
        handler.handle(message);
    }
    catch (e) {
        Reporter.error(0, e); // TODO: create error code
    }
}
export const IEventAggregator = DI.createInterface('IEventAggregator').withDefault(x => x.singleton(EventAggregator));
/**
 * Enables loosely coupled publish/subscribe messaging.
 */
export class EventAggregator {
    constructor() {
        /** @internal */
        this.eventLookup = {};
        /** @internal */
        this.messageHandlers = [];
    }
    publish(channelOrInstance, message) {
        if (!channelOrInstance) {
            throw Reporter.error(0); // TODO: create error code for 'Event was invalid.'
        }
        if (typeof channelOrInstance === 'string') {
            let subscribers = this.eventLookup[channelOrInstance];
            if (subscribers !== void 0) {
                subscribers = subscribers.slice();
                let i = subscribers.length;
                while (i-- > 0) {
                    invokeCallback(subscribers[i], message, channelOrInstance);
                }
            }
        }
        else {
            const subscribers = this.messageHandlers.slice();
            let i = subscribers.length;
            while (i-- > 0) {
                invokeHandler(subscribers[i], channelOrInstance);
            }
        }
    }
    subscribe(channelOrType, callback) {
        if (!channelOrType) {
            throw Reporter.error(0); // TODO: create error code for 'Event channel/type was invalid.'
        }
        let handler;
        let subscribers;
        if (typeof channelOrType === 'string') {
            if (this.eventLookup[channelOrType] === void 0) {
                this.eventLookup[channelOrType] = [];
            }
            handler = callback;
            subscribers = this.eventLookup[channelOrType];
        }
        else {
            handler = new Handler(channelOrType, callback);
            subscribers = this.messageHandlers;
        }
        subscribers.push(handler);
        return {
            dispose() {
                const idx = subscribers.indexOf(handler);
                if (idx !== -1) {
                    subscribers.splice(idx, 1);
                }
            }
        };
    }
    subscribeOnce(channelOrType, callback) {
        const sub = this.subscribe(channelOrType, function (message, event) {
            sub.dispose();
            callback(message, event);
        });
        return sub;
    }
}
//# sourceMappingURL=eventaggregator.js.map