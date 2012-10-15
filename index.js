(function (ymaps, window, undefined) {

    var headNode = document.getElementsByTagName('head')[0];
    function getJSONP(url, callback) {
        var callbackName = 'jsonp_' + Math.floor(1e8 * Math.random()),
            scriptNode = document.createElement('script');

        scriptNode.setAttribute('src', [
            url,
            url.indexOf('?') > 0 ? '&' : '?',
            'callback=',
            callbackName
        ].join(''));
        scriptNode.setAttribute('type', 'text/javascript');

        window[callbackName] = function (data) {
            callback(data);
            delete window[callbackName];
            headNode.removeChild(scriptNode);
        };

        headNode.appendChild(scriptNode);
    }

    function getGeoTweets(ll, radius, callback) {
        var url = ('http://search.twitter.com/search.json?q=&rpp=100&geocode=%c,%rkm')
                .replace('%c', ll.join())
                .replace('%r', radius);

        getJSONP(url, callback);
    }

    function getTwitterUserLink(username) {
        return ['<a href="http://www.twitter.com/', username,
            '" target="_blank">@', username, '</a>'].join('');
    }

    ymaps.ready(function () {
        function IndexedGeoObjectCollection() {
            IndexedGeoObjectCollection.superclass.constructor.apply(this, arguments);
            this._itemsCache = {};
        }

        ymaps.util.augment(IndexedGeoObjectCollection, ymaps.GeoObjectCollection, {

            add: function (item, index) {
                IndexedGeoObjectCollection.superclass.add.call(this, item);
                this._itemsCache[index] = item;
            },

            getByIndex: function (index) {
                return this._itemsCache[index];
            }
        });

        function GeoTweet(tweet) {
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

        var map = window.map = new ymaps.Map ("map", {
                center: [55.76, 37.64],
                zoom: 7
            }),
            tweets = new IndexedGeoObjectCollection();

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

        tweets.options.set({
            balloonContentLayout: 'dmikis#tweet'
        });

        map.geoObjects.add(tweets);


        map.events.add('boundschange', function () {
            getGeoTweets(
                map.getCenter(),
                Math.floor(ymaps.coordSystem.geo.distance(map.getBounds()[0], map.getBounds()[1]) * 5e-4),
                function (data) {
                    console.log(data);
                    data.results.forEach(function (tweet) {
                        if (tweet.geo && !tweets.getByIndex(tweet.id)) {
                            tweets.add(new GeoTweet(tweet), tweet.id);
                        }
                    });
                });
        });
    });
}(ymaps, window));
