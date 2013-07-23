ymaps.ready(function () {
    ymaps.behavior.storage.add('dmikis#twitter', require('./behavior'));
    ymaps.layout.storage.add('dmikis#tweet', require('./layout'));

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
    document.getElementsByTagName('head')[0].appendChild(styleNode);
});
