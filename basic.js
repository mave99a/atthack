/*
 * JavaScript file
 */

// Pre-generated OAuth Token here

ATT_OAUTH_TOKEN = 'e0c2f766447f9c5e4bc61bcc37333702';

GOOGLE_APP_ID = '407408718192.apps.googleusercontent.com';
GOOGLE_CALENDER_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
GOOGLE_URL_SHORTENER = 'https://www.googleapis.com/urlshortener/v1/url';

//!!!NOTE!!!: Change OAuth token since it normally expire in 1 hour
//  
//  Get Oauth token here:
//   https://developers.google.com/oauthplayground/?code=4/lAw3rs_qZTiEohO9vZedxr21BBPj.0qML9mvQSr4UuJJVnL49Cc90-hQaeAI
//
GOOGLE_OATH_TOKEN = 'ya29.AHES6ZQhZ2DWGOoDvU1gmVFw1CrjBGpxKRfDoQ90ppkr3qLKSXNVT6w';


function shortenUrl(url)
{
	return $.ajax(GOOGLE_URL_SHORTENER, 		
		{
			type: 'POST',
			contentType: 'application/json',
			data:'{"longUrl": "' + url + '"}',
		});
}

function getGoogleCalenderItem()
{
	return $.ajax(GOOGLE_CALENDER_URL, 
			{
				data: {
					key: GOOGLE_APP_ID, 
					q: 'test'
				},
				headers: {
					'Authorization': 'Bearer ' + GOOGLE_OATH_TOKEN
				},
			});
}

var geocoder = null; 
function codeAddress(address, callback)
{
	if (!geocoder) {
		geocoder = new google.maps.Geocoder();
	}
	
    geocoder.geocode( { 'address': address}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
        	if (callback) {
        		callback(results[0].geometry.location);
        	}
        } else {
          // Not able to find the lat/lng
          //alert("Geocode was not successful for the following reason: " + status);
        }
      });
}

function handleEvents(data)
{
	for (var i in data.items) {
		var event = data.items[i];
		
		var item = $(tmpl('event_tmpl', event));
		$('#output').append(item);
		
		if (event.location) {
			var button = item.find('.setdest').show();
			button.data('address', event.location);
			(function (el) {
				codeAddress(event.location, function(latlng) {
					el.find('.setdest').data('latlng', latlng);
				});				
			}(item));
		}
	}
}

function showGoogleCalenderItem() 
{
	getGoogleCalenderItem().done(function(data) {
		handleEvents(data);
	});
}

function init()
{
	watchPositionID = gm.info.watchPosition(
	    function(positionObj) {
	    	var lat = positionObj.coords.latitude / 1000000;
	    	var lng = positionObj.coords.longitude / 1000000;
	    	
	    	var lat2 = 47;
	    	var lng2 = -121;
	        console.log('Remaining distance: ' + calcDistance(lat, lng, lat2, lng2));

	        console.log('Success: watchPosition.');
	        console.log('Timestamp: ' + positionObj.timestamp + ', Latitude: ' + positionObj.coords.latitude + ', Longitude: ' + positionObj.coords.longitude);
	    },
	    function() {
	        console.log('Failure: watchPosition. May need to load route in emulator.');
	    },
	    {
	        maximumAge: 30000,
	        timeout: 30000,
	        frequency: 1000
	    });
}

$(function(){
	$('.setdest').live('click',function() {
		var address = $(this).data('address');
		console.log('set new destination to ' + address);
		gm.nav.setDestination(
		    function(responseObj) {
		        console.log('Success: setDestination.');
		    },
		    function() {
		        console.log('Failure: setDestination.');
		    },
		    {
		        //"state" : "MI",
		        //"city" : "Detroit",
		        "street" : address,
		        //"house": "1",
		        //"zip": "48226"
		    }
		);
	});
});

function sendSMS(phoneNumber, message)
{
	$.ajax({
		'type': 'POST',
		'url': 'https://api.att.com/rest/sms/2/messaging/outbox',
		'headers': {
			'Authorization': 'Bearer ' + ATT_OAUTH_TOKEN,
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		'data': {'Address': 'tel:' + phoneNumber, 'Message': message}
	}).done(function(data) {
	}).fail(function(jqXHR, textStatus) {
		alert(jqXHR.responseText);
	});
}

function calcDistance(lat1, lng1, lat2, lng2)
{
	console.log('lat1, lng1, lat2, lng2: ' + lat1 + ',' + lng1 + ',' + lat2 + ',' + lng2);
	var R = 6371; // km
	var dLat = (lat2-lat1) * Math.PI / 180;
	var dLng = (lng2-lng1) * Math.PI / 180;
	var lat1 = lat1 * Math.PI / 180;
	var lat2 = lat2 * Math.PI / 180;

	var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
	        Math.sin(dLng/2) * Math.sin(dLng/2) * Math.cos(lat1) * Math.cos(lat2); 
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	return d = R * c;
}
