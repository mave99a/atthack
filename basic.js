/*
 * JavaScript file
 */

// Pre-generated OAuth Token here

GOOGLE_APP_ID = '407408718192.apps.googleusercontent.com';
// !!!NOTE!!!: Change OAuth token since it normally expire in 1 hour
GOOGLE_OATH_TOKEN = 'ya29.AHES6ZTT7GMxwT3_I-2hKDu6B2Ngwryzrti2Frrd2f9TTXtJhq4nzw';
GOOGLE_CALENDER_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
	
function getGoogleCalenderItem()
{
	$.ajax(GOOGLE_CALENDER_URL, 
			{
				data: {
					key: GOOGLE_APP_ID, 
					q: 'test'
				},
				headers: {
					'Authorization': 'Bearer ' + GOOGLE_OATH_TOKEN
				},
				dataType:'text'
			}).done(function(result) {
				alert(result);
			});
}

function init()
{
	// TODO Add your code here
}
