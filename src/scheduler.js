/** @module scheduler */

var Scheduler = function (options) {
    this.events = new ymaps.event.Manager({
        controllers: [{
            onStartListening: ymaps.util.bind(this._start, this),
            onStopListening: ymaps.util.bind(this._stop, this)
        }],
        context: this
    });
    this.options = new ymaps.option.Manager(ymaps.util.extend({
        updateInterval: 5000,
        minUpdateInterval: 2500,
        loadTweetsOnStart: true,
        loadTweetsOnOptionsChanges: true
    }, options));
};

ymaps.util.extend(Scheduler.prototype, {

    _start: function (eventManager, eventType) {
        if (eventType === 'tweetsloaded') {
            this._timer = setInterval(
                ymaps.util.bind(this._tick, this),
                this.options.get('updateInterval'),
                true
            );
            if (this.options.get('loadTweetsOnStart')) {
                this._tick();
            }
            this.options.events.add('change', this._onOptionsChange, this);
        }
    },

    _stop: function (eventManager, eventType) {
        if (eventType === 'tweetsloaded') {
            clearInterval(this._timer);
            this._timer = null;
            this.options.events.remove('change', this._onOptionsChange, this);
        }
    },

    _tick: function (fromInterval) {
        var options = this.options.getAll();

        if (fromInterval &&
            (Date.now() - (this._lastOptionsChangeTime)) < options.minUpdateInterval
        ) {
            return;
        }

        if (this._lastRequest) {
            this._lastRequest.abort();
        }

        this._lastRequest = require('./twitter-search')(
            options.twitterSearchQuery,
            options.twitterGeocodeQuery,
            this._onTweetsLoad,
            {
                callbackCtx: this
            }
        );
    },

    _onTweetsLoad: function (tweets) {
        this._lastRequest = null;
        this.events.fire('tweetsloaded', {tweets: tweets});
    },

    _onOptionsChange: function () {
        if (this.options.get('loadTweetsOnOptionsChanges')) {
            this._lastOptionsChangeTime = Date.now();
            this._tick();
        }
    }
});

module.exports = Scheduler;
