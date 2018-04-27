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
};