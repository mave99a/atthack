// Gimme some string trim.
String.prototype.trim=function(){return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');};
String.prototype.ltrim=function(){return this.replace(/^\s+/,'');};
String.prototype.rtrim=function(){return this.replace(/\s+$/,'');};
String.prototype.fulltrim=function(){return this.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' ');};

// Fix the widgets...
gm.widgets.TextField.prototype.setValue = function (str) { 
	this.element.value = str; 
};


// We all need a to use a little math here and there. 
var Math = Math || {};
Math.length2d = function (x,y) {
	return Math.sqrt(x*x + y*y);
};
Math.dotProduct2d = function (x1,y1, x2,y2) {
	return x1*x2 + y1*y2;
};


// Override the Array prototype to return the last element in the array.
// Returns the last element in an array. 
Array.prototype.last = function() {
	return this[this.length-1];
};