/**
 * Simple page stacking arrangement. Pages are defined in the global
 * pages object as a named object with:
 * "main" - id of div to show when this page is activated.
 * "init" - method to call when page is initialized; once when the application is loaded.
 * "onShow" - method to call when page is shown.
 * "onHide" - method to call when a page is hidden.
 */

// Template for each of the pages that we display. Managed using
// currentPage(), popPage(), pushPage(newPage), replacePage(newPage)
var pages = { 
	loading : {
		main : "#loading",
		init : null
	},
	main : {
		main : "#main",
		init : init_mainPage,
		onShow : onShow_mainPage
			
	}
};

/**
 * Stack of pages - the objects from pages.
 */
var pageStack = [];

/**
 * Initializes all the pages in the global "pages" object by calling their init() method if present.
 */
function initPages() {
    // Initialize the pages which may be dependent upon some of the data.
	pageStack[0] = pages.loading;
	
	for (p in pages) {
		var pg = pages[p];
		if (typeof (pg.init) == "function") {
			pg.init();
		}
	}
}

/**
 * Returns the current page object.
 * @returns Page object.
 */
function currentPage() {
	return pageStack[pageStack.length-1];
}

/**
 * Pushs a page from the "pages" object onto the stack, hiding the current page.
 * @param newPage
 */
function pushPage(newPage) {
	hidePage(currentPage());
	pageStack.push(newPage);
	showPage(currentPage());
}
/**
 * Pops a page from the "pages" object from the stack, hiding this page and displaying
 * the previous page.
 */
function popPage() {
	hidePage(currentPage());
	pageStack.pop();
	showPage(currentPage());
}

/**
 * Replaces the entire page stack with a given page. 
 * @param newPage Page that will become the start of the new page stack. This should not be null.
 */
function replacePageStack(newPage) {
	hidePage(currentPage());
	while(currentPage() != null && currentPage() != pages.home) {
		pageStack.pop();
	}
	pageStack.push(newPage);
	showPage(currentPage());
}

/**
 * Hides a page. Should be used in conjunction with push/pop.
 * 
 * If the page definition has an "onHide" method, this method is called after the page is dispalyed.
 * @param page
 */
function hidePage(page) {
	if (typeof(page.main) == "string") {
		$(page.main).hide();
	}
	if (typeof(page.buttons) == "string") {
		$(page.buttons).hide();
	}
	if (page.onHide){
		page.onHide();
	}
}


/**
 * Shows a page. Should be used in conjunction with push/pop.
 * 
 * If the page definition has an "onShow" method, this method is called after the page is displayed.
 * @param page
 */
function showPage(page) {
	if (typeof(page.main) == "string") {
		$(page.main).show();
	}
	if (typeof(page.buttons) == "string") {
		$(page.buttons).show();
	}
	if (page.onShow) { 
		page.onShow(); 
	}
}

/*
 * ########################################
 * 
 * Main Page
 * 
 * ########################################
 */
function init_mainPage() {
	
}

function onShow_mainPage() {
	// After the main page is shown, make sure the map is sized appropriately to the container.
    google.maps.event.trigger(map, 'resize');
}