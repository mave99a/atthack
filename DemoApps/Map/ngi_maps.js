/**
 * Global error handler that will call the myConsole function if available and suppress
 * error messages. Otherwise will log to the console, if available, and propagate error.
 */
window.onerror = function(msg, url, line) {
	var err = "ERROR: '" + msg + "' @ " + url + ":" + line;
	
	if (myConsole) {
		myConsole(err);
		return true;
	}
	else {
		if (console) console.log(err);
		return false;
	}
};


/**
 * You know what init() does...
 */
function init()
{
	// Required.
	gm.system.init();

	// Custom console for debugging on radio.
	initMyConsole(document);

	// Put our version number into the label and attach my console handler
	// to the version number.
	myConsole("showVersionNumber");
	showVersionNumber();

	// Initializes the pages that we manage.
	// This is very simple for this application as there are only two pages.
	myConsole("initPages");
	initPages();
	
	// Initialize the markers that represent the vehicle
	myConsole("initMarkers");
	gm.map.marker.initMarkers();
	
	// Load the map and setup some events.
	myConsole("initMap");
	initializeMap();
	
	// Add click handlers to our display buttons.
	myConsole("initButtons");
	initButtons();
	
	
	// TEST
	// Use a custom panning strategy for "smoother" panning that
	// won't bog down the radio. 
	// Note: comment out the "dragstart" line if using this custom map panning solution.
	//setupForCustomMapPanning();

	// When the user drags on the map, change our focus so that the it "user" controlled.
	myConsole("add focusOnUser event listener");
    google.maps.event.addListener(map, "dragstart", focusOnUser);

	
	
	// Start by focusing on the vehicle's center.
	myConsole("focusOnVehicle");
	focusOnVehicle();
	
	
	// Start monitoring vehicle information changes.
	myConsole("watchForDestinationChanges");
	watchForDestinationChanges();
	
	// Tire pressure check.
	// KF: removed 1/3/13
	//watchForVehicleDataChanges();
	
	// Once everything is initialized we'll push the screen.
	setTimeout(showMainPage, 300);
}


/**
 * Used for our custom panning technique.
 */
var mousePosX, mousePosY;
var runningOffsetX, runningOffsetY;
var isMouseDownOnMap = false;

/**
 * Custom map panning involves handling mouse events on the map and firing move events
 * periodically, not continually which tends to drag down the radio display.
 */
function setupForCustomMapPanning() {
	map.setOptions({draggable: false});
	var m = $("#theMap");
	m.mousedown(function(evt) {
		if (!isMouseDownOnMap) {
			startMyPan(evt.clientX, evt.clientY);
		}
	});
	m.mouseup(function (evt) {
		if (isMouseDownOnMap) {
			stopMyPan();
		};
	});
	m.mousemove(function (evt) {
		if (isMouseDownOnMap) {
			myPan(evt.clientX, evt.clientY);
		}
	});
	$(document).mouseup(function (evt) {
		if (isMouseDownOnMap) {
			stopMyPan();
		}
	});
}

var intervalID = null;

function startMyPan(x, y) {
	isMouseDownOnMap = true;
	mousePosX = x;
	mousePosY = y;
	runningOffsetX = 0;
	runningOffsetY = 0;
	focusOnUser();
	
	intervalID  = setInterval(function() {
		var dx = runningOffsetX;
		var dy = runningOffsetY;
		runningOffsetX = 0;
		runningOffsetY = 0;
		map.panBy(dx, dy);
		if (!isMouseDownOnMap && intervalID) {
			clearInterval(intervalID);
			intervalID = null;
		}
	}, 500);
}
function stopMyPan() {
	if (isMouseDownOnMap) {
		isMouseDownOnMap = false;
	}
}
function myPan(x, y) {
	if (x && y) {
		runningOffsetX += mousePosX - x;
		runningOffsetY += mousePosY - y;
		mousePosX = x;
		mousePosY = y;
		//map.panBy(dx, dy);
	}
}





var destinationMarker = null;
var destinationLatLon = null;
var watchDestinationHandle;

/*
 * Start watching for destination changes.
 */
