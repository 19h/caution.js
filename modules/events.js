define('events', [], function () {
	var api = {};
	
	// Quick'n'dirty EventEmitter class
	function EventEmitter() {
		// This space intentionally left blank
		// 	- all the logic is in the methods, which allows us to stick those methods on anything and have them work
	}
	EventEmitter.prototype = {
		on: function (event, listener) {
			this._events = this._events || {};
			this._events[event] = this._events[event] || [];
			this._events[event].push(listener);
			this.emit('newListener', event, listener);
			return this;
		},
		once: function (event, listener) {
			var selfRemovingListener = function () {
				this.off(event, selfRemovingListener);
				listener.apply(this, arguments);
			};
			return this.on(event, selfRemovingListener);
		},
		off: function (event, listener) {
			if (!listener) {
				if (!event) {
					for (event in this._events || {}) {
						this.off(event);
					}
				} else {
					var listeners = (this._events && this._events[event]) || [];
					while (listeners.length) {
						this.emit('removeListener', event, listeners.shift());
					}
					this._events[event] = [];
				}
			} else if (event) {
				this._events = this._events || {};
				this._events[event] = this._events[event] || [];
				var index = this._events[event].indexOf(listener);
				if (index !== -1) {
					this._events[event].splice(index, 1);
				}
				this.emit('removeListener', event, listener);
			}
			return this;
		},
		removeListener: function (event, listener) {
			if (typeof listener !== 'function') throw new Error('Listener must be function');
			return this.off(event, listener);
		},
		emit: function (event) {
			var args = Array.prototype.slice.call(arguments, 1);
			if (this._events && this._events[event]) {
				var listeners = this._events[event].slice();
				while (listeners.length) {
					var listener = listeners.shift();
					listener.apply(this, args);
				}
				return true;
			}
			return false;
		},
		setMaxListeners: function (n) {
			// Ignore this for now
		},
		listeners: function (event) {
			return (this._events[event] || []).slice(0);
		}
	};
	EventEmitter.prototype.addListener = EventEmitter.prototype.on;
	EventEmitter.prototype.removeAllListeners = EventEmitter.prototype.off;
	EventEmitter.listenerCount = function (emitter, event) {
		return (emitter._events[event] || []).length;
	};
	
	api.EventEmitter = EventEmitter;
	api.eventify = function (obj) {
		for (var key in EventEmitter.prototype) {
			obj[key] = EventEmitter.prototype[key];
		}
		return obj;
	};
	
	return api;
});