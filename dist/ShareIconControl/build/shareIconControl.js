var nsGmx = nsGmx || {};nsGmx.Templates = nsGmx.Templates || {};nsGmx.Templates.ShareIconControl = {};
nsGmx.Templates.ShareIconControl["shareDialog"] = "<div class=\"shareDialog-row shareDialog-title\">\n" +
    "    <span><%= nsGmx.Translations.getText('shareDialog.permalinkBelow') %></span>\n" +
    "    <a class=\"gmx-link gmx-link_icon shareDialog-socialShareLink shareDialog-socialShareLink_twitter\" target=\"_blank\"><i class=\"icon-twitter\"></i></a>\n" +
    "    <a class=\"gmx-link gmx-link_icon shareDialog-socialShareLink shareDialog-socialShareLink_facebook\" target=\"_blank\"><i class=\"icon-facebook\"></i></a>\n" +
    "    <a class=\"gmx-link gmx-link_icon shareDialog-socialShareLink shareDialog-socialShareLink_vk\" target=\"_blank\"><i class=\"icon-vk\"></i></a>\n" +
    "</div>\n" +
    "<div class=\"shareDialog-row\">\n" +
    "    <div class=\"gmx-table\">\n" +
    "        <div class=\"gmx-table-cell shareDialog-permalinkUrlCell\">\n" +
    "            <input class=\"gmx-input-text gmx-input-text_maxwidth gmx-input-text_readonly shareDialog-inputPermalinkUrl\" type=\"text\" readonly=\"readonly\" />\n" +
    "        </div>\n" +
    "        <div class=\"gmx-table-cell shareDialog-permalinkUrlPreviewButtonCell\">\n" +
    "            <a class=\"gmx-link gmx-link_icon shareDialog-permalinkUrlPreviewButton\" target=\"_blank\"><i class=\"icon-link-ext\" title=\"<%= nsGmx.Translations.getText('shareDialog.newWin') %>\"></i></a>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "<div class=\"shareDialog-row shareDialog-title\"><%= nsGmx.Translations.getText('shareDialog.embeddedBelow') %></div>\n" +
    "<div class=\"shareDialog-row\">\n" +
    "    <div class=\"gmx-table shareDialog-resolutionTable\">\n" +
    "        <div class=\"gmx-table-cell shareDialog-previewResolutionCell\">\n" +
    "            <input class=\"gmx-input-text shareDialog-inputIframeWidth\" type=\"text\" value=\"<%= iframeWidth %>\"/>\n" +
    "            <span class=\"shareDialog-resolutionCross\">x</span>\n" +
    "            <input class=\"gmx-input-text shareDialog-inputIframeHeight\" type=\"text\" value=\"<%= iframeHeight %>\" />\n" +
    "        </div>\n" +
    "        <div class=\"gmx-table-cell shareDialog-previewLinkCell ui-state-disabled shareDialog-validationError\">\n" +
    "            <span><%= nsGmx.Translations.getText('shareDialog.preview') %></span><i class=\"icon-link-ext\"></i>\n" +
    "        </div>\n" +
    "        <div class=\"gmx-table-cell shareDialog-previewLinkCell shareDialog-validationOk\">\n" +
    "            <a class=\"shareDialog-previewLink gmx-link\" href=\"#\" target=\"_blank\"><%= nsGmx.Translations.getText('shareDialog.preview') %></a><i class=\"gmx-icon icon-link-ext\"></i>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "<div class=\"shareDialog-row\">\n" +
    "    <textarea class=\"shareDialog-inputEmbedCode gmx-input-text gmx-input-text_maxwidth gmx-input-text_readonly shareDialog-validationOk\" readonly=\"readonly\">\n" +
    "        <%= embedCode %>\n" +
    "    </textarea>\n" +
    "    <div class=\"shareDialog-validationError shareDialog-validationErrorView\"></div>\n" +
    "</div>\n" +
    "<% if (showPermalinkCheckbox) { %>\n" +
    "    <div class=\"shareDialog-row\">\n" +
    "        <input type=\"checkbox\" class=\"shareDialog-includePermalinkCheckbox\" <% if (includePermalink) { %>checked<% } %>><span class=\"shareDialog-includePermalinkLabel\"><%= nsGmx.Translations.getText('shareDialog.includePermalink') %></span>\n" +
    "    </div>\n" +
    "<% } %>";;
var nsGmx = nsGmx || {};