function watchForDestinationChanges() {
	gm.nav.watchDestination(cbWatchDestination_success, cbWatchDestination_failure);
}

/**
 * When the destination for a route changes we want to display this destination
 * on the screen and show the additional destination display buttons.
 * 
 * @param data Information about our destination from gm.nav.watchDestination()
 */
function cbWatchDestination_success(data) {
	// Google Maps location for the destination.
	destinationLatLon = new google.maps.LatLng(gm.geo.convertArcMsToDegrees(data.latitude), gm.geo.convertArcMsToDegrees(data.longitude));
	
	// Create a marker if necessary, otherwise update the position
	// of the marker.
	if (!destinationMarker) {
		destinationMarker = new google.maps.Marker({
			position: destinationLatLon,
			map: map,
			icon: "images/checkered-flag-spot.png"
		});
	}
	else {
		destinationMarker.setPosition(destinationLatLon);
	}
	
	// Gimme some buttons!
	showDestinationButtons();
}
/**
 * When there is a destination watch failure, we hide the marker and the buttons since
 * they are not neeed.
 * 
 * @param data
 */
function cbWatchDestination_failure(data) {
	myConsole("cbWatchDestination_failure");
	if (destinationMarker) {
		destinationMarker.setMap(null);
		destinationMarker = null;
	}
	hideDestinationButtons();
}

var watchVehicleDataHandle;

/**
 * Puts the version number of my application in our div.
 */
function showVersionNumber() {
	gm.info.getMyVersion(function(nbr) {
		$("#theVersionDiv").html("Version " + nbr);
	});
	
	$("#theVersionDiv").click(function () {
		toggleConsoleIsVisible();
		
		// FOR TESTING ONLY - put an exception into the console to check for errors.
		//throw "Just for testing";
	});
}


///////////////////////////
// Tire Pressure Check
//////////////////////////

/**
 * To demonstrate the ability to monitor vehicle data we track tire pressure
 * information, determine if it becomes "low", and show an indicator with information
 * about the low tire pressure warning. 
 * 
 * Note: we have hardcoded a tire pressure low value just for testing. In practice this
 * information would be required from the actual tire pressure sensors.
 */
var tirePressureInRange = true;
var tirePressureLowValue_kPaG = 158; // Approx 22.92 PSI
var tirePressureValues = ["tire_left_front_pressure", "tire_left_rear_pressure", "tire_right_front_pressure", "tire_right_rear_pressure"];
var tireMap = {
		"tire_left_front_pressure" : "Left Front", 
		"tire_left_rear_pressure" : "Left Rear", 
		"tire_right_front_pressure" : "Right Front", 
		"tire_right_rear_pressure" : "Right Rear"
};
var whichTire="Unknown";

function watchForVehicleDataChanges() {
	// TODO: error handling here.
	watchVehicleDataHandle = gm.info.watchVehicleData(cbWatchVehicleData_success, cbWatchVehicleData_failure, tirePressureValues);
	gm.info.getVehicleData(cbWatchVehicleData_success, cbWatchVehicleData_failure, tirePressureValues);
}

function cbWatchVehicleData_success(data) {
	var wasInRange = tirePressureInRange;
	var willBeInRange = true; // Expect that it will be in range until proven false.
	
	for (var i=0; i < tirePressureValues.length; i++) {
		var tp = tirePressureValues[i];
		var val = data[tp];
		if (typeof(val) != "undefined" && val != null && val < tirePressureLowValue_kPaG) {
			willBeInRange = false;
			whichTire = tireMap[tp];
		} 
	}
	tirePressureInRange = willBeInRange;
	
	if (wasInRange && !willBeInRange) {
		// Show the icon.
		showTireIndicatorAndStartAnimation();
		// Sound the alarm.
		playNotification();
	}
	else if (!wasInRange && willBeInRange) {
		hideTireIndicatorAndStopAnimation();
	}
	
	
}

var tireAnimationOn = false;
function showTireIndicatorAndStartAnimation() {
	$("#theTireIndicatorDiv").show();
	tireAnimationOn = true;
	animateTireToTransparent();
}

