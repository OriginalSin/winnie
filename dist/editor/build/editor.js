var nsGmx = nsGmx || {};nsGmx.Templates = nsGmx.Templates || {};nsGmx.Templates.Editor = {};
nsGmx.Templates.Editor["saveDialog"] = "<div class=\"editor-dialog editor-saveDialog ui-widget\">\n" +
    "    {{#if permalink}}\n" +
    "        <div class=\"gmx-table editor-dialog-row editor-dialog-row_bottom\">\n" +
    "            <div class=\"gmx-table-cell editor-saveDialog-permalinkCell\">\n" +
    "                <input class=\"gmx-input-text gmx-input-text_maxwidth\" value=\"{{permalink}}\" />\n" +
    "            </div>\n" +
    "            <div class=\"gmx-table-cell editor-saveDialog-openIconCell\">\n" +
    "                <a href=\"{{permalink}}\" target=\"_blank\"><i class=\"icon-link-ext-alt\"></i></a>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    {{else}}\n" +
    "        creating permalink..\n" +
    "    {{/if}}\n" +
    "</div>";
nsGmx.Templates.Editor["wizard"] = "<div class=\"configWizard\">\n" +
    "    <div class=\"configWizard-content\">\n" +
    "        <div class=\"configWizard-title\">Config Wizard</div>\n" +
    "        <div class=\"configWizard-control configWizard-apptypeSwitch\"></div>\n" +
    "        <a class=\"configWizard-galleryLink\" href=\"gallery.html\" target=\"_blank\">gallery</a>\n" +
    "    </div>\n" +
    "</div>";
nsGmx.Templates.Editor["apptypeSwitch"] = "<ul class=\"configWizard-contol apptypeSwitch\">\n" +
    "    <li class=\"apptypeSwitch-button apptypeSwitch-button_mapApp\" data-apptype=\"map\">\n" +
    "        <div class=\"apptypeSwitch-buttonImageBackground\"><div class=\"apptypeSwitch-buttonImage\"></div></div>\n" +
    "        <div class=\"apptypeSwitch-buttonTitle\">Empty map</div>\n" +
    "    </li>\n" +
    "    <li class=\"apptypeSwitch-button apptypeSwitch-button_storytellingApp\" data-apptype=\"storytelling\">\n" +
    "        <div class=\"apptypeSwitch-buttonImageBackground\"><div class=\"apptypeSwitch-buttonImage\"></div></div>\n" +
    "        <div class=\"apptypeSwitch-buttonTitle\">Storytelling app</div>\n" +
    "    </li>\n" +
    "    <li class=\"apptypeSwitch-button apptypeSwitch-button_sidebarApp\" data-apptype=\"sidebar\">\n" +
    "        <div class=\"apptypeSwitch-buttonImageBackground\"><div class=\"apptypeSwitch-buttonImage\"></div></div>\n" +
    "        <div class=\"apptypeSwitch-buttonTitle\">Sidebar app</div>\n" +
    "    </li>\n" +
    "</ul>";;
