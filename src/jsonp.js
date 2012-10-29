var HEAD_NODE = document.getElementsByTagName('head')[0];

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
module.exports = function (url, callback, options) {
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
};
