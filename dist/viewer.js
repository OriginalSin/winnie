(function () {
    var addImageOverlayPaneMixin = function(BaseClass) {
        return BaseClass.extend({
            options: {
                opacity: 1,
                pane: 'tilePane'
            },
            onAdd: function (map) {
                this._map = map;

                if (!this._image) {
                    this._initImage();
                }

                var pane = map._panes[this.options.pane || 'overlayPane'];
                pane.appendChild(this._image);

                map
                    .on('viewreset', this._reset, this);

                if (map.options.zoomAnimation && L.Browser.any3d) {
                    map.on('zoomanim', this._animateZoom, this);
                }

                this._reset();
            },

            onRemove: function (map) {
                if (this._image && this._image.parentNode) {
                    this._image.parentNode.removeChild(this._image);
                }

                map.off('viewreset', this._reset, this);

                if (map.options.zoomAnimation) {
                    map.off('zoomanim', this._animateZoom, this);
                }
            },
            setZIndex: function (zIndex) {
                this.options.zIndex = zIndex;
                this._updateZIndex();

                return this;
            },
            _updateZIndex: function () {
                if (this._image && this.options.zIndex !== undefined) {
                    this._image.style.zIndex = this.options.zIndex;
                }
            },
            bringToFront: function () {
                if (this._image && this._image.parentNode) {
                    var pane = this._image.parentNode;
                    pane.appendChild(this._image);
                    this._setAutoZIndex(pane, Math.max);
                }
                return this;
            },

            bringToBack: function () {
                if (this._image) {
                    var pane = this._image.parentNode;
                    pane.insertBefore(this._image, pane.firstChild);
                    this._setAutoZIndex(pane, Math.min);
                }
                return this;
            },

            _loadend: function () {
                if ('loaderStatus' in L.gmxUtil) {
                    L.gmxUtil.loaderStatus(this._url, true);
                }
            },

            _onImageLoad: function () {
                this.fire('load');
                this._loadend();
            },

            _initImage: function () {
                L.ImageOverlay.prototype._initImage.call(this);
                if ('loaderStatus' in L.gmxUtil) {
                    if (this._url) { L.gmxUtil.loaderStatus(this._url); }
                    this._image.onerror = L.bind(this._loadend, this);
                }
            }
        });
    };
    L.ImageOverlay.Pane = addImageOverlayPaneMixin(L.ImageOverlay);

    L.imageOverlay.pane = function (imageUrl, bounds, options) {
      return new L.ImageOverlay.Pane(imageUrl, bounds, options);
    };

    if (window.gmxCore) {
        gmxCore.addModule('L.ImageOverlay.Pane', function() {
            return L.ImageOverlay.Pane;
        });
    }
})();

var nsGmx = nsGmx || {};
nsGmx.Utils = nsGmx.Utils || {};

nsGmx.Utils.getMirrorExtension = function(mirrors) {
    for (var mirror in mirrors) {
        if (
            mirrors.hasOwnProperty(mirror) &&
            window.location.host.indexOf(mirror) !== -1
        ) {
            return mirrors[mirror];
        }
    }
    return {};
};

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
