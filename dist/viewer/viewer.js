(function() {
    cm.define('winnieConfig', [], function(cm, cb) {
        $.ajax('resources/winnieConfig.json').then(function(cfg) {
            cb(cfg);
        }, function() {
            cb(false);
        });
    });

    cm.define('urlManager', [], function(cm) {
        var parser = document.createElement('a');
        parser.href = window.location.href;

        var getQueryVariable = function(variable) {
            var query = parser.search.substring(1);
            var vars = query.split('&');
            for (var i = 0; i < vars.length; i++) {
                var pair = vars[i].split('=');
                if (decodeURIComponent(pair[0]) == variable) {
                    return decodeURIComponent(pair[1]);
                }
            }
        };

        return {
            getParam: getQueryVariable
        };
    });

    cm.define('permalinkConfig', ['urlManager'], function(cm, cb) {
        var urlManager = cm.get('urlManager');
        if (urlManager.getParam('config')) {
            var oReq = new XMLHttpRequest();
            oReq.onload = function(e) {
                if (e.currentTarget.readyState === 4 && e.currentTarget.status === 200) {
                    try {
                        var rt = e.currentTarget.response || e.currentTarget.responseText;
                        var jr = JSON.parse(rt.slice(1, -1));
                        var cfg = JSON.parse(jr.Result);
                        cb(cfg);
                    } catch (e) {
                        console.warn('invalid JSON');
                        cb({});
                    }
                }
            };
            oReq.open('get', 'http://maps.kosmosnimki.ru/TinyReference/Get.ashx?id=' + urlManager.getParam('config'), true);
            oReq.send();
        } else {
            return {};
        }
    });

    cm.define('layoutManager', [], function(cm, cb) {
        $(document).ready(function() {
            var mapEl = L.DomUtil.create('div', 'mapContainer', document.body);
            var editButtonEl = L.DomUtil.create('div', 'editButtonContainer', document.body);
            cb({
                getMapContainer: function() {
                    return mapEl;
                },
                getEditButtonContainer: function() {
                    return editButtonEl;
                }
            })
        });
    });

    cm.define('mapApplicationConstructor', ['permalinkConfig', 'layoutManager', 'winnieConfig'], function(cm, cb) {
        var permalinkConfig = cm.get('permalinkConfig');
        var layoutManager = cm.get('layoutManager');
        var winnieConfig = cm.get('winnieConfig');
        var macm = nsGmx.createGmxApplication(layoutManager.getMapContainer(), $.extend(true,
            permalinkConfig,
            nsGmx.Utils.getMirrorExtension(winnieConfig.appMirrors)
        ));
        macm.create().then(function() {
            cb(macm);
        });
    });

    cm.define('editButton', ['mapApplicationConstructor', 'permalinkConfig', 'layoutManager', 'winnieConfig', 'urlManager'], function(cm) {
        var permalinkConfig = cm.get('permalinkConfig');
        var layoutManager = cm.get('layoutManager');
        var winnieConfig = cm.get('winnieConfig');
        var urlManager = cm.get('urlManager');

        if (window !== window.top) {
            return null;
        }

        var editButtonContainerEl = layoutManager.getEditButtonContainer();
        var editButtonEl = L.DomUtil.create('a', 'editButton', editButtonContainerEl);
        editButtonEl.innerHTML = L.gmxLocale.getLanguage() === 'rus' ? 'редактировать' : 'edit';
        editButtonEl.setAttribute('href', winnieConfig.editorUrl + '?config=' + urlManager.getParam('config'));

        return editButtonEl;
    });

    cm.define('globals', ['mapApplicationConstructor'], function() {
        var macm = cm.get('mapApplicationConstructor');
        window.macm = macm;
        window.map = macm.get('map');
        window.cal = macm.get('calendar');
        window.lt = macm.get('layersTree');
        window.lh = macm.get('layersHash');

        return null;
    });

    cm.create();
})();
