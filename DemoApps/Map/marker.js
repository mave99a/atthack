/**
 * Marker library
 * 
 * Markers for a vehicle in seven colors, each having 8 directions (N, NE, E, SE, S, SW, W, NW)
 * 
 * 
 */
var gm = gm || {};
gm.map = gm.map || {};
gm.map.marker = gm.map.marker || {};


/**
 * Creates the follow objects in the gm.map.marker package:
 * 
 * - markers: object map of color->direction map of markers. See loadMarkerImages().
 * - colors: all the colors of markers we provide. KF: only black and orange for this demo.
 * - directions: the 8 cardinal directions.
 * - anchorPoint: the standard anchor point of all the markers.
 */
gm.map.marker.initMarkers = function() {
	var m = gm.map.marker;
	
	m.markers = {};
	// KF: for this demo we'll only use the black and orange markers, removed other images to keep app small.
	m.colors = ["black", "orange" /*,"blue", "red", "green",  "purple"*/];
	m.directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
	m.anchorPoint = new google.maps.Point(24, 24);
	
	for (var i in m.colors) {
		var color = m.colors[i];
		m.markers[color] = m.loadMarkerImages(color);
	}
};


/**
 * Returns CSS that transforms the icon based on the actual rotation of the vehicle.
 * 
 * This only works on devices that support CSS rotations... which sadly the radio does
 * not yet support.
 */
gm.map.marker.getMarkerRotationCSSForHeading = function(heading) {
	rot = "rotate(" + heading + ");";
	return "-webkit-transform: " + rot + " transform: " + rot;
};

/**
 * Return a marker image object from the cache for the given color and
 * heading (0 - 360 compass degrees).
 */
gm.map.marker.getMarkerImageForHeading = function (color, heading) {
	var m = gm.map.marker;
	var dir = m.getDirectionForHeading(heading);
	
	return m.markers[color][dir];
};

/**
 * Returns a direction label ("N", "NE", "E", etc.) given a particular heading.
 * 
 * Ranges are (-22.5, +22.5] degrees from that particular orientation.
 */
gm.map.marker.getDirectionForHeading = function (heading) {
	var DEG = 22.5;
	
	// Break at 45 degrees, or +/- 22.5 on the indicator.
	if (heading < DEG) return "N";
	if (heading >= (DEG*1 ) && heading < (DEG*3 )) return "NE";
	if (heading >= (DEG*3 ) && heading < (DEG*5 )) return "E";
	if (heading >= (DEG*5 ) && heading < (DEG*7 )) return "SE";
	if (heading >= (DEG*7 ) && heading < (DEG*9 )) return "S";
	if (heading >= (DEG*9 ) && heading < (DEG*11)) return "SW";
	if (heading >= (DEG*11) && heading < (DEG*13)) return "W";
	if (heading >= (DEG*13) && heading < (DEG*15)) return "NW";
	//if (heading >= (DEG*15)) return "N";
	return "N"; // fallback, or DEG*15
};

/**
 * Returns an object map of direction => a google.maps.MarkerImage() for the given color.
 * 
 * Each MarkerImage is assigned correct image and anchor point.
 * 
 * For example:
 * loadMarkerImages("black") returns:
 * 
 * {
 *   "N"  : google.maps.MarkerImage("images/locator/black/N.png", ...),
 *   "NE" : google.maps.MarkerImage("images/locator/black/NE.png", ...),
 *   "E"  : google.maps.MarkerImage("images/locator/black/E.png", ...),
 *   ...
 * }
 * 
 */
gm.map.marker.loadMarkerImages = function (color) {
	var m = gm.map.marker;
	var res = {};
	for (var i in m.directions) {
		var dir = m.directions[i];
		res[dir] = new google.maps.MarkerImage("images/locator/" + color + "/" + dir + ".png", null, null, m.anchorPoint);
	}
	return res;
};