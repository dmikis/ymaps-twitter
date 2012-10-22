ymaps.ready(function () {
    var map = window.map = new ymaps.Map ("map", {
            center: [55.76, 37.64],
            zoom: 7
        });

    map.behaviors.enable('dmikis#twitter');
});