function hideTireIndicatorAndStopAnimation() {
	tireAnimationOn = false;
	$("#theTireIndicatorDiv").hide();
}

function animateTireToTransparent() {
	if (tireAnimationOn) {
		$("#theTireIndicatorDiv").animate({opacity: 0.15}, 700, "swing", animateTireToOpaque);
	}
}
function animateTireToOpaque() {
	if (tireAnimationOn) {
		$("#theTireIndicatorDiv").animate({opacity: 0.85}, 700, "swing", animateTireToTransparent);
	}
}

function cbWatchVehicleData_failure(data) {
	console.log("cbWatchVehicleData_failure");
}



/**
 * Show our main page. Configured in pages.js
 */
function showMainPage() {
	showPage(pages.main);
}


/*
 * We use a custom info bubble obtained from here:
 * http://google-maps-utility-library-v3.googlecode.com/svn/trunk/infobubble/src/infobubble.js
 */

var myWatchPositionId;
var trafficLayer = null;
var infoWindow = null;
var pinInfowindow = null;

/**
 * Initialize the map, positioning us over Detroit (just because!)
 * 
 * Also creates a traffic layer that can be shown/hidden by toggle buttons.
 */
function initializeMap() {
    var myOptions = {
        center : new google.maps.LatLng(42.329017,-83.039693),
        zoom : 8,
        mapTypeId : google.maps.MapTypeId.ROADMAP,
        mapTypeControl : false,
        overviewMapControl : false,
        panControl : false,
        scaleControl : false,
        streetViewControl : false,
        zoomControl: false
    };
    map = new google.maps.Map(document.getElementById("theMap"), myOptions);
    
    // Create a traffic layer that we can turn on/off.
    trafficLayer = new google.maps.TrafficLayer();
    
    
    // Create an info window for displaying the position of the vehicle.
    infoWindow = new google.maps.InfoWindow({
        content: "Loading..."
    });
    
    pinInfoWindow = new google.maps.InfoWindow({
        content: "Loading..."
    });

    // First time current position sets things up.
    gm.info.getCurrentPosition(cbOneTimeCurrentPosition, function () { myConsole("current position failure!");});
    
    // watchPosition keeps a continuous monitor of the position to display.
    myConsole("watchPosition");
    myWatchPositionId = gm.info.watchPosition(cbWatchVehiclePosition);
    
    // Once the map is loaded, trigger a resize so that everything is oriented and sized
    // correctly.
    google.maps.event.trigger(map, 'resize');
    
}

/**
 * Add click handlers to our button images.
 */
function initButtons() {
	$("#focusVehicleButton").click(function () {
		focusOnVehicle();
	});
	$("#focusDestinationButton").click(function () {
		focusOnDestination();
	});
	$("#focusBothButton").click(function () {
		focusOnBoth();
	});
	
	
	$("#theZoomInButton").click(function () {
		var zoom = map.getZoom();
		map.setZoom(zoom+1);
	});
	$("#theZoomOutButton").click(function () {
		var zoom = map.getZoom();
		map.setZoom(zoom-1);
	});
	
	$("#theTireIndicatorDiv").click(function () {
		gm.ui.showAlert({
			alertTitle: "Low Tire Pressure Warning",
			alertDetail: "Your " + whichTire + " tire indicates that it is running low.<br/>Please stop at your next earliest convenience",
			primaryAction: function () { },
			primaryButtonText: "OK",
			secondaryAction: function () { 
				hideTireIndicatorAndStopAnimation();
			},
			secondaryButtonText: "Ignore"
		});
	});
	$("#theTrafficLayerButton").click(function () {
		toggleTrafficLayer();
	});
	$("#theSatelliteLayerButton").click(function () { 
		toggleSatelliteLayer();
	});
	$("#theBreadcrumbsButton").click(function () {
		cycleBreadcrumbs();
	});
}

/**
 * Called by the button click handler. Changes the state of the button
 * and hides/shows the traffic layer on the map as appropriate.
 */
