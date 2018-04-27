var nsGmx = nsGmx || {};nsGmx.Templates = nsGmx.Templates || {};nsGmx.Templates.DropdownMenuWidget = {};
nsGmx.Templates.DropdownMenuWidget["dropdownMenuWidget"] = "<div class=\"dropdownMenuWidget ui-widget\">\n" +
    "    {{#each items}}\n" +
    "    <div class=\"dropdownMenuWidget-item{{#if className}} {{className}}{{/if}}\">\n" +
    "        <a\n" +
    "            {{#if id}}id=\"{{id}}\"{{/if}}\n" +
    "            {{#if link}}href=\"{{link}}\"{{else}}href=\"javascript:void(0)\"{{/if}}\n" +
    "            {{#if newWindow}}{{#if link}}target=\"_blank\"{{/if}}{{/if}}\n" +
    "            class=\"dropdownMenuWidget-itemAnchor{{#if newWindow}} dropdownMenuWidget-itemAnchor_newWindow{{/if}}\"\n" +
    "        >\n" +
    "            {{#if icon}}\n" +
    "                <img src=\"{{icon}}\" />\n" +
    "            {{/if}}\n" +
    "            {{#if fonticon}}\n" +
    "                <i class=\"{{fonticon}}\"></i>\n" +
    "            {{/if}}\n" +
    "            {{#if title}}\n" +
    "                <span>{{title}}</span>\n" +
    "                {{#if dropdown}}<i class=\"icon-angle-down\"></i>{{/if}}\n" +
    "            {{/if}}\n" +
    "        </a>\n" +
    "        {{#if dropdown}}\n" +
    "            <div class=\"dropdownMenuWidget-itemDropdown\">\n" +
    "                <ul class=\"dropdownMenuWidget-dropdownMenu\">\n" +
    "                    {{#each dropdown}}\n" +
    "                        <li class=\"dropdownMenuWidget-dropdownMenuItem{{#if className}} {{className}}{{/if}}\">\n" +
    "                            {{#if newWindow}}<div class=\"ui-icon ui-icon-newwin dropdownMenuWidget-dropdownMenuIcon\"></div>{{/if}}\n" +
    "                            <a\n" +
    "                                {{#if id}}id=\"{{id}}\"{{/if}}\n" +
    "                                {{#if link}}href=\"{{link}}\"{{else}}href=\"javascript:void(0)\"{{/if}}\n" +
    "                                {{#if newWindow}}{{#if link}}target=\"_blank\"{{/if}}{{/if}}\n" +
    "                                class=\"dropdownMenuWidget-dropdownItemAnchor{{#if newWindow}} dropdownMenuWidget-dropdownItemAnchor_newWindow{{/if}}\"\n" +
    "                            >\n" +
    "                                {{#if icon}}\n" +
    "                                    <img src=\"{{icon}}\" />\n" +
    "                                {{/if}}\n" +
    "                                {{#if title}}\n" +
    "                                    <span>{{title}}</span>\n" +
    "                                {{/if}}\n" +
    "                            </a>\n" +
    "                        </li>\n" +
    "                    {{/each}}\n" +
    "                </ul>\n" +
    "            </div>\n" +
    "        {{/if}}\n" +
    "    </div>\n" +
    "    {{/each}}\n" +
    "</div>\n" +
    "";
nsGmx.Templates.DropdownMenuWidget["anchor"] = "<a \n" +
    "    {{#if id}}id=\"{{id}}\"{{/if}}\n" +
    "    {{#if link}}href=\"{{link}}\"{{else}}href=\"javascript:void(0)\"{{/if}}\n" +
    "    {{#if newWindow}}target=\"_blank\" class=\"dropdownMenuWidget-anchor_newWindow\"{{/if}}\n" +
    ">\n" +
    "    {{#if icon}}\n" +
    "        <img src=\"{{icon}}\" />\n" +
    "    {{/if}}\n" +
    "    {{#if title}}\n" +
    "        <span>{{title}}</span>\n" +
    "    {{/if}}\n" +
    "</a>";;
var nsGmx = nsGmx || {};

nsGmx.PlainTextWidget = nsGmx.GmxWidget.extend({
    initialize: function(txt) {
        this.setText(txt);
        this.$el.on('click', function () {
            this.trigger('click')
        }.bind(this));
    },
    getText: function () {
        return this.$el.html();
    },
    setText: function (txt) {
        this.$el.html(txt);
    }
});
;
var nsGmx = nsGmx || {};