nsGmx.ShareIconControl = L.Control.gmxIcon.extend({
    options: {
        className: 'shareIcon',
        id: 'permalink-button',
        text: 'Share',
        style: {
            width: 'auto'
        }
    },
    initialize: function(options) {
        L.setOptions(this, L.extend(L.Control.gmxIcon.prototype.options, options));
        L.Control.gmxIcon.prototype.initialize.call(this, this.options);
    },
    onAdd: function(map) {
        this._container = L.Control.gmxIcon.prototype.onAdd.apply(this, arguments);
        this._shareDialogContainer = L.DomUtil.create('div', 'shareDialogContainer');

        $(this._container).popover({
            content: this._shareDialogContainer,
            container: 'body',
            placement: 'bottom',
            html: true
        });

        $(this._container).on('shown.bs.popover', function() {
            var shareDialog = new nsGmx.ShareIconControl.ShareDialog(_.pick(this.options, [
                'permalinkUrlTemplate',
                'embeddedUrlTemplate',
                'previewUrlTemplate',
                'embedCodeTemplate',
                'permalinkManager'
            ]));
            shareDialog.appendTo(this._shareDialogContainer);
        }.bind(this));

        $(this._container).on('hide.bs.popover', function() {
            $(this._shareDialogContainer).empty();
        }.bind(this));

        return this._container;
    }
});;
nsGmx.ShareIconControl.ShareDialogModel = Backbone.Model.extend({
    validate: function(attrs, options) {
        // NaN check
        if (attrs.iframeWidth / 1 !== attrs.iframeWidth / 1) {
            return 'shareDialog.invalidWidth';
        }
        if (attrs.iframeHeight / 1 !== attrs.iframeHeight / 1) {
            return 'shareDialog.invalidHeight';
        }
    }
});