function toggleTrafficLayer() {
	if (trafficLayer) {
		if (trafficLayer.getMap()) {
			// Unset the map hides the layer.
			trafficLayer.setMap(null);
			$("#theTrafficLayerButton").attr("src", "images/button_traffic_off.png");
		}
		else {
			trafficLayer.setMap(map);
			$("#theTrafficLayerButton").attr("src", "images/button_traffic_on.png");
		}
	}
}

/**
 * Called by the button click handler. Changes the state of the button
 * and hides/shows the satellite map type as appropriate.
 */
function toggleSatelliteLayer() {
	var type = map.getMapTypeId();
	if (type == google.maps.MapTypeId.HYBRID) {
		map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
		$("#theSatelliteLayerButton").attr("src", "images/button_satellite_off.png");
	}
	else if (type == google.maps.MapTypeId.ROADMAP) {
		map.setMapTypeId(google.maps.MapTypeId.HYBRID);
		$("#theSatelliteLayerButton").attr("src", "images/button_satellite_on.png");
	}
}

// Possible values:
// "off" - not displaying
// "on" - displays 1 hour of breadcrumbs
var breadcrumbsState = "off";

function cycleBreadcrumbs() {
	if (breadcrumbsState == "off") {
		breadcrumbsState = "on";
		showTails();
	}
	else if (breadcrumbsState == "on") {
		breadcrumbsState = "off";
		hideTails();
	}
	$("#theBreadcrumbsButton").attr("src", "images/button_breadcrumbs_" + breadcrumbsState + ".png");
}


/**
 * Keeps focus on the vehicle.
 * If the focus is already on the vehicle, it will zoom to the vehicle level.
 * If the focus is not already on the vehicle, the focus will become the vehicle
 * but the existing zoom state will stay constant.
 * 
 * Changes the button states to show that the focus is on the vehicle.
 */
function focusOnVehicle() {
	// if we're already on vehicle mode, a second click take us to the vehicle level.
	if (focusOn == "vehicle") {
		zoomToVehicleLevel();
	}
	
	focusOn="vehicle";
	updateMapViewport();
	$("#focusVehicleButton").attr("src", "images/focus-vehicle_on.png");
	$("#focusBothButton").attr("src", "images/focus-both_off.png");
	$("#focusDestinationButton").attr("src", "images/focus-destination_off.png");
}

/**
 * Keeps focus on the user's location as provided by panning.
 * 
 * When the user pans this method will be called to change the focus and adjust the buttons.
 * 
 * Changes the button states to show that the focus is the user (all disabled)
 */
function focusOnUser() {
	if (focusOn != "user") {
		focusOn="user";
		$("#focusVehicleButton").attr("src", "images/focus-vehicle_off.png");
		$("#focusBothButton").attr("src", "images/focus-both_off.png");
		$("#focusDestinationButton").attr("src", "images/focus-destination_off.png");
	}
}

/**
 * Focuses on the destination.
 * 
 * Changes the focusOn to be "destination" then updates the map to show the destination.
 * 
 * Changes the button states to show that the focus is on the destination.
 */
function focusOnDestination() {
	if (focusOn != "destination") {
		focusOn="destination";
		updateMapViewport();
		zoomToVehicleLevel();
		$("#focusVehicleButton").attr("src", "images/focus-vehicle_off.png");
		$("#focusBothButton").attr("src", "images/focus-both_off.png");
		$("#focusDestinationButton").attr("src", "images/focus-destination_on.png");
	}
}

/**
 * Focuses on both the destination and the vehicle.
 * 
 * Changes the focusOn to "both" then updates the map to show the destination and vehicle.
 * 
 * Changes the button states to show that the focus is on the vehicle and destination.
 */
function focusOnBoth() {
	if (focusOn != "both") {
		focusOn="both";
		updateMapViewport();
		$("#focusVehicleButton").attr("src", "images/focus-vehicle_off.png");
		$("#focusBothButton").attr("src", "images/focus-both_on.png");
		$("#focusDestinationButton").attr("src", "images/focus-destination_off.png");
	}
}

/**
 * Shows the destination button and both button. This is called when we have a valid destination
 * from the routing engine.
 */
