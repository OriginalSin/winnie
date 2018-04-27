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