(function() {
    function jsonIsValid(json) {
        try {
            JSON.parse(json);
            return true;
        } catch (e) {
            return false;
        }
    }

    function cloneDeep(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    var ConfigModel = Backbone.Model.extend({
        initialize: function(cfg, extension) {
            this.extension = extension || {};
            this.setValue(cfg);
        },
        setValue: function(val) {
            this.set('value', $.extend(true, val, this.extension));
        },
        setValueSafe: function(value, protectedVariables) {
            var oldValue = this.getValue();
            var vars = {};

            protectedVariables.map(function(variable) {
                vars[variable] = getVariable(variable, oldValue);
            });

            this.setValue(value);

            var newValue = this.getValue();
            protectedVariables.map(function(variable) {
                setVariable(vars[variable], variable, newValue)
            });

            this.trigger('change');

            function getVariable(n, o) {
                return n.split('.').reduce(function(p, c) {
                    return p[c];
                }, o);
            }

            function setVariable(v, n, o) {
                var a = n.split('.');
                while (a.length > 1) {
                    o = o[a.shift()];
                }
                o[a[0]] = v;
            }
        },
        getValue: function() {
            return this.get('value');
        },
        getVisibleValue: function() {
            return this.get('value');
        },
        _setProperties: function(obj, props) {
            var val = {};
            for (var i = 0; i < props.length; i++) {
                obj[props[i]] && (val[props[i]] = obj[props[i]]);
            }
        }
    });

    var AppConfigModel = ConfigModel.extend({
        setValue: function(val) {
            ConfigModel.prototype.setValue.call(this, _.pick(val, 'app', 'layers', 'user'));
        },
        getVisibleValue: function() {
            var value = JSON.parse(JSON.stringify(this.getValue()));
            if (value && value.app && value.app.gmxMap && value.app.gmxMap.apiKey) {
                delete value.app.gmxMap.apiKey;
            }
            return value;
        }
    });

    var StateConfigModel = ConfigModel.extend({
        setValue: function(val) {
            ConfigModel.prototype.setValue.call(this, _.pick(val, 'state'));
        }
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

    cm.define('winnieConfig', [], function(cm, cb) {
        $.ajax('resources/winnieConfig.json').then(function(cfg) {
            cb(cfg);
        }, function() {
            cb(false);
        });
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

    cm.define('defaultConfig', [], function(cm, cb) {
        $.ajax('resources/defaultMapConfig.json').then(function(cfg) {
            cb(cfg);
        }, function() {
            cb({});
        });
    });

    cm.define('mapsResourceServer', [], function() {
        return nsGmx.Auth.getResourceServer('geomixer');
    });

    cm.define('authManager', ['mapsResourceServer'], function() {
        return nsGmx.Auth.getAuthManager();
    });

    cm.define('layoutManager', [], function(cm, cb) {
        $(document).ready(function() {
            var $rootContainer = $('.editor');
            var $sidebarContainer = $('<div>').addClass('editor-sidebarContainer').appendTo($rootContainer);
            var $viewerContainer = $('<div>').addClass('editor-viewerContainer').appendTo($rootContainer);
            var $wizardContainer = $('<div>').addClass('editor-wizardContainer').appendTo($rootContainer);

            $sidebarContainer.on('transitionend', function(je) {
                if (je.originalEvent.propertyName === 'width') {
                    if ($sidebarContainer.hasClass('editor_sidebarExpanded')) {
                        $viewerContainer.addClass('editor_sidebarExpanded');
                        lm.trigger('sidebarchange', true);
                    }
                }
            });

            var lm = _.extend({
                getRootContainer: function() {
                    return $rootContainer;
                },
                getSidebarContainer: function() {
                    return $sidebarContainer.show();
                },
                getViewerContainer: function() {
                    return $viewerContainer.show();
                },
                expandSidebar: function() {
                    $sidebarContainer.addClass('editor_sidebarExpanded');
                },
                collapseSidebar: function() {
                    $sidebarContainer.removeClass('editor_sidebarExpanded');
                    $viewerContainer.removeClass('editor_sidebarExpanded');
                    this.trigger('sidebarchange', false);
                },
                toggleSidebar: function() {
                    if ($sidebarContainer.hasClass('editor_sidebarExpanded')) {
                        this.collapseSidebar();
                        return false;
                    } else {
                        this.expandSidebar();
                        return true;
                    }
                },
                getSidebarState: function() {
                    return $sidebarContainer.hasClass('editor_sidebarExpanded');
                },
                getWizardContainer: function() {
                    return $wizardContainer;
                }
            }, Backbone.Events);

            cb(lm);
        })
    });

    cm.define('appConfigModel', ['permalinkConfig', 'defaultConfig', 'winnieConfig'], function(cm) {
        var permalinkConfig = cm.get('permalinkConfig');
        var defaultConfig = cm.get('defaultConfig');
        var winnieConfig = cm.get('winnieConfig');

        return new AppConfigModel(
            _.isEmpty(permalinkConfig) ? defaultConfig : permalinkConfig,
            nsGmx.Utils.getMirrorExtension(winnieConfig.appMirrors)
        );
    });

    cm.define('stateConfigModel', ['permalinkConfig', 'defaultConfig'], function() {
        var permalinkConfig = cm.get('permalinkConfig');
        var defaultConfig = cm.get('defaultConfig');
        return new StateConfigModel(_.isEmpty(permalinkConfig) ? defaultConfig : permalinkConfig);
    });

    cm.define('viewer', ['layoutManager', 'appConfigModel', 'stateConfigModel'], function(cm) {
        var layoutManager = cm.get('layoutManager');
        var appConfigModel = cm.get('appConfigModel');
        var stateConfigModel = cm.get('stateConfigModel');

        var Viewer = L.Class.extend({
            includes: L.Evented ? L.Evented.prototype : L.Mixin.Events,
            initialize: function(options) {
                L.setOptions(this, options);
                this._vcm = null;

                this.options.appConfigModel.on('change', this.update.bind(this));
                this.options.stateConfigModel.on('change', this.update.bind(this));
                this.update();

                this.options.layoutManager.on('sidebarchange', function(isExpanded) {
                    this._vcm.get('map').invalidateSize();
                }.bind(this));
            },
            update: function() {
                if (this._changing) {
                    return;
                }
                var cfg = _.extend({}, this.options.appConfigModel.getValue(), this.options.stateConfigModel.getValue());
                this.options.container.innerHTML = '';
                var mapContainerEl = L.DomUtil.create('div', 'editor-viewerContainer', this.options.container);
                this._vcm = null;
                var vcm = nsGmx.createGmxApplication(mapContainerEl, cfg);
                vcm.create().then(function() {
                    console.log('test');
                    this._vcm = vcm;
                    this.fire('created');
                    this._bindUpdatingEvents();
                    this.options.layoutManager.expandSidebar();
                }.bind(this));
            },
            getCm: function() {
                return $.Deferred(function(def) {
                    if (this._vcm) {
                        def.resolve(this._vcm);
                    } else {
                        this.once('created', function() {
                            def.resolve(this._vcm);
                        });
                    }
                }.bind(this)).promise();
            },
            _bindUpdatingEvents: function() {
                this._vcm.get('baseLayersManager').on('baselayeractiveids baselayerchange', this._updateStateConfigModel.bind(
                    this));
                this._vcm.get('layersTree').on('childChange', this._updateStateConfigModel.bind(this));
                this._vcm.get('map').on('dragend zoomend', this._updateStateConfigModel.bind(this));
            },
            _updateStateConfigModel: function() {
                this._changing = true;
                this.options.stateConfigModel.setValue({
                    state: this._vcm.get('permalinkManager').serialize().components
                });
                this._changing = false;
            }
        });

        return new Viewer({
            container: layoutManager.getViewerContainer()[0],
            layoutManager: layoutManager,
            appConfigModel: appConfigModel,
            stateConfigModel: stateConfigModel
        });
    });

    cm.define('sidebarPanel', ['layoutManager'], function() {
        var $container = cm.get('layoutManager').getSidebarContainer();
        var $sidebarPanel = $('<div>').addClass('sidebarPanel').appendTo($container);
        var $toolbarContainer = $('<div>').addClass('sidebarPanel-toolbarContainer').appendTo($sidebarPanel);
        var $codeEditorContainer = $('<div>').addClass('sidebarPanel-codeEditorContainer').appendTo($sidebarPanel);
        return {
            getToolbarContainer: function() {
                return $toolbarContainer;
            },
            getCodeEditorContainer: function() {
                return $codeEditorContainer;
            }
        }
    });

    cm.define('codeEditor', ['appConfigModel', 'sidebarPanel', 'layoutManager', 'viewer'], function(cm) {
        return new(L.Class.extend({
            initialize: function(options) {
                L.setOptions(this, options);
                var $aceContainer = $('<div>')
                    .css('position', 'relative')
                    .css('width', '100%')
                    .css('height', '100%')
                    .appendTo(this.options.container);
                var aceEditor = this._codeEditor = ace.edit($aceContainer.get(0));
                aceEditor.setTheme("ace/theme/chrome");
                aceEditor.getSession().setMode("ace/mode/json");
                aceEditor.setValue(JSON.stringify(this.options.appConfigModel.getVisibleValue(), null, '    '));
                aceEditor.selection.clearSelection();

                this.options.layoutManager.on('sidebarchange', function(expanded) {
                    aceEditor.resize();
                });
                this.options.appConfigModel.on('change', function() {
                    aceEditor.setValue(JSON.stringify(this.options.appConfigModel.getVisibleValue(), null, '    '));
                    aceEditor.selection.clearSelection();
                }.bind(this));
            },
            updateModel: function() {
                if (jsonIsValid(this._codeEditor.getValue())) {
                    this.options.appConfigModel.setValue(JSON.parse(this._codeEditor.getValue()));
                } else {
                    console.log('invalid json');
                }
            }
        }))({
            viewer: cm.get('viewer'),
            appConfigModel: cm.get('appConfigModel'),
            layoutManager: cm.get('layoutManager'),
            container: cm.get('sidebarPanel').getCodeEditorContainer(),
        });
    });

    cm.define('toolbar', ['sidebarPanel'], function(cm) {
        var $container = cm.get('sidebarPanel').getToolbarContainer();
        var dropdownMenuWidget = new nsGmx.DropdownMenuWidget({
            items: [{
                title: 'Refresh',
                id: 'btn-refresh',
                fonticon: 'icon-refresh'
            }, {
                title: 'Share',
                id: 'btn-save',
                fonticon: 'icon-link'
            }, {
                title: 'Wizard',
                id: 'btn-wizard',
                fonticon: 'icon-magic'
            }]
        });
        dropdownMenuWidget.appendTo($container);
        return dropdownMenuWidget;
    });

    cm.define('shareButton', ['toolbar', 'appConfigModel', 'mapsResourceServer', 'viewer', 'winnieConfig'], function(cm) {
        var viewer = cm.get('viewer');
        var winnieConfig = cm.get('winnieConfig');
        var appConfigModel = cm.get('appConfigModel');
        var stateConfigModel = cm.get('stateConfigModel');
        var mapsResourceServer = cm.get('mapsResourceServer');

        var shareDialogContainer = $('<div>').addClass('shareDialogContainer');

        var shareDialog = new nsGmx.ShareIconControl.ShareDialog({
            permalinkUrlTemplate: '{{origin}}viewer.html?config={{permalinkId}}',
            embeddedUrlTemplate: '{{origin}}viewer.html{{#if permlalinkId}}?config={{permlalinkId}}{{/if}}',
            previewUrlTemplate: '{{origin}}iframePreview.html?width={{width}}&height={{height}}&url={{{embeddedUrl}}}',
            embedCodeTemplate: '<iframe src="{{{embeddedUrl}}}" width="{{width}}" height="{{height}}"></iframe>',
            showPermalinkCheckbox: false
        });

        shareDialog.appendTo(shareDialogContainer);

        $('#btn-save').popover({
            content: shareDialogContainer[0],
            container: 'body',
            placement: 'bottom',
            html: true
        });

        $('#btn-save').on('shown.bs.popover', function() {
            if (appConfigModel.getValue()) {
                viewer.getCm().then(function(vcm) {
                    var cfg = _.extend({}, appConfigModel.getValue(), stateConfigModel.getValue());
                    mapsResourceServer.sendPostRequest('TinyReference/Create.ashx', {
                        content: JSON.stringify(cfg)
                    }).then(function(response) {
                        shareDialog.model.set('permalinkId', response.Result);
                    }).fail(function() {
                        shareDialog.model.set('error', 'unknown error');
                    });
                });
            } else {
                shareDialog.model.set('error', 'invalid json');
            }
        });

        $('#btn-save').on('hide.bs.popover', function() {
            $('#popover-save').empty();
        });
        return $('#btn-save');
    });

    cm.define('refreshButton', ['toolbar', 'codeEditor', 'appConfigModel'], function() {
        var appConfigModel = cm.get('appConfigModel');
        var codeEditor = cm.get('codeEditor');
        $('#btn-refresh').click(function(je) {
            codeEditor.updateModel();
        });
        return $('#btn-refresh');
    });

    cm.define('collapseButton', ['layoutManager'], function() {
        var layoutManager = cm.get('layoutManager');
        var $container = layoutManager.getRootContainer();
        var $collapseButton = $('<div>').addClass('editor-collapseButton').appendTo($container);
        $collapseButton.click(function() {
            layoutManager.toggleSidebar();
        });
        var updateButton = function(sidebarIsExpanded) {
            $collapseButton.toggleClass('icon-angle-left', sidebarIsExpanded);
            $collapseButton.toggleClass('icon-angle-right', !sidebarIsExpanded);
        };
        layoutManager.on('sidebarchange', updateButton);
        updateButton(layoutManager.getSidebarState());
        return $collapseButton;
    });

    cm.define('wizardButton', ['toolbar', 'layoutManager'], function() {
        var layoutManager = cm.get('layoutManager');
        var $btn = $('#btn-wizard');
        $btn.click(function() {
            layoutManager.getWizardContainer().show();
        });
        return $btn;
    });

    cm.define('configWizard', ['permalinkConfig', 'appConfigModel', 'layoutManager', 'winnieConfig', 'viewer'], function(cm, cb) {
        var permalinkConfig = cm.get('permalinkConfig');
        var appConfigModel = cm.get('appConfigModel');
        var layoutManager = cm.get('layoutManager');
        var winnieConfig = cm.get('winnieConfig');
        var viewer = cm.get('viewer');

        if (!_.isEmpty(permalinkConfig)) {
            layoutManager.getWizardContainer().hide();
        }

        layoutManager.getWizardContainer().html('loading..');
        layoutManager.getWizardContainer().addClass('editor-wizardContainer_loading');
        viewer.getCm().then(function() {
            var configWizard = new nsGmx.ConfigWizard();
            layoutManager.getWizardContainer().empty();
            layoutManager.getWizardContainer().removeClass('editor-wizardContainer_loading');
            configWizard.appendTo(layoutManager.getWizardContainer());

            configWizard.on('configchange', function(cfg) {
                if (winnieConfig.wizard && winnieConfig.wizard.protectVariables) {
                    appConfigModel.setValueSafe(cfg, winnieConfig.wizard.protectVariables);
                } else {
                    appConfigModel.setValue(cfg);
                }
                layoutManager.getWizardContainer().hide();
            });
            cb(configWizard);
        });
    });

    cm.define('globals', ['appConfigModel', 'stateConfigModel', 'viewer'], function(cm) {
        window.acm = cm.get('appConfigModel');
        window.scm = cm.get('stateConfigModel');
        window.lm = cm.get('layoutManager');

        cm.get('viewer').on('created', updateViewerGlobals);
        updateViewerGlobals();

        return null;

        function updateViewerGlobals() {
            cm.get('viewer').getCm().then(function(cm) {
                var macm = window.macm = cm;
                window.lt = macm.get('layersTree');
            });
        }
    });

    cm.create();
})();
;
var nsGmx = nsGmx || {};
nsGmx.ConfigWizard = (function() {
    var mousetoggle = function(el, className) {
        $(el).on('mouseenter', function() {
            $(this).addClass(className);
        }).on('mouseleave', function() {
            $(this).removeClass(className);
        });
    };

    var ApptypeSwitch = function() {
        this._view = $(nsGmx.Templates.Editor.apptypeSwitch);
        mousetoggle(this._view, 'apptypeSwitch_hovered');
        mousetoggle(this._view.find('.apptypeSwitch-button'), 'apptypeSwitch-button_hovered');
        this._view.find('.apptypeSwitch-button').on('click', function(je) {
            this._view.find('.apptypeSwitch-button').removeClass('apptypeSwitch-button_active');
            $(je.currentTarget).addClass('apptypeSwitch-button_active');
            this.trigger('switch', $(je.currentTarget).attr('data-apptype'));
        }.bind(this));
    };

    ApptypeSwitch.prototype = Backbone.Events;

    ApptypeSwitch.prototype.appendTo = function(container) {
        this._view.appendTo(container);
    };

    var ConfigWizard = function() {
        this._view = $(nsGmx.Templates.Editor.wizard);
        this._configTemplates = {};
        this._apptypeSwitch = new ApptypeSwitch();
        this._apptypeSwitch.appendTo(this._view.find('.configWizard-apptypeSwitch'))
        this._apptypeSwitch.on('switch', function(apptype) {
            this.trigger('configchange', nsGmx.ConfigTemplates[apptype]);
        }.bind(this));
    };

    ConfigWizard.prototype = Backbone.Events;

    ConfigWizard.prototype.appendTo = function(container) {
        this._view.appendTo(container);
    };

    return ConfigWizard;
})();
;
var nsGmx = nsGmx || {};

nsGmx.ConfigTemplates = {};

nsGmx.ConfigTemplates.map = {
    app: {
        gmxMap: {
            mapID: 'DA2C1A3C05704A5F850F397AFED5CECE',
            apiKey: 'W4IH6K7CJ4'
        },
        zoomControl: true,
        hideControl: true,
        centerControl: {
            color: '#121212'
        }
    }
};

nsGmx.ConfigTemplates.sidebar = {
    app: {
        gmxMap: {
            mapID: 'DA2C1A3C05704A5F850F397AFED5CECE',
            apiKey: 'W4IH6K7CJ4'
        },
        zoomControl: true,
        hideControl: true,
        centerControl: {
            color: '#121212'
        },
        layersTreeWidget: {
			showInfoIcon: true,
			showLegendIcon: true,
			showDebugIcon: false,
			showCenterIcon: false
		}
    }
};

nsGmx.ConfigTemplates.storytelling = {
    app: {
        gmxMap: {
            mapID: 'DA2C1A3C05704A5F850F397AFED5CECE',
            apiKey: 'W4IH6K7CJ4'
        },
        zoomControl: false,
        hideControl: false,
        centerControl: false,
        baseLayersControl: false,
        storytellingWidget: {}
    }
};;