// <String>options.title
// <String>options.className
// <String>options.trigger (hover|click|manual)
// <String>options.direction (down|up)
// <Boolean>options.adjustWidth
// <Boolean>options.showTopItem
nsGmx.DropdownWidget = nsGmx.GmxWidget.extend({
    className: 'dropdownWidget dropdownWidget-item',

    options: {
        title: '',
        trigger: 'hover',
        direction: 'down',
        adjustWidth: true,
        showTopItem: true,
        titleClassName: ''
    },

    initialize: function(options) {
        this.options = _.extend(this.options, options);
        this.$titleContainer = $('<div>')
            .addClass('dropdownWidget-dropdownTitle')
            .addClass(options.titleClassName)
            .html(this.options.title)
            .appendTo(this.$el);
        this.$dropdownContainer = $('<div>')
            .addClass('dropdownWidget-dropdown')
            .hide()
            .appendTo(this.$el);
        this.$dropdownTitle = $('<div>')
            .addClass('dropdownWidget-item dropdownWidget-dropdownTitle')
            .addClass(options.titleClassName)
            .html(this.options.title)
            .appendTo(this.$dropdownContainer);

        if (!this.options.showTopItem) {
            this.$dropdownTitle.hide();
        }

        if (this.options.trigger === 'hover') {
            this.$dropdownTitle.addClass('ui-state-disabled');
            this.$titleContainer.on('mouseover', function(je) {
                this.expand();
            }.bind(this));
            this.$dropdownContainer.on('mouseleave', function(je) {
                this.collapse();
            }.bind(this));
        } else if (this.options.trigger === 'click') {
            this.$titleContainer.on('click', function(je) {
                this.expand();
            }.bind(this));
            this.$dropdownTitle.on('click', function(je) {
                this.collapse();
            }.bind(this));
        }

        if (this.options.direction === 'up') {
            this.$el.addClass('dropdownWidget_direction-up');
        } else {
            this.$el.addClass('dropdownWidget_direction-down');
        }

        this._items = {};
    },

    addItem: function(id, inst, position) {
        this._items[id] = inst;
        var $container = $('<div>')
            .addClass('dropdownWidget-item dropdownWidget-dropdownItem')
            .attr('data-id', id)
            .attr('data-position', position)
            .on('click', function(je) {
                this.trigger('item', $(je.currentTarget).attr('data-id'));
                this.trigger('item:' + $(je.currentTarget).attr('data-id'));
                if (this.options.trigger === 'click') {
                    this.collapse();
                }
            }.bind(this));
        $container.append(inst.el);
        this.$dropdownContainer.append($container);
        this._sortItems()
    },

    setTitle: function(title) {
        this.$titleContainer.html(title);
        this.$dropdownTitle.html(title);
    },

    toggle: function() {
        this._expanded ? this.collapse() : this.expand();
        this._expanded = !this._expanded;
    },

    expand: function() {
        this.$dropdownContainer.css('min-width', this.$el.width());
        this.$dropdownContainer.show();
        this.trigger('expand');
    },

    collapse: function() {
        this.$dropdownContainer.hide();
        this.trigger('collapse');
    },

    reset: function() {
        this.collapse();
    },

    _sortItems: function() {
        var containerEl = this.$dropdownContainer[0];
        var items = Array.prototype.slice.call(containerEl.children);

        var titleEl = items.splice(
            items.indexOf($(containerEl).find('.dropdownWidget-dropdownTitle')[0]), 1
        );

        while (items.length) {
            var maxPositionIndex = items.indexOf(_.max(items, function(el) {
                return el.getAttribute('data-position') / 1;
            }));
            $(containerEl).prepend(items.splice(maxPositionIndex, 1)[0]);
        }

        if (this.options.direction === 'up') {
            $(containerEl).append(titleEl);
        } else {
            $(containerEl).prepend(titleEl);
        }
    }
});
;
var nsGmx = nsGmx || {};

nsGmx.DropdownMenuWidget = (function() {
    var DropdownMenuWidget = function(options) {
        var h = Handlebars.create();
        h.registerPartial('anchor', nsGmx.Templates.DropdownMenuWidget.anchor);
        this._view = $(h.compile(nsGmx.Templates.DropdownMenuWidget.dropdownMenuWidget)({
            items: options.items
        }));
        this._view.find('.dropdownMenuWidget-itemDropdown').hide();

        var mouseTimeout = options.mouseTimeout || 100;
        this._view.find('.dropdownMenuWidget-item').each(function(index) {
            var mouseIsOver = false;
            $(this).on('mouseenter', function(je) {
                mouseIsOver = true;
                setTimeout(function() {
                    if (mouseIsOver) {
                        $(je.currentTarget).find('.dropdownMenuWidget-itemDropdown').show();
                    }
                }, 100);
            });
            $(this).on('mouseleave', function(je) {
                mouseIsOver = false;
                $(je.currentTarget).find('.dropdownMenuWidget-itemDropdown').hide();
            });
        });
    };

    DropdownMenuWidget.prototype.appendTo = function(placeholder) {
        $(placeholder).append(this._view);
    };

    return DropdownMenuWidget;
})();;