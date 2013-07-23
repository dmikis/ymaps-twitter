/** @module twitter-search */

/**
 * Load tweets from Twitter's Search API.
 *
 * @see https://dev.twitter.com/docs/api/1/get/search
 * @function
 * @param {String} query Search query.
 * @param {String} geocode `geocode` API param's value.
 * @param {Function} callback Function to be executed when tweets loaded.
 * @param {Object} [options] Options.
 * @param {Object} [options.callbackCtx = window] Callback's execution context.
 * @param {Boolean} [options.tweetsWithGeoInfoOnly] If `true` only tweets with geo
 *      information will be passed to the callback.
 * @param {String} [options.twitterSearchURL] Twitter's Search API URL template.
 * @param {Number} [options.resultsNum = 100] Number of tweets to be loaded.
 * @returns {Object} Hash with `abort` method.
 */
module.exports = function (query, geocode, callback, options) {
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

    return require('./utils/jsonp')(url, function (data) {
        callback.call(
            options.callbackCtx,
            options.tweetsWithGeoInfoOnly ?
                data.results
                    .filter(function (tweet) {
                        return !!tweet.geo;
                    }) :
                data.results);
    });
};
