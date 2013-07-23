/** @module behavior */

var Scheduler = require('./scheduler');
var GeoTweet = require('./geo-tweet');
var IndexedCollection = require('./indexed-collection');

/**
 * @implements ymaps.IBehavior
 * @param {Object} [options] Behaviors options.
 */
var Behavior = function (options) {
        this.events = new ymaps.event.Manager();

        this.tweets = new IndexedCollection(null, {
            balloonContentLayout: 'dmikis#tweet'
        });

        this._scheduler = new Scheduler({
            twitterSearchQuery: ''
        });

        this._parent = null;
        this._map = null;
    };

ymaps.util.extend(Behavior.prototype, {

    enable: function () {
        this._isEnabled = true;
    },

    disable: function () {
        this._isEnabled = false;
    },

    isEnabled: function () {
        return this._isEnabled;
    },

    setParent: function (parent) {
        if (this._parent !== parent) {
            if (this._parent) {
                this._parent.events.remove('mapchange', this._onMapChange, this);
            }
            if (parent) {
                parent.events.add('mapchange', this._onMapChange, this);
                if (parent.getMap() !== this._map) {
                    this._onMapChange(new ymaps.Event({
                        oldMap: this._map,
                        newMap: parent.getMap()
                    }));
                }
            }
            this._parent = parent;
        }
        return this;
    },

    getParent: function () {
        return this._parent;
    },

    _onMapChange: function (event) {
        var oldMap = event.get('oldMap'),
            newMap = event.get('newMap');

        if (oldMap) {
            this._scheduler.events.remove('tweetsloaded', this._onTweetsLoaded, this);
            oldMap.events.remove('boundschange', this._onMapBoundsChange, this);
            oldMap.geoObjects.remove(this.tweets);
        }
        if (newMap) {
            newMap.events.add('boundschange', this._onMapBoundsChange, this);
            this._scheduler.options.set('twitterGeocodeQuery', [
                    newMap.getCenter().join(),
                    Math.floor(ymaps.coordSystem.geo.distance(newMap.getBounds()[0], newMap.getBounds()[1]) * 5e-4) + 'km'
                ].join());
            this._scheduler.events.add('tweetsloaded', this._onTweetsLoaded, this);
            newMap.geoObjects.add(this.tweets);
        }
        this._map = newMap;
    },

    _onMapBoundsChange: function () {
        this._scheduler.options.set('twitterGeocodeQuery', [
                this._map.getCenter().join(),
                Math.floor(ymaps.coordSystem.geo.distance(map.getBounds()[0], map.getBounds()[1]) * 5e-4) + 'km'
            ].join());
    },

    _onTweetsLoaded: function (e) {
        e.get('tweets').forEach(function (tweet) {
            if (!this.tweets.getByIndex(tweet.id)) {
                this.tweets.add(new GeoTweet(tweet), tweet.id);
            }
        }, this);
    }
});

module.exports = Behavior;