function showDestinationButtons() {
	$("#focusBothButton").show();
	$("#focusDestinationButton").show();
}

/**
 * Hides the destination and both buttons. This is called when we no longer have a valid
 * destination from the routing engine.
 */
function hideDestinationButtons() {
	$("#focusBothButton").hide();
	$("#focusDestinationButton").hide();
}

// Sets the first time position of the location of the vehicle on the map.    
function cbOneTimeCurrentPosition(obj)  {	
    // Sanity check for valid data.
    if (obj == null || obj.coords == null ||
            (obj.coords.latitude == 0 && obj.coords.longitude == 0)) {
        return;
    }
	var lat = gm.geo.convertArcMsToDegrees(obj.coords.latitude);
	var lon = gm.geo.convertArcMsToDegrees(obj.coords.longitude);
	var latLon = new google.maps.LatLng(lat, lon);
	map.panTo(latLon);
	map.setZoom(14);

	
	updateVehicleDisplayPosition({ 
		lat: lat, 
		lng: lon, 
		heading: gm.geo.compassHeadingInDegrees(obj.coords.heading)});
}




/**
 * Global variables for tracking the vehicle location, its marker, anchor point and color.
 */
var vehicleMarker = null;
var vehicleMarkerOpts = null;
var vehicleMarkerImage = null;
var vehicleLatLng = null;
var vehicleLatLngSpeedHeading = null; // Our format
var vehicleAnchorPoint = null;
var vehicleMarkerColor = "black";

// Information about the vehicle marker when touched.
var vehicleMarkerLatLng = null;
var vehicleMarkerAddress_line1="";
var vehicleMarkerAddress_line2="";

//Focus Mode: determine where the focus is for the screen. Originally the mode is
//set to "vehicle" meaning that the focus remains on the vehicle position and follows 
//it as it moves. If the user pans, then the focus mode becomes "user", meaning that
//the user will designate where we focus. Another focus might be "poi" to show one
//or more points of interest.
//
//Possible values:
//"user" - the user is interacting with the map and will designate what they want to view.
//"vehicle" - the focus is following the vehicle.
//"destination" - the destination of a route.
//"both" - both vehicle and destination.
var focusOn = "vehicle"; 


/**
 * Updates the location of the vehicle marker to the provided location/heading.
 * 
 * Updates the track points to include the latest location point.
 * 
 * @param latLngHeading
 */
function updateVehicleDisplayPosition(latLngHeadingSpeed) {
	// (0,0) is not a valid data point.
	if (latLngHeadingSpeed.lat == 0 && latLngHeadingSpeed.lng == 0) return;
	
	vehicleLatLng = new google.maps.LatLng(latLngHeadingSpeed.lat, latLngHeadingSpeed.lng);
	vehicleLatLngSpeedHeading = latLngHeadingSpeed;
	

	// Create the marker if necessary.
	if (vehicleMarker == null) {
		vehicleAnchorPoint = new google.maps.Point(28, 28);
		vehicleMarkerImage = gm.map.marker.getMarkerImageForHeading(vehicleMarkerColor, latLngHeadingSpeed.heading);
		vehicleMarker = new google.maps.Marker({
	        position: vehicleLatLng, 
	        map: map,
	        icon: vehicleMarkerImage,
	        title:"Your Vehicle"
	    });   
		zoomToVehicleLevel();
		
		// add click event to the marker
		google.maps.event.addListener(vehicleMarker, 'click', function() {
			focusOnVehicle();
			if (pinInfoWindow) {
				pinInfoWindow.close();
			}
			infoWindow.open(map,vehicleMarker);
			reverseGeocodeToInfoWindow();
		});
	}
	
	// Update the marker image by direction.
	var img = gm.map.marker.getMarkerImageForHeading(vehicleMarkerColor, latLngHeadingSpeed.heading);
	if (img != vehicleMarkerImage) {
		vehicleMarkerImage = img;
		vehicleMarker.setIcon(img); // No, it's not setMarkerImage....
	}
	
	// Update the marker position.
	vehicleMarker.setPosition(vehicleLatLng);


	// Add this lat/lng to the tail.
	addToTail(latLngHeadingSpeed);
	trimTailIfNecessary();
	

	// Center the map since we're moving, but only update it if we are the focus.
	if (focusOn == "vehicle") {
		updateMapViewport();
	}
}