nsGmx.ShareIconControl.ShareDialog = nsGmx.GmxWidget.extend({
    className: 'shareDialog',
    options: {
        permalinkUrlTemplate: '{{origin}}?permalink={{permalinkId}}',
        embeddedUrlTemplate: '{{origin}}embedded.html{{#if permlalinkId}}?permalink={{permlalinkId}}{{/if}}',
        previewUrlTemplate: '{{origin}}iframePreview.html?width={{width}}&height={{height}}&permalinkUrl={{{embeddedUrl}}}',
        embedCodeTemplate: '<iframe src="{{{embeddedUrl}}}" width="{{width}}" height="{{height}}"></iframe>',
        showPermalinkCheckbox: true
    },
    events: function() {
        return {
            'click .shareDialog-inputPermalinkUrl': function(e) {
                e.target.select();
            },
            'click .shareDialog-inputEmbedCode': function(e) {
                e.target.select();
            },
            'input .shareDialog-inputIframeWidth': this._setModelPropertyFn('iframeWidth'),
            'input .shareDialog-inputIframeHeight': this._setModelPropertyFn('iframeHeight'),
            'change .shareDialog-inputIframeWidth': this._setModelPropertyFn('iframeWidth'),
            'change .shareDialog-inputIframeHeight': this._setModelPropertyFn('iframeHeight'),
            'change .shareDialog-includePermalinkCheckbox': function(je) {
                this.model.set('includePermalink', je.currentTarget.checked);
            }
        }
    },
    constructor: function(options) {
        nsGmx.GmxWidget.call(this, _.extend({
            model: new nsGmx.ShareIconControl.ShareDialogModel({
                permalinkId: '',
                includePermalink: true,
                iframeWidth: 800,
                iframeHeight: 600,
                embedCode: '',
                error: ''
            })
        }, options));
    },
    initialize: function(options) {
        this.options = _.extend(this.options, options);
        this._terminateMouseEvents();
        this._permalinkManager = options.permalinkManager;
        this.model.set('permalinkId', '');
        this.model.set('error', '');
        this.model.set('showPermalinkCheckbox', this.options.showPermalinkCheckbox);
        this._permalinkManager && this.createPermalink().then(null, function(err) {
            console.error(err);
        });
    },
    render: function() {
        if (this.model.get('error')) {
            return this._renderError();
        }
        if (!this.model.get('permalinkId')) {
            return this._renderLoader();
        }
        var changed = arguments[0] && arguments[0].changed;
        if (changed && (changed.iframeWidth || changed.iframeHeight)) {
            this._updateFields();
            return this;
        }
        this._renderDialog();
        return this;
    },
    createPermalink: function() {
        return $.Deferred(function(def) {
            this._permalinkManager.save()
                .then(function(permalinkId) {
                    this.model.set('permalinkId', permalinkId);
                    def.resolve();
                }.bind(this), function() {
                    this.model.set('error', 'shareDialog.permalinkError');
                    def.reject();
                }.bind(this))
                .fail(function(err) {
                    console.error(err);
                });
        }.bind(this)).promise();
    },
    appendTo: function() {
        nsGmx.GmxWidget.prototype.appendTo.apply(this, arguments);
        this.model.on('change', this.render, this);
        this.render();
    },
    _setModelPropertyFn: function(property) {
        return function(e) {
            this.model.set(property, $(e.currentTarget).val());
        }
    },
    _renderLoader: function() {
        this.undelegateEvents();
        this.$el.html(nsGmx.Translations.getText('shareDialog.creatingPermalink'));
        return this;
    },
    _renderError: function() {
        this.undelegateEvents();
        this.$el.html(nsGmx.Translations.getText(this.model.get('error')));
        return this;
    },
    _renderDialog: function() {
        this.undelegateEvents();
        this.$el.html(_.template(nsGmx.Templates.ShareIconControl.shareDialog)(this.model.attributes));
        this.errorsView = new nsGmx.AlertWidget();
        this.errorsView.appendTo(this.$('.shareDialog-validationErrorView'));
        this._updateFields();
        this.delegateEvents();
        return this;
    },
    _updateFields: function() {
        var urls = this._generateUrls();
        this.errorsView.clear();
        if (this.model.isValid()) {
            this.$el.find('.shareDialog-validationOk').show();
            this.$el.find('.shareDialog-validationError').hide();
        } else {
            this.errorsView.push(nsGmx.Translations.getText(this.model.validationError), 'error');
            this.$el.find('.shareDialog-validationOk').hide();
            this.$el.find('.shareDialog-validationError').show();
        }
        this.$el.find('.shareDialog-inputPermalinkUrl').val(urls.permalinkUrl);
        this.$el.find('.shareDialog-permalinkUrlPreviewButton').attr('href', urls.permalinkUrl);
        this.$el.find('.shareDialog-previewLink').attr('href', urls.previewUrl);
        this.$el.find('.shareDialog-inputEmbedCode').html(urls.embedCode);

        this.$el.find('.shareDialog-socialShareLink_vk').attr('href', urls.vkShareUrl);
        this.$el.find('.shareDialog-socialShareLink_twitter').attr('href', urls.twitterShareUrl);
        this.$el.find('.shareDialog-socialShareLink_facebook').attr('href', urls.facebookShareUrl);
    },
    _generateUrls: function() {
        var escapeHtml = function(unsafe) {
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        var tpl = Handlebars.compile;
        var urls = {};

        var origin = window.location.protocol + '//' + window.location.host + '/';

        var permalinkUrl = urls.permalinkUrl = tpl(this.options.permalinkUrlTemplate)({
            origin: origin,
            permalinkId: this.model.get('permalinkId')
        });

        var embeddedUrl = urls.embeddedUrl = tpl(this.options.embeddedUrlTemplate)({
            origin: origin,
            permlalinkId: this.model.get('includePermalink') ? this.model.get('permalinkId') : false
        });

        var previewUrl = urls.previewUrl = tpl(this.options.previewUrlTemplate)({
            origin: origin,
            embeddedUrl: escape(embeddedUrl),
            width: this.model.get('iframeWidth'),
            height: this.model.get('iframeHeight')
        });

        var embedCode = urls.embedCode = escapeHtml(tpl(this.options.embedCodeTemplate)({
            embeddedUrl: embeddedUrl,
            width: this.model.get('iframeWidth'),
            height: this.model.get('iframeHeight')
        }));

        var vkShareUrl = urls.vkShareUrl = tpl('http://vkontakte.ru/share.php?url={{urltoshare}}')({
            urltoshare: escape(permalinkUrl)
        });

        var twitterShareUrl = urls.twitterShareUrl = tpl('http://www.twitter.com/share?url={{urltoshare}}')({
            urltoshare: escape(permalinkUrl)
        });

        var facebookShareUrl = urls.facebookShareUrl = tpl('https://www.facebook.com/sharer/sharer.php?u={{urltoshare}}')({
            urltoshare: escape(permalinkUrl)
        });

        return urls;
    }
})
;
nsGmx.Translations.addText('rus', {
    shareDialog: {
        permalinkBelow: 'Ссылка:',
        embeddedBelow: 'Код для вставки:',
        creatingPermalink: 'формирование ссылки..',
        invalidWidth: 'Некорректная ширина фрейма',
        invalidHeight: 'Некорректная высота фрейма',
        newWin: 'открыть в новом окне',
        includePermalink: 'добавить пермалинк',
        preview: 'предпросмотр'
    }
});

nsGmx.Translations.addText('eng', {
    shareDialog: {
        permalinkBelow: 'Share link:',
        embeddedBelow: 'Embed map:',
        creatingPermalink: 'creating permalink..',
        invalidWidth: 'Invalid frame width',
        invalidHeight: 'Invalid frame height',
        newWin: 'open in new window',
        includePermalink: 'include permalink',
        preview: 'preview'
    }
});
;