var gulp = require('gulp');
var path = require('path');

var aceEditor = {
    id: 'ace-builds',
    bowerComponent: 'git@github.com:ajaxorg/ace-builds.git',
    distFiles: [
        './src/ace.js',
        './src/worker-json.js',
        './src/mode-json.js',
        './src/theme-chrome.js'
    ]
};

var alertWidget = {
    id: 'AlertWidget',
    srcDir: './external/GMXCommonComponents/AlertWidget',
    distDir: './build',
    build: true
};

var shareIconControl = {
    id: 'ShareIconControl',
    srcDir: './external/GMXCommonComponents/ShareIconControl',
    distDir: 'build',
    build: true
};

var dropdownMenuWidget = {
    id: 'DropdownMenuWidget',
    srcDir: './external/GMXCommonComponents/DropdownMenuWidget',
    distDir: './build',
    build: true
};

var authManager = {
    id: 'AuthManager',
    srcDir: './external/GMXCommonComponents/AuthManager',
    distDir: './build',
    build: true
};

// var coreComponents = [
//     es6Promise,
//     jquery,
//     jqueryui,
//     handlebars,
//     underscore,
//     backbone,
//     thorax,
//     leaflet,
//     leafletActiveArea,
//     markercluster,
//     heatmap,
//     leafletGeomixer,
//     tileLayerMercator,
//     gmxBaseLayersManager,
//     gmxDrawing,
//     gmxControls,
//     layersTree,
//     layersDebugger,
//     commonStyles,
//     popover,
//     translations,
//     iconLayersControl,
//     gmxIconLayers,
//     componentsManager,
//     utils,
//     gmxWidget,
//     animationHelpers,
//     switchingCollectionWidget,
//     sidebar,
//     scrollView,
//     layersTreeWidget,
//     dateInterval,
//     calendarWidget,
//     bookmarksWidget,
//     storytellingControl,
//     storytellingAccordeonControl,
//     stateManager,
//     winnieCore
// ];

var virtualLayers = [
// {
    // id: 'GmxVirtualTileLayer',
    // srcDir: './external/GMXCommonComponents/GmxVirtualTileLayer',
    // build: false
// },
 // {
    // id: 'leaflet-GIBS',
    // srcDir: './external/leaflet-GIBS',
    // distFiles: [
        // './src/GeoMixerGIBSLayer.js',
        // './src/GIBSLayer.js',
        // './src/GIBSMetadata.js'
    // ],
    // build: false
// },
 // {
    // id: 'GMXPluginGFW',
    // srcDir: './external/GMXPluginGFW',
    // distFiles: [
        // './src/L.GFWLayer.js',
        // './src/L.GFWSlider.js',
        // './src/L.GFWSlider.css',
        // './src/GmxGFWLayer.js'
    // ],
    // build: false
// },
 {
    id: 'L.ImageOverlay.Pane',
    srcDir: './external/L.ImageOverlay.Pane',
    distDir: './src',
    build: false
// },
 // {
    // id: 'GMXPluginCadatsre',
    // srcDir: './external/GMXPluginCadatsre',
    // distFiles: [
        // './GmxCadastreLayer.js',
        // './L.Cadastre/src/L.Cadastre.js',
        // './L.Cadastre/src/L.Cadastre.css',
        // './L.Cadastre/src/L.Cadastre.Info.js'
    // ],
    // build: false
}];

require('./external/GMXBuilder')(gulp, {
    tempDir: './temp',
    distDir: './dist',
    watchExtensions: ['.js', '.css', '.html', '.less', '.svg'],
    distributionExtensions: ['.js', '.css', '.jpg', '.png', '.eot', '.ttf', '.woff', '.svg']
}, [{
    id: 'viewer',
    htmlfile: 'html/viewer.html',
    components: [].concat(virtualLayers, [{
        id: 'appUtils',
        srcDir: './app/utils',
        build: false
    }, {
        id: 'viewer',
        srcDir: './app/viewer'
    }])
}, {
    id: 'index',
    htmlfile: 'html/index.html',
    components: [].concat(virtualLayers, [
        aceEditor,
        dropdownMenuWidget,
        alertWidget,
        shareIconControl,
        authManager, {
            id: 'appUtils',
            srcDir: './app/utils',
            build: false
        }, {
            id: 'editor',
            srcDir: './app/editor',
            distDir: './build',
            build: true
        }
    ])
}]);
