ymaps.ready(function () {
    var map = window.map = new ymaps.Map ("map", {
            center: [55.76, 37.64],
            zoom: 7
        });

    map.controls.add(new TwitterControl());
});
