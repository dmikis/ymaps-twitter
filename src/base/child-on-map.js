var noop = require('../utils/noop');

var BaseChildOnMap = function () {
    this.events = new ymaps.event.Manager({context: this});
    this._parent = null;
};

ymaps.util.extend(BaseChildOnMap.prototype, {

    setParent: function (parent) {
        var oldParent = this._parent;
        if (this._parent !== parent) {
            if (this._parent) {
                this.onRemoveFromParent();
            }
            this._parent = parent;
            if (parent) {
                this.onAddToParent();
                parent.events.add('mapchange', this._onParentMapChange, this);
            }
            this.events.fire('parentchange', new ymaps.Event({
                oldParent: oldParent,
                newParent: this._parent
            }));
        }
    },

    _onParentMapChange: function (event) {
        this.events.fire('mapchange', new ymaps.Event(event));
    },

    getParent: function () {
        return this._parent;
    },

    onAddToParent: noop,

    onRemoveFromParent: noop,

    onAddToMap: noop,

    onRemoveFromMap: noop
});

module.exports = BaseChildOnMap;
