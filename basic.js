/*
 * JavaScript file
 */

// Pre-generated OAuth Token here

ATT_OAUTH_TOKEN = 'e0c2f766447f9c5e4bc61bcc37333702';

GOOGLE_APP_ID = '407408718192.apps.googleusercontent.com';
GOOGLE_CALENDER_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
GOOGLE_URL_SHORTENER = 'https://www.googleapis.com/urlshortener/v1/url';

GOOGLE_OAUTH_REFRESH_TOKEN = '1/DHizid19rsXNH35IHh6MpzZyvaZRPJ8zA4a37pArD78'; 
//!!!NOTE!!!: Change OAuth token since it normally expire in 1 hour
//  
//  Get Oauth token here:
//   https://developers.google.com/oauthplayground/?code=4/lAw3rs_qZTiEohO9vZedxr21BBPj.0qML9mvQSr4UuJJVnL49Cc90-hQaeAI
//
GOOGLE_OATH_TOKEN = 'ya29.AHES6ZRoJNmarbvD-A0Cc7YRjPDTxDs80TM_-Wh4rQ3mbiPNptSYCg';

var currentDest = null; 
var notificationDistances = [1, 5];
var notificationSentDistance = 1000000;
var recipient = '18155140539';
var waitingForReply = false;

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
	var tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
	
	return $.ajax(GOOGLE_CALENDER_URL, 
			{
				data: {
					key: GOOGLE_APP_ID, 
					//q: 'test'
					timeMin: (new Date()).toISOString(),
					timeMax: tomorrow.toISOString(),
					maxResults: 10
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
		
		if (event.start) {
			var item = $(tmpl('event_tmpl', event));
			$('#event_selection_screen').append(item);
			
			if (event.location) {
				item.data('address', event.location);
				item.data('event', event);
				(function (el) {
					codeAddress(event.location, function(latlng) {
						el.data('latlng', latlng);
					});				
				}(item));
			}
		}
	}
}

function showGoogleCalenderItem() 
{
	getGoogleCalenderItem().done(function(data) {
		handleEvents(data);
	});
}

function time2dest(dist)
{
	var hours = dist/45;
	
	if (hours > 1) {
		return hours.toFixed(1) + ' <span>hours</span>';
	}
	
	return (hours * 60).toFixed(0) + ' <span>minutes</span>';
}

function init()
{
	watchPositionID = gm.info.watchPosition(
	    function(positionObj) {
	    	var lat = positionObj.coords.latitude / (3600 * 1000);
	    	var lng = positionObj.coords.longitude / (3600 * 1000);
	    	
	    	if (currentDest) {
	    		var remainDistance = calcDistance(lat, lng, currentDest.lat(), currentDest.lng());
	    		//console.log('Timestamp: ' + positionObj.timestamp + ', Latitude: ' + positionObj.coords.latitude + ', Longitude: ' + positionObj.coords.longitude);	   
	    		
	    		$('#distance').text(remainDistance.toFixed(2));
	    		$('#timeleft').html(time2dest(remainDistance));
	    		for (var i in notificationDistances) {
	    			var dist = notificationDistances[i];
			        if (remainDistance < dist && dist < notificationSentDistance) {
			        	sendSMS(recipient, "Robert is approximately " + Math.round(remainDistance * 10) / 10 + " miles away.");
			        	notificationSentDistance = remainDistance;
			        }	
	    		}
	    	}
	    },
	    function() {
	        console.log('Failure: watchPosition. May need to load route in emulator.');
	    },
	    {
	        maximumAge: 30000,
	        timeout: 30000,
	        frequency: 1000
	    }
	);
	
	$("#btnSendLocation").click(function() {
		getCurrentLocation(function(lat, lng) {
        	sendSMS(recipient, "Robert's current location: " + getMapUrl(lat, lng));
		});
	});

	$("#btnInTraffic").click(function() {
		getCurrentLocation(function(lat, lng) {
			var message = "Robert's currently behind schedule.";
			if ($('#cbIncludePosition').is(':checked')) {
				message += " Current location: " + getMapUrl(lat, lng);
			}
			sendSMS(recipient,  message);
		});
	});

	$("#btnArrivingSoon").click(function() {
		getCurrentLocation(function(lat, lng) {
			var message = "Robert will arrive shortly.";
			if ($('#cbIncludePosition').is(':checked')) {
				message += " Current location: " + getMapUrl(lat, lng);
			}
			sendSMS(recipient,  message);
		});
	});
	
	$("#cbOneMile").click(function() {
		addRemoveNotificationMile($('#cbOneMile').is(':checked'), 1);
	});

	$("#cbFiveMile").click(function() {
		addRemoveNotificationMile($('#cbFileMile').is(':checked'), 5);
	});

	/*
	$.ajax({
		'type': 'POST',
		'url': 'https://accounts.google.com/o/oauth2/token',
		'headers': {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		'data': {
			'client_id': 
			'client_secret':
			'refresh_token': GOOGLE_OAUTH_REFRESH_TOKEN,
			'grant_type': 'refresh_token'
		}
	}).done(function(data) {
	}).fail(function(jqXHR, textStatus) {
		alert(jqXHR.responseText);
	});
	*/
}

function addRemoveNotificationMile(checked, m)
{
	if (checked) {
		if (notificationDistances.indexOf(m) == -1) {
			notificationDistances.push(m);
		}
	} else {
		var index = notificationDistances.indexOf(m);
		if (index >= 0) {
			array.splice(index,1);
		}
	}
}

$(function(){
	showGoogleCalenderItem();
	$('.setdest').live('click',function() {
	});
	
	$('.eventitem').live('click', function() {
		var event =  $(this).data('event');
		var address = event.location;
		currentDest = $(this).data('latlng');

		$('#event_selection_screen').hide(); 
		$('#in_progress_screen').show(); 

		$('#event_title').text(event.summary);
		$('#event_time').text(formatCalendarTime(new Date(event.start.dateTime)));
		$('#event_address').text(address);
		console.log('set new destination to ' + address + ' ' + currentDest);
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
	
	$('#back_event_selection').click(function(){
		$('#event_selection_screen').show(); 
		$('#in_progress_screen').hide(); 		
	});
	
	$('#callphone').click(function(){
		// TODO Change options
		gm.phone.dialPhoneNumber(
		    function(responseObj) {
		        console.log('Success: dialPhoneNumber. Response: ' + responseObj.success);
		    },
		    function() {
		        console.log('failure!');
		    },
		    {
		        phone: "1234567890",
		        callParameters:
		        {
		            "noiseSuppression": "Standard",
		            "phoneSource": "OnStar",
		            "deviceHandle": 123455
		        }
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
		var audio = new Audio("messagesent.wav");
		audio.play();
		if (!waitingForReply) {
			window.setInterval(function() {
				console.log("Polling to get SMS.");
				$.ajax({
					'type': 'GET',
					'url': 'https://api.att.com/rest/sms/2/messaging/inbox?RegistrationID=30958501',
					'headers': {
						'Authorization': 'Bearer ' + ATT_OAUTH_TOKEN,
						'Content-Type': 'application/json'
					}
				}).done(function(data){
					console.log("SMS reply: " + data.toString());
					var messages = data['InboundSmsMessageList']['InboundSmsMessage'];
					if (messages.length > 0) {
						var message = messages[0]['Message'];
						$("#incoming").html(message).show();
						var audio = new Audio("newmessage.wav");
						audio.play();
					}
				}).fail(function(jqXHR, textStatus) {
					alert(jqXHR.responseText);
				});
			}, 30000);
			
			waitingForReply = true;
		}
	}).fail(function(jqXHR, textStatus) {
		alert(jqXHR.responseText);
	});
}

// miles
function calcDistance(lat1, lng1, lat2, lng2)
{
	//console.log('lat1, lng1, lat2, lng2: ' + lat1 + ',' + lng1 + ',' + lat2 + ',' + lng2);
	var R = 6371; // km
	var dLat = (lat2-lat1) * Math.PI / 180;
	var dLng = (lng2-lng1) * Math.PI / 180;
	var lat1 = lat1 * Math.PI / 180;
	var lat2 = lat2 * Math.PI / 180;

	var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
	        Math.sin(dLng/2) * Math.sin(dLng/2) * Math.cos(lat1) * Math.cos(lat2); 
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	return d = R * c * 0.621371;
}

function getCurrentLocation(callback) {
	gm.info.getCurrentPosition(
	    function(positionObj) {
	        console.log('Success: getCurrentPosition.');
	        var lat = positionObj.coords.latitude / (3600 * 1000);
	        var lng = positionObj.coords.longitude / (3600 * 1000);
	        callback(lat, lng);
	    },
	    function() {
	        console.log('Failure: getCurrentPosition. May need to load route in emulator.');
	    },
	    {
	        maximumAge: 30000,
	        timeout: 30000,
	        frequency: 60000
	    }
	);		
}

function getMapUrl(lat, lng)
{
    return "http://maps.google.com/?q=" + lat + "," + lng;
}

function timeSince(date) {

    var seconds = Math.floor((new Date() - date) / 1000);
    
    seconds = Math.abs(seconds);
    
    var interval = Math.floor(seconds / 31536000);

    if (interval > 1) {
        return interval + " years";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
        return interval + " months";
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
        return interval + " days";
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
        return interval + " hours";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        return interval + " minutes";
    }
    return "1 minute"; //Math.floor(seconds) + " seconds";
}

function formatCalendarTime(date)
{
	// http://stackoverflow.com/questions/8888491/how-do-you-display-javascript-datetime-in-12-hour-am-pm-format
	var hours = date.getHours();
	var minutes = date.getMinutes();
	var ampm = hours >= 12 ? 'PM' : 'AM';
	hours = hours % 12;
	hours = hours ? hours : 12; // the hour '0' should be '12'
	minutes = minutes < 10 ? '0'+minutes : minutes;
	var strTime = hours + ':' + minutes + ' ' + ampm;
	return strTime;
}