/**
 * Changes the zoom level to the pre-determined level that shows the vehicle
 * and most of the detailed road information for more precise location information.
 */
function zoomToVehicleLevel() {
	map.setZoom(14);
}

/**
 * Callback for watching the vehicle position. Updates the location, heading, and tails.
 * 
 * @param obj Callback data with vehicle location, heading, etc.
 */
function cbWatchVehiclePosition(obj) {
	updateVehicleDisplayPosition({ 
		lat: gm.geo.convertArcMsToDegrees(obj.coords.latitude), 
		lng: gm.geo.convertArcMsToDegrees(obj.coords.longitude), 
		heading: gm.geo.compassHeadingInDegrees(obj.coords.heading),
		speed: gm.system.getSpeed()
		});
}


// Array of objects with:
// speed - 0=Park, 1=Low, 2=High
// polyline - google.maps.Polyline
//      .path - MVCArray<LatLng> of the points that we track for this color.
var vehicleTailPolyObjs = [];
var colorSpeedMap = ["#ff0000", "#00ffff", "#00ff00"]; // red, yellow, green
var maximumPointsInTail = 3600; // Hardcoded for now.

/**
 * Adds the given Lat/Lon to the tail using the given Speed to give it color.
 * 
 * @param latLngHeadingSpeed
 */
function addToTail(latLngHeadingSpeed) {
//	console.log("speed: " + latLngHeadingSpeed.speed);
//	console.log("{ " + latLngHeadingSpeed.lat + ", " + latLngHeadingSpeed.lng + "}");
	
	// Do we need a new polyObj?
	// * Empty array needs a new poly obj
	//        or
	// * The current poly object has a different speed.
	if (vehicleTailPolyObjs.length == 0 ||
		vehicleTailPolyObjs.last().speed != latLngHeadingSpeed.speed) {
		addPolyObj(latLngHeadingSpeed);
	}
	
	// Add the lat/lng to the end of the polyline
	var gLatLng = new google.maps.LatLng(latLngHeadingSpeed.lat, latLngHeadingSpeed.lng);
	var polyObj = vehicleTailPolyObjs.last();
	var path = polyObj.polyline.getPath();
	path.push(gLatLng);
}

/**
 * Adds a brand new poly object to the vehicleTailPolyObjs with the correct speed 
 * and color information.
 * 
 * @param latLngHeadingSpeed
 */
function addPolyObj(latLngHeadingSpeed) {
	var polyObj = {};
	var speed = latLngHeadingSpeed.speed;
	polyObj.speed = speed;
	polyObj.polyline = createMarkerTailForSpeed(colorSpeedMap[speed]);
	/* This will keep paths joined, but... it isn't quite right yet
	if (vehicleTailPolyObjs.length > 0) {
		var lastPath = vehicleTailPolyObjs.last().polyline.getPath();
		if (lastPath && lastPath.getLength() > 0) {
			// Add the last point from the last poly as the first point of this one for continuation.
			polyObj.polyline.getPath().push(lastPath.getAt(0));
		}
	}
	*/
	
	vehicleTailPolyObjs.push(polyObj);
}


/**
 * Creates a styled marker tail for the given color in the form of a polyline.
 * 
 * @param color The "#xxxxxx" format color.
 * @returns {google.maps.Polyline} The polyline with the given style.
 */
function createMarkerTailForSpeed(color) {
	return new google.maps.Polyline({
		map: breadcrumbsState=="on"?map:null,
		strokeColor: color,
		strokeWeight: 5,
		stokeOpacity: 1.0
	});
}

/**
 * Determines if there are too many points in the entire tail. If so
 * trim from the earliest polyline. If there are no points left in that
 * polyline, remove it from the map.
 */
