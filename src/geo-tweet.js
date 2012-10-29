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

module.exports = GeoTweet;
