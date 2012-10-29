function getTwitterUserLink(username) {
    return ['<a href="http://www.twitter.com/', username,
        '" target="_blank">@', username, '</a>'].join('');
}

module.exports = ymaps.templateLayoutFactory.createClass([
    '<div class="tweet">',
        '<h3 class="tweet_author">',
            '<img src="$[properties.userpic]" />',
            getTwitterUserLink('$[properties.author]'),
        '</h3>',
        '<div class="tweet_content">$[properties.text]</div>',
        '<div class="tweet_metainfo">$[properties.metaInfo]</div>',
    '</div>'
].join(''));
