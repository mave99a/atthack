/**
 * A custom console widget that records console information into a div that can be displayed with
 * some trigger provided by the developer. 
 */
var myConsoleDiv = null;

/**
 * Use this method instead of just "console.log" to log to the visual console and to the WebKit console.
 * 
 * @param msg The message to log.
 */
function myConsole(msg) {
    if (myConsoleDiv) {
        myConsoleDiv.innerHTML = myConsoleDiv.innerHTML + "<br />" + msg;
        myConsoleDiv.scrollTop = myConsoleDiv.scrollHeight; // Keep the content at the bottom shown
    }
    if (console) {
        console.log(msg);
    }
}

/**
 * Call this to initialize the console for display. Without this, we'd all be lost.
 */
function initMyConsole() {
    myConsoleDiv = document.createElement('div');
    myConsoleDiv.style.position = "absolute";
    myConsoleDiv.style.bottom = "10px";
    myConsoleDiv.style.width= "500px";
    myConsoleDiv.style.height="370px";
    myConsoleDiv.style.border="2px solid gray";
    myConsoleDiv.style.font="lighter 10px Monospace";
    myConsoleDiv.style.color="black";
    myConsoleDiv.style.textAlign="left";
    myConsoleDiv.style.backgroundColor = "#ddd";
    myConsoleDiv.style.overflow="scroll";
    myConsoleDiv.style.zIndex="1000";
    myConsoleDiv.innerHTML = "Console";
    $("#theScreen")[0].appendChild(myConsoleDiv);
    $(myConsoleDiv).hide();
    // TODO: attach console to a button.
    //$("#consoleButton").click(toggleConsoleIsVisible);
}

/**
 * Show/hide the console. Call this from your own event.
 */
function toggleConsoleIsVisible() {
	var mcd = $(myConsoleDiv);
	if (mcd.is(":visible")) {
		mcd.hide();
	}
	else {
		mcd.show();
	}
}