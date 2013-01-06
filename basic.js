/*
 * JavaScript file
 */

// Pre-generated OAuth Token here

GOOGLE_APP_ID = '407408718192.apps.googleusercontent.com';
GOOGLE_CALENDER_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
GOOGLE_URL_SHORTENER = 'https://www.googleapis.com/urlshortener/v1/url';

//!!!NOTE!!!: Change OAuth token since it normally expire in 1 hour
GOOGLE_OATH_TOKEN = 'ya29.AHES6ZRDJiOVh0ChJ-RlnekSStvrquFjNIpXV96KNMveJXLBI5ECyA';


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

function handleEvents(data)
{
	for (var i in data.items) {
		var event = data.items[i];
		
		$('#output').append(event.description||event.summary + ' ' + event.location+ ' '+ event.start.dateTime+ ' <br/>');
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
	// TODO Add your code here
}
