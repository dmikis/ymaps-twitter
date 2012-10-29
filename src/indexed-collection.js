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

module.exports = IndexedGeoObjectCollection;