function trimTailIfNecessary() {
	var cnt = 0; 
	for (var i=0; i < vehicleTailPolyObjs.length; i++) {
		var polyObj = vehicleTailPolyObjs[i];
		cnt += polyObj.polyline.getPath().getLength();
	}
	
	while (cnt-- > maximumPointsInTail) {
		trimTail();
	}
}

/**
 * Trims the tail by removing the oldest lat/lng from the polyline. If the 
 * polyline ends up having no more points, that polyline is removed from
 * the map and removed from the list of vehicleTailPolyObjs.
 */
function trimTail() {
	var polyObj = vehicleTailPolyObjs[0];
	var path = polyObj.polyline.getPath();
	path.removeAt(0);
	if (path.getLength() == 0) {
		// Remove the polyObj from the list and from the map.
		vehicleTailPolyObjs = vehicleTailPolyObjs.slice(1);
		polyObj.polyline.setMap(null);
		polyObj.polyline = null;
	}
}

/**
 * Hides the tails by setting each polyline's map to null
 */
function hideTails() {
	for (var i=0; i < vehicleTailPolyObjs.length; i++) {
		vehicleTailPolyObjs[i].polyline.setMap(null);
	}
}

/**
 * Hides the tails by setting each polyline's map to our global map
 */
function showTails() {
	for (var i=0; i < vehicleTailPolyObjs.length; i++) {
		vehicleTailPolyObjs[i].polyline.setMap(map);
	}
}
/**
 * Determines what to show based on the focusOn variable:
 * 1. "user" - then don't change anything, the user is controlling the viewport.
 * 2. "vehicle" - make sure the vehicle is centered on the screen, regardless of zoom.
 * 3. "poi" - make sure to show the POI points.
 */
function updateMapViewport() {
	var locs = [];
	
	// 1. If the focus has been set by the user, then don't do anything based 
	// on vehicle or POI data.
	if (focusOn == "user") return;
	
	
	
	// 2. If we are focusing on the vehicle, use the track points to set the center.
	if (focusOn == "vehicle" || focusOn == "both") {
		if (vehicleLatLngSpeedHeading) {
			locs.push(vehicleLatLngSpeedHeading);
		}
	}
	
	// 3. If we are focusing on the POI markers, make sure we can see them.
	if (focusOn == "poi") {
		if (poiResults && poiResults.length) {
			for (var i=0; i < poiResults.length; i++) {
				var result = poiResults[i];
				if (result && result.marker) {
					locs.push({ lat: result.marker.getPosition().lat(), lng: result.marker.getPosition().lng()});
				}
			}
		}
	}
	else if (focusOn == "destination" || focusOn == "both") {
		if (destinationLatLon) {
			locs.push({ lat: destinationLatLon.lat(), lng: destinationLatLon.lng() });
		}
	}
	
	// We have nothing to show? Bail out!
	if (locs.length == 0) return;
	
	if (locs.length > 1) {
		var bnds = gm.geo.getLatLngBoundsFromLocations(locs);
		if (bnds) {
			map.fitBounds(bnds);
		}
	}
	else {
		map.setCenter(new google.maps.LatLng(locs[0].lat, locs[0].lng));
	}
}

/**
 * Puts the loading animation into the infoWindow, then does a reverse geocode of the current
 * vehicle location to determine the road, city, and state. Provides Refresh and Pin buttons
 * in the info window.
 */
function reverseGeocodeToInfoWindow(dropPinParam) {
	infoWindow.setContent("<img src='images/loading-anim-50x45.gif' valign='absmiddle'> Loading...");

	// Store the location where we tagged this marker.
	vehicleMarkerLatLng = vehicleLatLng;
	
	// Reverse geocode and populate the info window.
	gm.geo.reverseGeocodeFromGoogle(vehicleLatLngSpeedHeading, function (data) {
		if (data.status == "OK") {
			// Build address info.
			var addr = data.results[0]["address_components"];
			if (addr) {
				var line1=buildStreetLineFromAddress(addr);
				var line2=buildCityStateLineFromAddress(addr);
				
				if (line1.length > 0) {
					line1 += "<br />";
				}
				
				var template = $("#vehicleInfoTemplate").clone();
				$("#vehicleInfo_line", template).html(line1 + line2);
				
				// Store the information for later use and pin use, potentially.
				vehicleMarkerAddress_line1 = line1;
				vehicleMarkerAddress_line2 = line2;
				
				infoWindow.setContent(template.html());
				
				if (dropPinParam) {
					dropPin();
					infoWindow.close();
				}
			}
			else {
				infoWindow.setContent("<i>Location unknown</i>");
			}
		}
	});
}

