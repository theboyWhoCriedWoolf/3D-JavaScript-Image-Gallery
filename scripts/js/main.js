//This callback is called after the scripts finish loading.
requirejs.config({ // load in jquery before plugin
    shim: {
        "scripts/js/plugins/Three.js": ["scripts/js/CubieView.js", "scripts/js/helper/Threasy.js", "scripts/js/helper/ImageUtils.js"]
    }
});
require
		([ 
		"scripts/js/plugins/domReady.js",
		"scripts/js/CubieView.js",
		"scripts/js/ControlPanel.js",
		"scripts/js/plugins/Three.js", 
		"scripts/js/plugins/Detector.js",
		"scripts/js/plugins/jquery.js",
		"scripts/js/helper/FileAPI.js"
		  ], function( domReady, CubieView, ControlPanel ) 
		 {
	    	// makes sure the init function waits for the dom to be ready
	   	 	// domReady.js provides multi browser support as not all browsers support DOMContentLoaded
	   	 	domReady(function () 
	   	 	{ 
	   	 		init( CubieView ); 
	   	 		initControls( ControlPanel );
	    	})
});

var _controlPanel;

function init( CubieView )
{
	showSpinner( true );
	_cubieView = new CubieView();
	_cubieView.init( viewReadyHandler );
}

function viewReadyHandler()
{
	showSpinner( false );
}


function imagesLoaded( images )
{
	_cubieView.dispose();
	_cubieView.loadImages( images );
}

/*
 * initialise controls
 */
function initControls( ControlPanel )
{
	FileAPI.init( document.getElementById("browse"), fileSelectedHandler, undefined, imagesLoaded, undefined, false );	
	var dom = document.getElementById("controlsPanel");
	_controlPanel = new ControlPanel();
	_controlPanel.init( dom, toggleLightsHandler, toggleDepthsHandler, slideMarginsHandler, randomiseSpin, toggleStatsHandler );
}


// [ HANDLERS 
	
	function fileSelectedHandler()
	{
		showSpinner( true );
	}
	
	function toggleLightsHandler( active )
	{
		if( !_cubieView ) return;
		( active ) ? _cubieView.addLights() : _cubieView.removeLights();
	}
	
	function toggleDepthsHandler( active )
	{
		if( !_cubieView ) return;
		( active ) ? _cubieView.changeDepths() : _cubieView.resetDepth();
	}
	
	function toggleStatsHandler( active )
	{
		if( !_cubieView ) return;
		( active ) ? _cubieView.addStats() : _cubieView.removeStats();
	}
	
	function randomiseSpin( active ) 
	{
		if( !_cubieView ) return;
		_cubieView.randomiseSpin( active );
	}
	
	function slideMarginsHandler( percentage )
	{
		if( !_cubieView ) return;
		_cubieView.changeMargin( percentage );
	}

 // ]


function showSpinner( show )
{
	if( show ) 
	{
		$('#container').css('display','none');
		$('.spinner-container').css('display','block');
	}
	else 
	{
		$('#container').css('display','block');
		$('.spinner-container').css('display','none');
	}
}
