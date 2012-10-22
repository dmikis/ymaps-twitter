ymaps.ready(function () {

    var HEAD_NODE = document.getElementsByTagName('head')[0];

    var jsonpDataProvider = {

            /**
             * Load data by JSONP.
             *
             * @function
             * @param {String} url Data url.
             * @param {Function} callback Function to be called when data'll be loaded.
             * @param {Object} [options] Options.
             * @param {Object} [options.callbackCtx = window] Callback's execution context.
             * @param {Number} [options.timeout = 3000] Request's timeout.
             * @returns {Object} Hash with `abort` method.
             */
            getData: function (url, callback, options) {
                options = ymaps.util.extend({
                    callbackCtx: window,
                    timeout: 3000
                }, options);

                var callbackName = 'jsonp_' + Math.floor(1e8 * Math.random()),
                    scriptNode = document.createElement('script'),
                    abortFn = function (callCallback) {
                        if (callCallback === true) {
                            callback.call(options.callbackCtx, null);
                        }
                        delete window[callbackName];
                        HEAD_NODE.removeChild(scriptNode);
                    },
                    timeoutHandler = setTimeout(abortFn, options.timeout, true);

                scriptNode.setAttribute('src', [
                    url,
                    url.indexOf('?') > 0 ? '&' : '?',
                    'callback=',
                    callbackName
                ].join(''));
                scriptNode.setAttribute('type', 'text/javascript');

                window[callbackName] = function (data) {
                    callback.call(options.callbackCtx, data);
                    delete window[callbackName];
                    HEAD_NODE.removeChild(scriptNode);
                    clearTimeout(timeoutHandler);
                };

                HEAD_NODE.appendChild(scriptNode);

                return {abort: abortFn};
            }
        };

    var twitterDataProvider = {

            getTweets: function (query, geocode, callback, options) {
                console.log('twitterDataProvider: search "' + query + '", geocode "' + geocode + '"');
                options = ymaps.util.extend({
                    callbackCtx: window,
                    tweetsWithGeoInfoOnly: true,
                    twitterSearchURL: 'http://search.twitter.com/search.json?q=%q&rpp=%n&geocode=%g',
                    resultsNum: 100
                }, options);

                var url = options.twitterSearchURL
                        .replace('%q', query)
                        .replace('%g', geocode)
                        .replace('%n', options.resultsNum);

                jsonpDataProvider.getData(url, function (data) {
                    console.log(data);
                    callback.call(
                        options.callbackCtx,
                        options.tweetsWithGeoInfoOnly ?
                            data.results
                                .filter(function (tweet) {
                                    return !!tweet.geo;
                                }) :
                            data.results);
                });
            }
        };

    function getTwitterUserLink(username) {
        return ['<a href="http://www.twitter.com/', username,
            '" target="_blank">@', username, '</a>'].join('');
    }

    var GeoTweet = function (tweet) {
        GeoTweet.superclass.constructor.call(this,
            tweet.geo.coordinates,
            {
                author: tweet.from_user,
                text: this._formatTweetText(tweet.text),
                metaInfo: 'Created at ' + tweet.created_at,
                userpic: tweet.profile_image_url
            });
    }

    ymaps.util.augment(GeoTweet, ymaps.Placemark, {

        _formatTweetText: function (rawText) {
            return rawText
                // format links
                .replace(/(http:\/\/\S+)/g, '<a href="$1" target="_blank">$1</a>')
                // format hashtags
                .replace(/(#\S+)/g, function (match, p1) {
                    return [
                        '<a href="https://twitter.com/search?q=',
                        encodeURIComponent(p1),
                        '" target="_blank">',
                        p1,
                        '</a>'
                    ].join('');
                })
                // format usernames
                .replace(/@(\S+)/g, function (match, p1) {
                    return getTwitterUserLink(p1);
                });
        }
    });

    var IndexedGeoObjectCollection = function () {
            IndexedGeoObjectCollection.superclass.constructor.apply(this, arguments);
            this._itemsCache = {};
        };

    ymaps.util.augment(IndexedGeoObjectCollection, ymaps.GeoObjectCollection, {

        add: function (item, index) {
            IndexedGeoObjectCollection.superclass.add.call(this, item);
            this._itemsCache[index] = item;
        },

        getByIndex: function (index) {
            return this._itemsCache[index];
        }
    });

    var TwitterControl = function (options) {
            this.events = new ymaps.event.Manager();

            this.tweets = new IndexedGeoObjectCollection(null, {
                balloonContentLayout: 'dmikis#tweet'
            });

            this._parent = null;
            this._map = null;
        };

    ymaps.util.extend(TwitterControl.prototype, {

        setParent: function (parent) {
            console.log('TwitterControl: setParent', parent);
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

            console.log('TwitterControl: _onMapChange', oldMap, newMap);

            if (oldMap) {
                oldMap.events.remove('boundschange', this._onMapBoundsChange, this);
                oldMap.geoObjects.remove(this.tweets);
            }
            if (newMap) {
                newMap.events.add('boundschange', this._onMapBoundsChange, this);
                newMap.geoObjects.add(this.tweets);
            }
            this._map = newMap;
        },

        _onMapBoundsChange: function () {
            console.log('TwitterControl: map\'s bounds changed');
            twitterDataProvider.getTweets(
                '', [
                    this._map.getCenter().join(),
                    Math.floor(ymaps.coordSystem.geo.distance(map.getBounds()[0], map.getBounds()[1]) * 5e-4) + 'km'
                ].join(),
                function (tweets) {
                    tweets.forEach(function (tweet) {
                        if (!this.tweets.getByIndex(tweet.id)) {
                            this.tweets.add(new GeoTweet(tweet), tweet.id);
                        }
                    }, this);
                },
                {callbackCtx: this});
        }
    });

    ymaps.layout.storage.add('dmikis#tweet', ymaps.templateLayoutFactory.createClass([
        '<div class="tweet">',
            '<h3 class="tweet_author">',
                '<img src="$[properties.userpic]" />',
                getTwitterUserLink('$[properties.author]'),
            '</h3>',
            '<div class="tweet_content">$[properties.text]</div>',
            '<div class="tweet_metainfo">$[properties.metaInfo]</div>',
        '</div>'
    ].join('')));

    var styles = [
            '.tweet',
            '{',
                'margin: 5px;',
            '}',

            '.tweet a, .tweet a:visited',
            '{',
                'color: #4D9AFF;',
                'text-decoration: none;',
            '}',

            '.tweet_author',
            '{',
                'margin: 0px;',
                'font: 22px sans-serif;',
                'margin-bottom: 5px;',
            '}',

            '.tweet_author > img',
            '{',
                'float: left;',
                'width: 24px;',
                'height: 24px;',
            '}',

            '.tweet_content',
            '{',
                'margin: 0px;',
                'font: 16px serif;',
            '}',

            '.tweet_metainfo',
            '{',
                'margin: 0px;',
                'color: #B5B5B5;',
                'font: 10px sans-serif;',
            '}'
        ].join('');

    var styleNode = document.createElement('style');
    styleNode.innerHTML = styles;
    HEAD_NODE.appendChild(styleNode);

    window.TwitterControl = TwitterControl;
});
