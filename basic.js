/*
 * JavaScript file
 */

// Pre-generated OAuth Token here

GOOGLE_APP_ID = '407408718192.apps.googleusercontent.com';
GOOGLE_CALENDER_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
GOOGLE_URL_SHORTENER = 'https://www.googleapis.com/urlshortener/v1/url';

//!!!NOTE!!!: Change OAuth token since it normally expire in 1 hour
//  
//  Get Oauth token here:
//   https://developers.google.com/oauthplayground/?code=4/lAw3rs_qZTiEohO9vZedxr21BBPj.0qML9mvQSr4UuJJVnL49Cc90-hQaeAI
//
GOOGLE_OATH_TOKEN = 'ya29.AHES6ZSq-NrjgLMz99UStmEmX65hDwYyrfOu9GJVh44DXz9TlXUGDw';

ATT_OAUTH_TOKEN = 'e0c2f766447f9c5e4bc61bcc37333702';

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
			(function (el) {
				codeAddress(event.location, function(latlng) {
					el.find('.latlng').html(' ' + latlng);
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
	sendSMS('18155140539', 'test message');

	var watchDestinationID = gm.nav.watchDestination(
	    function(responseObj) {
	    	var lat = responseObj.latitude;
	    	var lng = responseObj.longitude;
	        console.log('Success: watchDestination. Address: ' + lat + ',' + lng);
	    },
	    function() {
	        console.log('Failure: watchDestination.');
	    }
	);	
}

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
