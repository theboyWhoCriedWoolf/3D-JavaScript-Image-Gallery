/**
 * Request animation frame
 */
if ( !window.requestAnimationFrame ) {

	window.requestAnimationFrame = ( function() {

		return window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame || // comment out if FF4 is slow (it caps framerate at ~30fps: https://bugzilla.mozilla.org/show_bug.cgi?id=630127)
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element ) {
			window.setTimeout( callback, 1000 / 60 );
		};

	} )();

}

/**
 * Cancel request animation frame and stop the animation loop / enter frame being 
 * executed
 */
if (!window.cancelRequestAnimationFrame) {
  window.cancelRequestAnimationFrame = (window.cancelAnimationFrame ||
                                        window.webkitCancelRequestAnimationFrame ||
                                        window.mozCancelRequestAnimationFrame ||
                                        window.msCancelRequestAnimationFrame ||
                                        window.oCancelRequestAnimationFrame ||
                                        window.clearTimeout);
}


window.utils = {};


/**
 * Returns a color in the format: '#RRGGBB', or as a hex number if specified.
 * @param {number|string} color
 * @param {boolean=}      toNumber=false  Return color as a hex number.
 * @return {string|number}
 */
window.utils.parseColor = function (color, toNumber) 
{
  if (toNumber === true ) {
    if (typeof color === 'number') {
      return (color | 0); //chop off decimal
    }
    if (typeof color === 'string' && color[0] === '#') 
    {
      color = color.slice(1);
    }
    return window.parseInt(color, 16);
  } else 
  {
    if (typeof color === 'number') 
    {
      color = '#' + ('00000' + (color | 0).toString(16)).substr(-6); //pad
    }
    return color;
  }
};

/**
 * Converts a color to the RGB string format: 'rgb(r,g,b)' or 'rgba(r,g,b,a)'
 * @param {number|string} color
 * @param {number}        alpha
 * @return {string}
 */
window.utils.colorToRGB = function (color, alpha) {
  //number in octal format or string prefixed with #
  if (typeof color === 'string' && color[0] === '#') {
    color = window.parseInt(color.slice(1), 16);
  }
  alpha = (alpha === undefined) ? 1 : alpha;
  //parse hex values
  var r = color >> 16 & 0xff,
      g = color >> 8 & 0xff,
      b = color & 0xff,
      a = (alpha < 0) ? 0 : ((alpha > 1) ? 1 : alpha);
  //only use 'rgba' if needed
  if (a === 1) {
    return "rgb("+ r +","+ g +","+ b +")";
  } else {
    return "rgba("+ r +","+ g +","+ b +","+ a +")";
  }
};


/**
 * Converts a 24bit Hexidecimal to a red, green, blue Object
 * 
 * @param	hex		A 24bit Hexidecimal to convert
 * @return	Object	An Object containign values for red, green and blue
 */
Hex24ToRGB = function ( hex ) 
{
	var R = hex >> 16 & 0xFF;
	var G = hex >> 8 & 0xFF;
	var B = hex & 0xFF;
	
	return { red:R, green:G, blue:B };
};


/**
 * Combines two colours
 * using their rgb
 */
window.utils.CombineColours = function( colour1, colour2 )
{
	var RGB1 = Hex24ToRGB( utils.parseColor( colour1, true ) );
	var RGB2 = Hex24ToRGB( utils.parseColor( colour2, true ) );
	var alpha = alpha; // must redeclare in local scope otherwise javascript makes variable in global scope
	
	if( !alpha ){ alpha = 1; }
	
	var r = RGB1.red + RGB2.red;
	var g = RGB1.green + RGB2.green; 
	var b = RGB1.blue + RGB2.blue;
	
	var colour = (r<<16)|(g << 8)|b; 
	return utils.parseColor( colour );
}

/*
 * radians to degrees
 */
window.utils.deg2Rad = function( degrees ) { return degrees * Math.PI / 180; }

/*
 * radians to degrees
 */
window.utils.rad2Deg = function( radians ) { return radians * 180 / Math.PI; }

/*
 * modulate
 */
var _2PI = ( 2 * Math.PI );
window.utils.mudulateRADRotation = function( value ){ return ( value % _2PI ) }

/*
 * get nearest to to a range of numbers
 * in this case rotations, passing oin the max rotation
 * does not allow for negative values
 */
window.utils.getNearestPositiveRotation = function( value, maxRange ) 
{
	 // keep the value in range (0, 360)
	 if (value<0) {
	   value= maxRange - (-value % maxRange);
	 } else if (value>maxRange) {
	  value=value % maxRange;
	 }
 	return Math.floor( 0.5 + ( value / 90.0 ) );
}

/*
 * get the nearest position to 90 degree quarter angles
 */
window.utils.getNearestRotation = function( value, maxRange ) 
{
	 // return nearest even if minus
	value = value % maxRange;
 	return Math.abs( Math.floor( 0.5 + ( value / 90.0 ) ) );
}

/*
 * return random range
 */
window.utils.randRange = function( minNum, maxNum ) { return ( Math.floor( Math.random() * ( maxNum - minNum + 1 ) ) + minNum ); }


/**
 * Returns the strongest colour value between two colours
 */
window.utils.strongestColour = function( colour1, colour2 ) 
{
	var RGB1 = Hex24ToRGB( utils.parseColor( colour1, true ) );
	var RGB2 = Hex24ToRGB(  utils.parseColor( colour2, true ) );
	var winningColour;
	
	var total1  =  RGB1.red +  RGB1.green +  RGB1.blue;
	var total2  =  RGB2.red +  RGB2.green +  RGB2.blue;
	
	winningColour = ( total1 > total2 )? RGB1 : RGB2;
	return utils.parseColor( (winningColour.red<<16)|(winningColour.green << 8)|winningColour.blue ); 
}


/**
 * Determine if a rectangle contains the coordinates (x,y) within it's boundaries.
 * @param {object}  rect  Object with properties: x, y, width, height.
 * @param {number}  x     Coordinate position x.
 * @param {number}  y     Coordinate position y.
 * @return {boolean}
 */
window.utils.containsPoint = function (rect, x, y) {
  return !(x < rect.x ||
           x > rect.x + rect.width ||
           y < rect.y ||
           y > rect.y + rect.height);
};


/*
 * create bounds
 */
window.utils.bounds = function( x, y, width, height )
{
	 return {
	 	x: x,
   	 	y: y,
    	width: width,
    	height: height
	};
}


/**
 * Keeps track of the current mouse position, relative to an element.
 * @param {HTMLElement} element
 * @return {object} Contains properties: x, y, event
 */
window.utils.captureMouse = function (element) {
  var mouse = {x: 0, y: 0, event: null},
      body_scrollLeft = document.body.scrollLeft,
      element_scrollLeft = document.documentElement.scrollLeft,
      body_scrollTop = document.body.scrollTop,
      element_scrollTop = document.documentElement.scrollTop,
      offsetLeft = element.offsetLeft,
      offsetTop = element.offsetTop;
  
  element.addEventListener('mousemove', function (event) {
    var x, y;
    
    if (event.pageX || event.pageY) {
      x = event.pageX;
      y = event.pageY;
    } else {
      x = event.clientX + body_scrollLeft + element_scrollLeft;
      y = event.clientY + body_scrollTop + element_scrollTop;
    }
    x -= offsetLeft;
    y -= offsetTop;
    
    mouse.x = x;
    mouse.y = y;
    mouse.event = event;
    
    console.log("mouse :: " + mouse.x )
    
  }, false);
  
  return mouse;
};



