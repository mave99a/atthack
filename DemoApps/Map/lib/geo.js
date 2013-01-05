/**
 * Geo library
 * 
 * Geographic functions for using GM data with Google and other map service providers.
 */

// Packaging...
if (gm == undefined ) {
    gm = {};
}
if (gm.geo == undefined) {
    gm.geo = {};
}


/**
 * Converts a lat or lon from Arc MS to Degrees.
 */
gm.geo.convertArcMsToDegrees = function(arcMs) {
  return arcMs / 3600000;  
};

/**
 * Converts a lat or lon from Degrees to Arc MS .
 */
gm.geo.convertDegreesToArcMs = function (tms) {
    return tms * 3600000;
};


/**
 * Converts distances from meters to miles. 
 */
gm.geo.convertMetersToMiles = function (meters) {
	// 1 meter = 0.000621371192 miles
	return meters * 0.000621371192;
};

/**
 * Returns a heading between 0 and 360 as an integer. A negative heading is
 * turned into a positive heading. Example:
 *   65 => 65
 *  -20 => 340
 *  -90 => 270
 *  -170 => 190
 *  299 => 299
 *  -135.1223 => 225
 */
gm.geo.compassHeadingInDegrees = function (heading) {
	if (heading < 0) heading += 360;
	return Math.round(heading);
};

/**
 * Convert an array full of {lat, lng} objects to the official
 * google.maps.LatLng objects.
 */
gm.geo.latLngToGoogleLatLng = function(latLngArray) {
	var results = [];
	for (var i in latLngArray) {
		var ll = latLngArray[i];
		results.push(new google.maps.LatLng(ll.lat, ll.lng));
	}
	
	return results;
};


/**
 * Convert a lat/lng number to a precision of meters. This reduces the
 * amount of data sent over a wire when sending loads of lat/lon data. 
 * This can reduce tranmission size by as much as 30% in some cases.
 */
gm.geo.precisionOfMeters = function (num) {
	return (new Number(num)).toFixed(5);
};


/**
 * Returns a google.maps.LatLngBound() representing the tight box of all
 * locations supplied in the given array. This is useful for Map.fitBounds() 
 * or Map.panToBounds() for example.
 */
gm.geo.getLatLngBoundsFromLocations = function (locs) {
	var sw = {lat: locs[0].lat, lng: locs[0].lng};
	var ne = {lat: locs[0].lat, lng: locs[0].lng};
	
	for (var i=1; i < locs.length; i++) {
		var loc = locs[i];
		if (loc.lat < sw.lat) sw.lat = loc.lat;
		if (loc.lat > ne.lat) ne.lat = loc.lat;
		if (loc.lng < sw.lng) sw.lng = loc.lng;
		if (loc.lng > ne.lng) ne.lng = loc.lng;
	}
	
	return new google.maps.LatLngBounds(new google.maps.LatLng(sw.lat, sw.lng), new google.maps.LatLng(ne.lat, ne.lng));
};

/**
 * Pass a google.maps.LatLng, calls the successFunc with the data returned. 
 * 
 * See:  https://developers.google.com/maps/documentation/geocoding/#ReverseGeocoding
 */
gm.geo.reverseGeocodeFromGoogle = function(latLng, successFunc) {
	var url="http://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{lng}&sensor=false";
	
	url = url.replace("{lat}", latLng.lat).replace("{lng}", latLng.lng);
	$.get(url, successFunc);
};


/**
 * Helper function for reverseGeocodeFromGoogle - finds the type of address component
 * in the address list. 
 * 
 * @param addr Address object returned from reverseGeocodeFromGoogle
 * @param type The type of address element to find.
 * @param preferShortCode Prefer to retrieve the short code, otherwise will prefer the long code.
 * @returns The value of the address element, either short code or long code.
 */
function findAddressComponentType(addr, type, preferShortCode) {
	for (var i in addr) {
		var e = addr[i];
		var yes = false;
		
		for (var j in e.types) {
			var t = e.types[j];
			if (type == t) {
				yes = true;
				break;
			}
		}
		
		// This element contains my address element.
		if (yes) {
			if (preferShortCode) {
				if (e["short_name"]) return e["short_name"];
				if (e["long_name"]) return e["long_name"];
			}
			else {
				if (e["long_name"]) return e["long_name"];
				if (e["short_name"]) return e["short_name"];
			}
			break;
		}
	}
	
	return null;
};