/**
 * Performs a reverse geocode of the vehicles current location and drops a pin.
 */
function reverseGeocodeToInfoWindowAndDropPin() {
	reverseGeocodeToInfoWindow(true);
}

/**
 * Builds the street line from an address which is formatted like:
 * "NE on Pine St." 
 * 
 * @param addr The address components returned from a Google reverse geocode.
 * @returns {String} The line string in the above format.
 */
function buildStreetLineFromAddress(addr) {
	var line = "";
	var road = findAddressComponentType(addr, "route");
	var heading = gm.map.marker.getDirectionForHeading(vehicleLatLngSpeedHeading.heading);

	if (road) {
		line += heading + " on " + road;
	}
	return line;
}

/**
 * Builds the second line in an address line in the format like:
 * 
 * "Portland, OR" or if the city is not available simply "Oregon".
 * 
 * @param addr The address components returned from a Google reverse geocode.
 * @returns {String} The line string in the above format.
 */
function buildCityStateLineFromAddress(addr) {
	var line="";
	var city = findAddressComponentType(addr, "locality");
	var state = findAddressComponentType(addr, "administrative_area_level_1", true);
	var stateLong = findAddressComponentType(addr, "administrative_area_level_1", false);
	if (city) {
		line += city;
		if (state) line += ", ";
	}
	if (state) {
		if (!city) {
			line += stateLong;
		}
		else {
			line += state;
		}
	}
	return line;
}



var pinSelected =null;
var pinMarkerImage = null;

/**
 * Use the current vehicle location and address information to store a pin.
 * 
 */
function dropPin() {
	if (vehicleMarkerLatLng) {
//		var pinMarkerImage = gm.map.marker.getMarkerImageForHeading("orange", vehicleLatLngSpeedHeading.heading);
		if (!pinMarkerImage) {
			pinMarkerImage = new google.maps.MarkerImage("images/pin-icon.png");
		}
		
		// Add a pin with the information about the vehicle.
		var pinMarker = new google.maps.Marker({
			position: vehicleMarkerLatLng,
			map: map,
			icon: pinMarkerImage
		});

		// Store some other information on the pin.
		pinMarker.line1 = vehicleMarkerAddress_line1 ? vehicleMarkerAddress_line1:"";
		pinMarker.line2 = vehicleMarkerAddress_line2 ? vehicleMarkerAddress_line2:"";
		
		// Add event for marker.
		google.maps.event.addListener(pinMarker, 'click', function(obj) {
			// This refers to the specific marker.
			pinSelected = this;
			focusOnUser();
			map.setCenter(pinSelected.getPosition());
			
			// New content.
			var template = $("#pinInfoTemplate").clone();
			$("#pinInfo_line", template).html(pinSelected.line1 + pinSelected.line2);
			
			infoWindow.close();
			
			pinInfoWindow.setContent(template[0]);
			pinInfoWindow.open(map, pinSelected);
		});
		
	}
}

/**
 * Removes the selected pin from the map. If whichPin is null, then
 * the pinSelected is removed.
 * 
 * Has the following side effects:
 * 1) Closes the pinInfoWindow.
 * 2) Sets the pinSelected to null if whichPin was null
 */
function removePin(whichPin) {
	if (whichPin == null) {
		whichPin = pinSelected;
	}
	if (whichPin) {
		if (pinInfoWindow) {
			pinInfoWindow.close();
		}
		whichPin.setMap(null);
		if (whichPin == pinSelected) {
			pinSelected = null;
		}
	}
}

/**
 * Plays a notification sound. What else did you think it would do??
 */
function playNotification() {
	gm.media.play("audio/notification.mp3", "mixedAudio");
}