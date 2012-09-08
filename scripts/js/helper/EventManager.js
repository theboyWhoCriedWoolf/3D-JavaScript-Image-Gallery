/**
 * EventManager 
 * @author Tal Woolf - http://theboywhocriedwoolf.com/
 */
var EventManager = ( function()
{
	var _genericEvent			= "genericEvent"
	var _touchAvailable 		= ( 'ontouchstart' in window );
	var _targetFunction 		= ( _touchAvailable ) ? getsureTarget_handler : target_handler
	var _handlers 				= [];
	var _contexts				= [];
	var _useUniqueID			= false; // start off without appending an ID
	var _useTouchBounds			= false; // start off false as only required for touch events
	
// [  ---------------------------------------------------- PUBLIC METHODS ---------------------------------------------------- ] \\

	/**
	 * capture all events
	 * Add event listeners for most popular types
	 * automatically detecting if touch events are available
	 * @param context			(Object) 					 - DOM element
	 * @param downHandler 		(Function|undefined|null)  	 - callback handler
	 * @param moveHandler 		(Function|undefined|null)  	 - callback handler
	 * @param upHandler 		(Function|undefined|null)  	 - callback handler
	 * @param overHandler 		(Function|undefined|null)  	 - callback handler
	 * @param outHandler 		(Function|undefined|null) 	 - Dcallback handler
	 * @param addDOMListeners 	(Boolean|null|undefined)     - add or remove from listener
	 */
	/** @expose */
	function captureEvents( context, downHandler, moveHandler, upHandler, overHandler, outHandler, addDOMListeners )
	{
		if( context === null ) return;
		if( addDOMListeners === ( undefined || null ) ) addDOMListeners = true;
		_captureContext = context;
		// touch events
		if( _touchAvailable )
		{
			( addDOMListeners )? addListener( context, "touchstart", downHandler, undefined ) :
							  	 removeListener( context, "touchstart", downHandler );
			( addDOMListeners )? addListener( context, "touchmove", moveHandler, undefined ) :
							  	 removeListener( context, "touchmove", moveHandler );
			( addDOMListeners )? addListener( context, "touchend", upHandler, undefined ) :
							  	 removeListener( context, "touchend", upHandler );
			return;
		} 
		// mouse events
		( addDOMListeners )? addListener( context, "mousedown", downHandler, undefined ) :
						  	 removeListener( context, "mousedown", downHandler );
		( addDOMListeners )? addListener( context, "mousemove", moveHandler, undefined ) :
						  	 removeListener( context, "mousemove", moveHandler );
		( addDOMListeners )? addListener( context, "mouseup", upHandler, undefined ) :
						   	 removeListener( context, "mouseup", upHandler );
		( addDOMListeners )? addListener( context, "mouseover", overHandler, undefined ) :
						  	 removeListener( context, "mouseover", overHandler );
		( addDOMListeners )? addListener( context, "mouseover", overHandler, undefined ) :
						  	 removeListener( context, "mouseover", overHandler );
		( addDOMListeners )? addListener( context, "mouseout", outHandler, undefined ) :
						  	 removeListener( context, "mouseout", outHandler );
	}
	
	/*
	 * automatically add listeners and swap based on touch event availability
	 */
	/** @expose */
	function autoAddListener( context, eventType, handler, id ) { autoAddRemove( context, eventType, handler, id, true ); }
	
	/**
	 * automaticaly remove the correct handler and
	 * switch between mouse and touch events
	 */
	/** @expose */
	function autoRemoveListener( context, eventType, handler ) { autoAddRemove( context, eventType, handler, undefined, false ); }
	
	/***
	 * add mouse or general events to a context
	 * if the context is null, append the handlers and event type
	 * under generic context - non interactive event
	 * @param context 		(object|undefined|null)  	 		- DOM element to append to - must be window for orientatiin events
	 * @param eventType		(String|undefined|null)     		- type of event or reference
	 * @param handler		(Function|undefined|null)   		- the handler or callback method
	 * @param id			(int|undefined|null)  			- unique id if _useUniqueID is true. if left undefined and id will automatically be appenede
	 * 					  	for best results leave ID undefined
	 */
	/** @expose */
	function addListener( context, eventType, handler, id )
	{
		if( context && !isMouseEvent( eventType ) ) return;	
// 			
		var orientation		= isOrientation( eventType );
		var ctx 			= ( context === ( undefined || null ) )?  _genericEvent : appendID( context, id );
		eventType			= ( orientation ) ? orientationEventType( eventType ) : eventType;
// 		
		if( exists( ctx, eventType, handler ) ) return;				// if exists, needs to be after the context assignment above
		addToHandlers( ( ctx.uniqueID || ctx ), eventType, handler );
		addToDomElement( ctx, eventType, orientation )
	}
	
	
	/**
	 * remove event listeners from handlers array
	 * and element, if no context passed will just remove
	 * from the dictionary
	 * @param context 		(object|undefined|null)  	 		- DOM element to append to - must be window for orientatiin events
	 * @param eventType		(String|undefined|null)     		- type of event or reference
	 * @param handler		(Function|undefined|null)   		- the handler or callback method
	 */
	/** @expose */
	function removeListener( context, eventType, handler )
	{
		if( handler === ( undefined || null ) ) return;
		if( context && !isMouseEvent( eventType ) ) return;	
		
		var orientation		= isOrientation( eventType );
		eventType			= ( orientation ) ? orientationEventType( eventType ) : eventType;
		
		removeFromHandlers( ( context )? context.uniqueID : _genericEvent, eventType, handler )
		removeFromDomElement( context, eventType, orientation )
	}
	
	/***
	 * swap out handlers 
	 * @param context 			(Object|undefined|null)  			- DOM element to append listener to
	 * @param eventType			(String|undefined|null) 			- type of event to appent and listen for
	 * @param currentHandler	(Function|undefined|null)   		- handler already assigned
	 * @param newHandler		(Function|undefined|null) 			- replacement handler 
	 */
	/** @expose */
	function swapHandler( context, eventType, currentHandler, newHandler )
	{
		var cntx		= ( context ) ? context.uniqueID : _genericEvent;
		var definedType = getAutoEventType( eventType, currentHandler, false );
		eventType 		= ( _touchAvailable ) ? definedType.eventType : eventType;
		
		if( !checkValidity( cntx , eventType ) )
		{
			currentHandler = newHandler; // if the listener not yet active set the handler
			return;
		} 
		
		if( !exists( cntx , eventType, currentHandler ) ) return;
		var handlers 	= _handlers[ cntx ][ eventType ];
		var handlerFunction;
		var i = handlers.length;
		while( --i > -1 )
		{
			handlerFunction = handlers[ i ];
			if(  handlerFunction == currentHandler )
			{
				handlers[ i ] = newHandler
				handlerFunction = undefined;
			}
		}
	}
	
	/**
	 * dispatch generic events contained, not appended to a DOM element
	 * @param eventType 	(String)  					- reference or id used to add a listener
	 * @param args			(object|undefined|null) 	- any arguments to pass to the listening handlers
	 */
	/** @expose */
	function dispatch( eventType, args )
	{
		if( !checkValidity( _genericEvent, eventType ) ) return;
		
		var handlers =  _handlers[ _genericEvent ][ eventType ];
		var handlerFunction;
		var i = handlers.length;
		while( --i > -1 )
		{
			handlerFunction = handlers[ i ];
			if( handlerFunction ) handlerFunction( args ); 
		}
	}
	
	/**
	 * force manager to append unique ID's to handlers when they are first set
	 * allows different DOM elements to each have listeners registered to
	 * them even if they are of the same type i.e. DIV
	 * @param value (Boolean) 
	 */
	/** @expose */
	function useUniqueID( value ) { _useUniqueID = value; }
	
	/**
	 * Check the bounds of the DOM element and check if the mouse 
	 * point intersects with the element. If it does not then 
	 * prevent event from being called
	 * @param value (Boolean) 
	 */
	/** @expose */
	function useTouchBounds( value ) { _useTouchBounds = value; }
	
	/*
	 * dispose of the event manager and
	 * wipe the dictionary
	 */
	/** @expose */
	function dispose() 
	{ 
		// loop through and remove events from DOM elements
		var registeredEvent;
		var ctx;
		for( registeredEvent in _contexts )
		{
			ctx 						= _contexts[ registeredEvent ];
			if( ctx[ 'uniqueID' ] )		ctx[ 'uniqueID' ] = undefined;
			removeFromDomElement( ctx, registeredEvent, isOrientation( registeredEvent ) )
		}
		
		_click_handler			= undefined;
		_mouseDown_handler		= undefined;
		_mouseUp_handler		= undefined;
		_mouseMove_handler		= undefined;
		_mouseOver_handler		= undefined;
		_mouseOut_handler		= undefined;
		_handlers				= [];
		_contexts 				= [];
	}
	
	
// [  -------------------------------------------------------------------------------------------------------- ] \\
	
// [  ---------------------------------------------------- PRIVATE METHODS ---------------------------------------------------- ] \\
	
	
	/*
	 * return a unique id if optioned to or if possible
	 */
	function appendID( context, id ) 
	{ 
		if( !_useUniqueID || ( context.self === window ) ) return ( context.uniqueID = context );
		if( context[ 'uniqueID' ] === undefined ) context[ 'uniqueID' ] = ( id ) ? id : ( ( context.localName || "element" )  + ( new Date().valueOf() ) );
		return context;
	}
	
	/*
	 * check to see if handler exists already for its type
	 * under its context
	 */
	function exists( context, eventType, handler )
	{
		if( !checkValidity( context, eventType ) ) return false;
		var handlers = _handlers[ context ][ eventType ];
		
		var handlerFunction;
		var i = handlers.length;
		while( --i > -1 )
		{
			handlerFunction = handlers[ i ];
			if( handlerFunction === handler ) return true;
		}
		return false;
	}
	
	/*
	 * add to dictionary by context and type
	 * each time getting the length of the current array 
	 * appending the new handler at the next available index
	 */
	function addToHandlers( context, eventType, handler )
	{
		if( ! _handlers[ context ] ) _handlers[ context ] = [];
		if( ! _handlers[ context ][ eventType ] )  _handlers[ context ][ eventType ] = [];
		
		var index 					= _handlers[ context ][ eventType ].length;
		var handlersArray			= _handlers[ context ][ eventType ];
		handlersArray[ index ] 		= handler;
	}
	
	/*
	 * remove events from dictionary 
	 */
	function removeFromHandlers( context, eventType, handler )
	{
		if( !checkValidity( context, eventType ) ) return;
		var handlers = _handlers[ context ][ eventType ];
		
		var i = handlers.length;
		while( --i > -1 )
		{
			if( handlers[ i ] == handler )
			{
				handlers.splice( i, 1 );
			}
		}
		if( _handlers[ context ][ eventType ].length < 1 ) 
		{
			_handlers[ context ][ eventType ] 	= undefined; // remove from array if empty 
			delete _handlers[ context ][ eventType ];
		}
	}
	
	/*
	 * check valid
	 */
	function checkValidity( context, eventType )
	{
		if( _handlers[ context ] === undefined ) return false;
		if( _handlers[ context ][ eventType ] === undefined  ) return false;
		return true;
	}
	
	/*
	 * Add mouse or touch events to dom element
	 *  Add method utalises John Resig's Flexible Javascript Methods
	 * which loops through to detrmin what tyoe of events are available in accordance to the browser used
	 */
	function addToDomElement( context, eventType, orientationEvent ) 
	{
		if( context === _genericEvent ) return;
		if( _handlers[ context.uniqueID ][ eventType ].length > 1  ) return;

		var fn = ( orientationEvent ) ? deviceMotionTargetHandler : _targetFunction;
		if ( context.attachEvent && context !== window ) 
		{
		   context[ 'e' + eventType + fn ] = fn;
		   context[ eventType + fn ] = function() { context[ 'e' + eventType + fn ] ( window.event ); }
		   context.attachEvent( 'on' + eventType, context[ eventType + fn ] );
		} 
		else context.addEventListener( eventType, fn, false );
		_contexts[ eventType ] = context;
	}
	
	/*
	 * remove from dom element
	 * Removal method utalises John Resig's Flexible Javascript Methods
	 * which loops through to detrmin what tyoe of events are available in accordance to the browser used
	 */
	function removeFromDomElement( context, eventType, orientationEvent )
	{
		if( context === _genericEvent ) return;
		if( !isUndefined( context.uniqueID, eventType ) ) return;
		
		var fn = ( orientationEvent ) ? deviceMotionTargetHandler : _targetFunction;
		if ( context.detachEvent && context !== window ) 
		{
		    context.detachEvent( 'on' + eventType, context[ eventType + fn ] );
		    context[ eventType + fn ] = null;
		} 
		else context.removeEventListener( eventType, fn, false );
    	_contexts[ eventType ] = undefined;
    	checkContext( context, eventType );
	}
	
	/*
	 * remove the context completely
	 */
	function checkContext( context, eventType )
	{
		var types;
		for ( var evts in _handlers[ context.uniqueID ] ){ types = evts; }
		if( types === undefined ) 
		{
			context.uniqueID = undefined;
			delete _handlers[ context.uniqueID ] ;
		}
	}

	// return orientation event
	function orientationEventType( eventType ) 
	{ 
		if( eventType === 'deviceorientation' && window.DeviceOrientationEvent !== undefined ) return eventType;
		return 'devicemotion'
	}
	
	/**
	 * // check if orientation is available 
	 * @return BOOL
	 */
	function isOrientation( eventType )
	{
		if( eventType === "deviceorientation"  ||  eventType === "devicemotion" )
		{
			if( ( window.DeviceOrientationEvent !== undefined ) || ( window.DeviceMotionEvent !== undefined ) ) return true;
		}
		return false;
	}
	
	/*
	 * determin if event is supported and is mouseEvent
	 */
 	function isMouseEvent( eventType ) 
	{
		if( ( ( typeof  eventType ) !== "string"  ) ) return false;
		if( isOrientation( eventType ) ) return true;
	    var el = document.createElement('div');
	    eventType = 'on' + eventType;
	    
	    var isSupported = ( eventType in el );
	    if ( !isSupported ) 
	    {
	      el.setAttribute( eventType, 'return;' );
	      isSupported = typeof el[ eventType ] == 'function';
	    }
	    el = null;
	    return isSupported;
	}
	
	/*
	 * check to see if the events array is empty
	 * and or it no longer exists
	 */
	function isUndefined( context, eventType ) 
	{ 
		if( _handlers[ context ] === undefined ) return true;
		return ( !( _handlers[ context ][ eventType ] ) || ( _handlers[ context ][ eventType ] === undefined ) ) 
	}
	
	/*
	 * add or remove and automatically assign
	 * listeners depending on if capture events are available
	 */
	function autoAddRemove( context, eventType, handler, id, add )
	{
		var definedType = getAutoEventType( eventType, handler, true );
		if( !isMouseEvent( definedType.eventType ) ) return
		
		( add ) ? addListener( context, definedType.eventType, definedType.handler, id ) : removeListener( context, definedType.eventType, definedType.handler );
	}
	
	/*
	 * return the event type and set the default handlers 
	 * if the handler allocated is undefined
	 */
	function getAutoEventType( eventType, handler, setUndefinedHandlers )
	{
		var setHandler = handler;
		
		switch( eventType )
		{
			case "click" 		:
			case "touchstart" 	:
			case "mousedown"	:
				eventType = ( _touchAvailable ) ? "touchstart" : ( eventType === "mousedown" )? 'mousedown' : 'click';
				if( setHandler === undefined && setUndefinedHandlers ) setHandler = _mouseDown_handler;
				break;
				
			case "mousemove"	:
			case "touchmove"	:
				eventType = ( _touchAvailable ) ? "touchmove" : "mousemove";
				if( setHandler === undefined && setUndefinedHandlers ) setHandler = _mouseMove_handler;
				break;
			
			case "touchend" 	:
			case "mouseup"		:
				eventType = ( _touchAvailable ) ? "touchend" : "mouseup";
				if( setHandler === undefined && setUndefinedHandlers ) setHandler = _mouseUp_handler;
				break
		}
		return { eventType : eventType, handler : setHandler };
	}
	
	
// [ --------------------- DISPATCH LOOPS ------------------- ] \\ 
	
	/*
	 * loop through handlers
	 */
	function target_handler( event ) 
	{
		( event.preventDefault() ) ? event.preventDefault() : event.returnValue = false;
		event.stopPropagation();
		
		var evntTarget	 	= ( event.currentTarget || event.srcElement );
		var handlers 		= _handlers[ evntTarget.uniqueID ][ event.type ];
		if( handlers === undefined ) return;
		
		var handlerFunction;
		var i = handlers.length;
		while( --i > -1 )
		{
			handlerFunction = handlers[ i ];
			if( handlerFunction ) handlerFunction( getMouseOffsetChords( event, evntTarget ) ); 
		}
	}
	
	/*
	 * return mouse chords 
	 * if element is not aligned at a zero chordinate
	 * or screen has scrolled to another position provides offset
	 */
	function getsureTarget_handler( event ) 
	{
		( event.preventDefault() ) ? event.preventDefault() : event.returnValue = false;
		event.stopPropagation();
		
		var element 			= ( event.currentTarget || event.srcElement );
		var touch 				= { x: null, y: null, isPressed: false, id : 0, event: null, uniqueID : -1 },
	    body_scrollLeft 		= document.body.scrollLeft,
	    element_scrollLeft 		= document.documentElement.scrollLeft,
	    body_scrollTop 			= document.body.scrollTop,
        element_scrollTop 		= document.documentElement.scrollTop,
        offsetLeft 				= ( element.offsetLeft || 0 ),
	    offsetTop 				= ( element.offsetTop || 0 ); 
		
		var x, y,
		touchID		= ( event.touches.length ),
		touch_event = event.touches[ touchID - 1 ]; 
		switch( event.type )
		{
			case 'touchstart' :
			
			  	if ( event.touches.length == 1 ) //first touch
			  	{
			  		touch.isPressed = true;
			  	}
			  	x = touch_event.pageX;
			   	y = touch_event.pageY;	
			  	
				break;
			
			case 'touchmove' :
			    
			    touchID = 0;
			    touch_event = event.touches[ touchID ]; // only record first touch
			    if ( touch_event.pageX || touch_event.pageY ) 
			    {
			      x = touch_event.pageX;
			      y = touch_event.pageY;
			    } 
			    else 
			    {
			      x = touch_event.clientX + body_scrollLeft + element_scrollLeft;
			      y = touch_event.clientY + body_scrollTop + element_scrollTop;
			    }
			    x -= offsetLeft;
			    y -= offsetTop;

				break;
			
			case 'touchend' :

			  	touch.isPressed = false;
			    touch.x = null;
			    touch.y = null;
				break;
		} 
		
		touch.x 	= x;
		touch.y 	= y;
		touch.event = event;
		uniqueID	= ( element.uniqueID || -1 );
		
		// return if x pos or y pos are no longer within eleemnt
		if( _useTouchBounds ){ if( !containsPoint( getBounds( element ), touch.x, touch.y ) ) return; };
		
		var handlers = _handlers[ element.uniqueID ][ event.type ];
		if( handlers === undefined ) return;
		
		var handlerFunction;
		var i = handlers.length;
		while( --i > -1 )
		{
			handlerFunction = handlers[ i ];
			if( handlerFunction ) handlerFunction( touch ); 
		}
	}
	
	/**
	 * device motion target handler
	 */
	function deviceMotionTargetHandler( event )
	{
		( event.preventDefault() ) ? event.preventDefault() : event.returnValue = false;
		event.stopPropagation();
		
		var orientation 	= { gamma : 0, beta : 0, alpha : 0, cssRotation : 0, absolute : false, event : null };
		orientation.event 	= event;
		
		switch( event.type )
		{
			case 'deviceorientation' :
				 // alpha is the compass direction the device is facing in degrees
				orientation.alpha 			= Math.round( event.alpha );
				 // beta is the front-to-back tilt in degrees, where front is positive
				orientation.beta			= Math.round( event.beta ) * -1;
				 // gamma is the left-to-right tilt in degrees, where right is positive
				orientation.gamma			= Math.round( event.gamma );
				orientation.cssRotation		= "rotate(" + orientation.gamma + "deg) rotate3d(1,0,0, " + (orientation.beta) + "deg)";
				break;
			
			case 'devicemotion' :
				var acceleration 			= event.accelerationIncludingGravity;
				// var rawAcceleration = "[" +  Math.round(acceleration.x) + ", " + Math.round(acceleration.y) + ", " + Math.round(acceleration.z) + "]";
				var facingUp = 1;
				if (acceleration.z > 0 ) 
				{
				   facingUp = -1;
				}
				 // alpha is the compass direction the device is facing in degrees
				orientation.alpha 			= facingUp;
				 // beta is the front-to-back tilt in degrees, where front is positive
				orientation.beta			= Math.round(((acceleration.y + 9.81) / 9.81 ) * 90 * facingUp) - 90;
				 // gamma is the left-to-right tilt in degrees, where right is positive
				orientation.gamma			= Math.round(((acceleration.x) / 9.81) * -90) * -1;
				orientation.cssRotation		= "rotate(" + orientation.gamma + "deg) rotate3d(1,0,0, " + (orientation.beta) + "deg)";
				break;
		}
		
		if( window.orientation ) switchOrientation( orientation );
		if( event.absolute ) orientation.absolute = event.absolute;
		
		var handlers = _handlers[ event.target ][ event.type ];
		if( handlers === undefined ) return;
					
		var handlerFunction;
		var i = handlers.length;
		while( --i > -1 )
		{
			handlerFunction = handlers[ i ];
			if( handlerFunction ) handlerFunction( orientation ); 
		}
	}
	
	/*
	 * switch oriantation depending on window
	 * rotation if avaialable
	 */
	function switchOrientation( orientation )
	{
		var xDelta, yDelta;
		switch (window.orientation) 
        {
            case 0:
            	xDelta				= orientation.gamma;
            	yDelta				= orientation.beta;
                break;
            case 180:
            	xDelta 				= orientation.gamma * -1;
                yDelta 				= orientation.beta * -1;
                break;
            case 90:
             	xDelta 				= orientation.beta * -1;
                yDelta 				= orientation.gamma;
                break;
            case -90:
                xDelta 				= orientation.beta;
                yDelta 				= orientation.gamma * -1;
                break;
            default:
            	xDelta 				= orientation.gamma;
                yDelta 				= orientation.beta;
               break;
        }
        orientation.gamma 			= xDelta;
        orientation.beta			= yDelta;
	}
	
	
	/*
	 * return mouse chords 
	 * if element is not aligned at a zero chordinate
	 * or screen has scrolled to another position provides offset
	 */
	function getMouseOffsetChords( event, element )
	{
	    var mouse 				= { x: 0, y: 0, uniqueID : -1, event: null },
	    body_scrollLeft 		= document.body.scrollLeft,
	    element_scrollLeft 		= document.documentElement.scrollLeft,
	    body_scrollTop 			= document.body.scrollTop,
	    element_scrollTop 		= document.documentElement.scrollTop,
	    offsetLeft 				= ( element.offsetLeft || 0 ),
	    offsetTop 				= ( element.offsetTop || 0 );
	      
		var x, y;
	    if ( event.pageX || event.pageY ) 
	    {
	      x = event.pageX;
	      y = event.pageY;
	    } 
	    else 
	    {
	      x = event.clientX + body_scrollLeft + element_scrollLeft;
	      y = event.clientY + body_scrollTop + element_scrollTop;
	    }
	    x -= offsetLeft;
	    y -= offsetTop;
	    
	    mouse.x 		= x;
	    mouse.y 		= y;
	    mouse.event 	= event;
	    mouse.uniqueID	= ( mouse.uniqueID || -1 );
	    return mouse;
	}
	
	/**
	 * Determine if a rectangle contains the coordinates (x,y) within it's boundaries.
	 * @param rect 	(Object)  Object with properties: x, y, width, height.
	 * @param x		(Number)  Coordinate position x.
	 * @param y		(number)  Coordinate position y.
	 * @return (Boolean)
	 */
	function containsPoint( rect, x, y ) 
	{
	  return !(x < rect.x ||
	           x > rect.x + rect.width ||
	           y < rect.y ||
	           y > rect.y + rect.height);
	}
	
	/**
	 * Create object bounds and replicate
	 * rect 
	 * @param target 		(Object)  - DOM element
	 * @return (object)
	 */
	function getBounds( target ) 
	{
	  return {
	    x: 0,
	    y: 0,
	    width	: ( target.innerWidth || target.clientWidth ),
	    height	: ( target.innerHeight || target.clientHeight )
	  };
	}
	
	
// [  -------------------------------------------------------------------------------------------------------- ] \\
	
	return { // return back visible class methods and properties
		addListener 			: addListener,	// ------------------- add mouse or egeneral listener
		removeListener			: removeListener, //------------------ remove mouse or general listener
		autoAddListener			: autoAddListener,	// --------------- automatically switch listeners between touch and mouse events
		autoRemoveListener		: autoRemoveListener, // ------------- automatially remove touch or mouse events
		swapHandler 			: swapHandler, // -------------------- swap out previously assigned handlers
		captureEvents			: captureEvents, // ------------------ add all mouse or touch events based on device
		dispatch				: dispatch,	// ----------------------- dispatch an event
		dispose					: dispose, // ------------------------ dispose ( wipe event manager )
		useUniqueID				: useUniqueID, // -------------------- append a unique ID to the DOM element
		useTouchBounds			: useTouchBounds //------------------- used for touch events, restrict touches to bounds of DOM element
	}
}());