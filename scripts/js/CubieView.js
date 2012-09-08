requirejs.config({ // load in jquery before plugin
    shim: {
        "scripts/js/plugins/Three.js": ["scripts/js/helper/Threasy.js", "scripts/js/helper/CubieCreator.js", "scripts/js/helper/ImageUtils.js", "scripts/js/plugins/THREEx.WindowResize.js"]
    }
});
define
	([ 
		"scripts/js/helper/CubieCreator.js",
		"scripts/js/helper/Threasy.js",
		"scripts/js/helper/EventManager-min.js",
		"scripts/js/helper/utils.js",
		"scripts/js/helper/Stats.js",
		"scripts/js/helper/ImageUtils.js",
		"scripts/js/plugins/microcache.js",
		"scripts/js/plugins/THREEx.WindowResize.js"
	], function( CubieCreator )
{
	var CubieView = function()
	{
		// private properties
			
		var _currentIntersectingCube;
		var _animationRequest;
		var info;
		var _lightsOn					= false;
		
		var _totalImages				= 25;
		var _cubes;
		var _slicedMaterials;
		var _currentCube				= undefined;
		var _directionLightRef			= "directionalLight";
		var _sceneLight;
		
		// cube properties
		var _cubesWidth 				= 100;
		var _cubesHeight				= 100;
		var _cubesZ						= 100;
		var _margin						= 0;
		
		var _domElement;
		var _stats;
		
		var _cameraZReduction			= 600;
		
		// animation controls and properties
		var _mouseXOnMouseDown 			= 0;
		var _mouseYOnMouseDown 			= 0;
		var _selectedCubeX				= undefined;
		var _selectedCubeY				= undefined;
		var _targetRotationX			= 0;
		var _targeXtRotationOnMouseDown	= 0;
		var _targetRotationY			= 0;
		var _targetYRotationOnMouseDown	= 0;
		var _mouseX						= 0;
		var _mouseY						= 0;
		var _spinEase					= 0.09;
		var _cubesFlipped				= false;
		var _timeout 					= 20;
		var _centerVector				= 0;
		var _randomiseFlip				= false;
		
		// bounds props
		var _yLength					= 25;
		var _boundLeeway				= 5;
		var _swipeBounds;
		
		var _counter					= 0;
		
		// camera movement properties
		var _windowHalfX;
		var _windowHalfY;
		var _camMouseX 					= 0;
		var _camMouseY 					= 0;
		var _camMovementEase			= 0.5;
		
		// lights
		var _numLights 					= 7;
		var _maxDepth 					= 100;
		var _minDepth 					= 100;
		
		var _viewReadyHandler;
		var _spinTimeoutIndex;
		
		/*
		 * init view
		 */
		function init( viewReadyHandler )
		{
			
			_viewReadyHandler = viewReadyHandler;
			// // get DOM element
			_domElement = document.getElementById('container'); 
			
			// instatiate view
			initiateThreasy();
			// assign renderer to cach textures
			ImageUtils.webGLRendererCache = Threasy.renderer._microCache;
			loadImages();
			
			// add listener
			EventManager.autoAddListener( _domElement, "mousedown", mouseDown_handler );
			
			_windowHalfX = window.innerWidth >> 1;
			_windowHalfY = window.innerHeight >> 1;
			
			EventManager.autoAddListener( _domElement, "mousemove", moveToMouse );
			drawFloor();
		}
		
		/*
		 * start loading in images
		 * either create urls or load an array of urls passed
		 */
		function loadImages( urls )
		{
			CubieCreator.setCubeProperties( cubeResetCounter, spinCompletedHandler, _cubesWidth, _cubesHeight, _cubesZ, _margin  );
			CubieCreator.init( urls || prepareUrls(), cubesCreatedAndReady, true, true, Threasy.webgl, Threasy );
		}
		
		/*
		 * prepare urls
		 */
		function prepareUrls()
		{
			var url;
			var urls = [];
			var imagePath = "images/";
			var i = _totalImages;
			while( --i > -1 )
			{
				url = imagePath + utils.randRange( 0, _totalImages ) +".png";
				urls[ i ] = url;
			}
			return urls;
		}
		
		/*
		 * draw flooring 
		 */
		function drawFloor()
		{
			Threasy.scene.fog = new THREE.Fog( 0x222222, 1500, 4000 );
			
			var imageCanvas = document.createElement( "canvas" ),
					context = imageCanvas.getContext( "2d" );

				imageCanvas.width = imageCanvas.height = 128;

				context.fillStyle = "#222222";
				context.fillRect( 0, 0, 128, 128 );

				context.fillStyle = "#3ca690";
				context.fillRect( 0, 0, 64, 64);
				context.fillRect( 64, 64, 64, 64 );

				var textureCanvas = new THREE.Texture( imageCanvas, THREE.UVMapping, THREE.RepeatWrapping, THREE.RepeatWrapping );
					materialCanvas = new THREE.MeshBasicMaterial( { map: textureCanvas } );

				textureCanvas.needsUpdate = true;
				textureCanvas.repeat.set( 500, 500 );

				var textureCanvas2 = new THREE.Texture( imageCanvas, THREE.UVMapping, THREE.RepeatWrapping, THREE.RepeatWrapping, THREE.NearestFilter, THREE.NearestFilter );
					materialCanvas2 = new THREE.MeshBasicMaterial( { color: 0xffccaa, map: textureCanvas2 } );

				textureCanvas2.needsUpdate = true;
				textureCanvas2.repeat.set( 500, 500 );

				var geometry = new THREE.PlaneGeometry( 100, 100 );

				var meshCanvas = new THREE.Mesh( geometry, materialCanvas );
				meshCanvas.scale.set( 500, 500, 500 );
				
				meshCanvas.position.y = 50;

				var meshCanvas2 = new THREE.Mesh( geometry, materialCanvas2 );
				meshCanvas2.scale.set( 500, 500, 500 );

				meshCanvas2.position.y = 50;

				Threasy.addToScene( meshCanvas );
				imageCanvas = null;
		}
		
		/*
		 * move scene to mouse position
		 */
		function moveToMouse( event )
		{
			_camMouseX = ( event.x - _windowHalfX );
			_camMouseY = ( event.y - _windowHalfY );
		}
		
		/*
		 * initiate the view
		 * once the cubes have loaded and textures created
		 */
		function cubesCreatedAndReady( cubes, slicedMaterials )
		{
			 initiateLights();
			 
			_cubes 				= cubes;
			_slicedMaterials	= slicedMaterials;
			addCubesToScene();	// populate scene
			positionCamera();	// position scene camera
			animate();			// start animating
			
			if( _viewReadyHandler ) _viewReadyHandler();
		}
		
		/*
		 * populate scene with loaded cubes
		 */
		function addCubesToScene()
		{
			var cube;
			var i = _cubes.length;
			while( --i > -1 )
			{
				cube = _cubes[ i ];
				Threasy.addToScene( cube.mesh ); 
			}			
		}
		
		/*
		 * position camera
		 * center the camera and change the z depth to fit in al cubes
		 */
		function positionCamera( omitZ )
		{
			var cubeHeight				= CubieCreator.cubeHeight();
			var cubeWidth				= CubieCreator.cubeWidth();
			var cubeMargin				= CubieCreator.cubeMargin();
			var columns					= CubieCreator.numColumns();
			var rows					= CubieCreator.numRows();
			
			var viewProperties 			= CubieCreator.viewProperties();
			var xPos 					= ( viewProperties.totalWidth >> 1 ) + ( cubeWidth >> 1 ); 
			var yPos					= ( viewProperties.totalHeight >> 1 ); 
			var area 					= ( ( cubeWidth + cubeMargin )  * columns ) + (  ( cubeHeight + cubeMargin )  * rows );
			
			// omit z position and use original
			Threasy.camera.position 	= new THREE.Vector3( xPos, yPos, ( omitZ )? Threasy.camera.position.z : ( area  - _cameraZReduction ) ); 
			_centerVector				= new THREE.Vector3( xPos, yPos, 0 );
				
		}
		
		/*
		 * add stats
		 */
		function addStats()
		{
			_stats = new Stats();
			_stats.domElement.style.position = 'absolute';
			_stats.domElement.style.top = '0px';
			_domElement.appendChild( _stats.domElement );
		}
		// remove stats
		function removeStats() { _domElement.removeChild( _stats.domElement ); _stats = undefined; }
		
		/*
		 * initiate Threasy
		 */
		function initiateThreasy()
		{
			Threasy.maxLights( _numLights );
			Threasy.init( _domElement, window.innerWidth, window.innerHeight ); 
			
			var fov = 2 * Math.atan( 24 / ( 30 * 2 ) ) * ( 180 / Math.PI );
			var camera = new THREE.PerspectiveCamera( fov, window.innerWidth / window.innerHeight, 1, 10000 );
			Threasy.addCamera( camera );
			
			// add scene light - directional light gives better shadow effects
			Threasy.removeLight();
			_sceneLight = new THREE.DirectionalLight( 0xffffff, 1 ); 
			_sceneLight.position.set( 400, 400, 2000 ); 
			Threasy.addLight( _sceneLight, _directionLightRef );
			
			Threasy.addMicroCache( new MicroCache() );
			
			THREEx.WindowResize( Threasy.renderer, Threasy.camera );
		}
	
	// [ HANDLERS
		
		function mouseDown_handler( event )
		{
			
			if( _cubesFlipped ) return;
			
			EventManager.autoRemoveListener( _domElement, "mousedown", mouseDown_handler );
			EventManager.autoAddListener( _domElement, "mouseup", removeListeners );
			EventManager.autoAddListener( _domElement, "mouseout", removeListeners );
			EventManager.autoAddListener( _domElement, "mousemove", mouseMove_handler );
									
			// get the cube based on mouse position
			_currentCube = getCurrentCube( event.x , event.y )
	   	 	if( _currentCube === undefined ) return;
	   	 	
	   	 	_mouseXOnMouseDown  		= Math.round( _currentCube.intersectingCube.point.x );
	   	 	_mouseYOnMouseDown			= event.y;
		    _targetRotationY 			= _currentCube.intersectingCube.object.rotation.y;
		    _targetYRotationOnMouseDown = _targetRotationY;
		    
		    _swipeBounds				= utils.bounds( ( event.x - _boundLeeway ), event.y, ( _boundLeeway * 2 ), ( event.y + _yLength ) )
		}
		
		/*
		 * move cubes when the mouse is down
		 * based on mouse position
		 */
		function mouseMove_handler( event )
		{
			if( _cubesFlipped ) return;
			
			// get the cube based on mouse position
			_currentCube = getCurrentCube( event.x , event.y )
			if( _currentCube === undefined ) return;
			if( _targetYRotationOnMouseDown === undefined ) return;
			
			var totalyMovement = Math.abs( _swipeBounds.y -  event.y  );
			if( utils.containsPoint( _swipeBounds, event.x , event.y ) && totalyMovement >= _yLength )
			{
				flipCubesToImage( _currentCube.cube.id ); // send id 
				return;
			}
			
			_mouseX 			= Math.round( _currentCube.intersectingCube.point.x ) ;
			_targetRotationY 	= _targetYRotationOnMouseDown + ( _mouseX - _mouseXOnMouseDown ) * _spinEase;
			_currentCube.cube.animateToPosition( 0, _targetRotationY );
		}
		
		/*
		 * remove mouse listeners
		 */
		function removeListeners( event )
		{
			// remove
			EventManager.autoRemoveListener( _domElement, "mouseup", removeListeners );
			EventManager.autoRemoveListener( _domElement, "mouseout", removeListeners );
			EventManager.autoRemoveListener( _domElement, "mousemove", mouseMove_handler );
			// add
			EventManager.autoAddListener( _domElement, "mousedown", mouseDown_handler );
		}
		
		/*
		 * change view to full size image
		 */
		function flipCubesToImage( id )
		{
			_cubesFlipped = true;
			EventManager.autoRemoveListener( _domElement, "mouseup", removeListeners );
			EventManager.autoRemoveListener( _domElement, "mouseout", removeListeners );
			EventManager.autoRemoveListener( _domElement, "mousemove", mouseMove_handler );
			EventManager.autoRemoveListener( _domElement, "mousedown", mouseDown_handler );
			
			var materials = _slicedMaterials[ id ];
			// var materials = CubieCreator.getSlicedMaterial( cube );
			
			var i 					= _cubes.length;
			var maxSpinDuration 	= 0;
			var j 					= 0;
			var cube;
			var spin;
			
			while( --i > -1 )
			{
				cube = _cubes[ i ];
				cube.forceStop();
				
				spin = ( _randomiseFlip ) ? utils.randRange( 0, 20 ) : ( _timeout * j );
				// cube.switchFaceTextureMaterial( id  , ( _timeout * j ), Threasy.renderer );
				cube.switchFaceTextureMaterial( materials[ cube.id ], spin, Threasy.renderer );
				j++;
				
				maxSpinDuration = Math.max( maxSpinDuration, spin );
			}
			materials = [];
			// EventManager.autoAddListener( _domElement, "mousedown", resetCubes_handler );
		}
		
		/*
		 * make sure all cubes have completed spinning
		 */
		function spinCompletedHandler()
		{
			_counter++;
			if( _counter >= _cubes.length )
			{
				_counter		= 0;
				EventManager.autoAddListener( _domElement, "mousedown", resetCubes_handler );
			}
		}
		
		
		/*
		 * reset cubes
		 */
		function resetCubes_handler( event )
		{
			EventManager.autoRemoveListener( _domElement, "mousedown", resetCubes_handler );
			
			var i = _cubes.length;
			var cube;
			var spin;
			while( --i > -1 )
			{
				cube = _cubes[ i ];
				spin = ( _randomiseFlip ) ? utils.randRange( 0, 20 ) : ( _timeout * i );
				cube.reset( spin );
			}
		}
			
	// ]
	
	
	// [ CUBE CALCULATION METHODS
		
		/*
		 * return current cube mouse is over by matching the 
		 * starting X position set in the Cube() Class
		 */
		function getCurrentCube( xPos, yPos )
		{
			_currentIntersectingCube = Threasy.getObjectInBounds( xPos, yPos );
		    if( _currentIntersectingCube === undefined ) return;
			
			 _selectedCubeX 		 = _currentIntersectingCube.object.position.x;
			 _selectedCubeY			 = _currentIntersectingCube.object.position.y;
			if( _selectedCubeX === undefined || _selectedCubeY === undefined ) return;
			
			var i = _cubes.length;
			var cube;
			while( --i > -1 )
			{
				cube = _cubes[ i ];
				if( cube.positionsMatch( _selectedCubeX, _selectedCubeY ) ) return { cube : cube, intersectingCube : _currentIntersectingCube };
			}
			return undefined;
		}
		
		/*
		 * cube counter
		 */
		function cubeResetCounter()
		{
			_counter++;
			if( _counter >= _cubes.length )
			{
				_cubesFlipped 	= false;
				_counter		= 0;
				EventManager.autoRemoveListener( _domElement, "mousedown", resetCubes_handler );
				EventManager.autoAddListener( _domElement, "mousedown", mouseDown_handler );
			}
		}
	
	
	// ]
	
	// [ ANIMATION METHODS
	
		/*
		 * start the party
		 */
		function animate() 
		{ 
			_animationRequest = requestAnimationFrame( animate ); 
			Threasy.render();
			
			Threasy.camera.position.x += ( ( _camMouseX + _centerVector.x ) - Threasy.camera.position.x ) * _camMovementEase;
			Threasy.camera.position.y +=  ( - ( _camMouseY - _centerVector.y ) - Threasy.camera.position.y ) * _camMovementEase;
			Threasy.camera.lookAt( _centerVector );
			
			if( _stats ) _stats.update();
			
			// loop through and render
			var i = _cubes.length;
			var cube;
			while( --i > -1 )
			{
				cube = _cubes[ i ];
				cube.render();
			}
		}
		
		/*
		 * stop animation
		 */
		function stopAnimation() { cancelRequestAnimationFrame( _animationRequest ); }
		
		
	// ]
		
	// [ VIEW CONTROLS
		
		// change cube depths
		function changeDepths() { DepthLoop(); }
		// reset cubes depths
		function resetDepth() { DepthLoop( _cubesZ ); }
		// change cube margin
		function changeMargin( margin )
		{ 
			if( _cubesFlipped ) return;
			
			EventManager.autoAddListener( window, "mouseup", resliceImages );
			window.cancelRequestAnimationFrame( _animationRequest ); 
			_animationRequest = null;
			CubieCreator.resetMargins( margin ); 
			
			var viewProperties 			= CubieCreator.viewProperties();
			var xPos 					= ( viewProperties.totalWidth >> 1 ) + ( _cubesWidth >> 1 ); 
			var yPos					= ( viewProperties.totalHeight >> 1 ); 
			
			_centerVector				= new THREE.Vector3( xPos, yPos, 0 );
			animate();
		}
		function resliceImages( event )
		{
			EventManager.autoRemoveListener( window, "mouseup", resliceImages );
			_slicedMaterials  = CubieCreator.slicedMaterials( true );
		}
		
		/*
		 * loop through and change properties on cubes
		 */
		function DepthLoop( depth )
		{
			// if( _cubesFlipped ) return;
			window.cancelRequestAnimationFrame( _animationRequest ); 
			_animationRequest = null;
			// loop through and render
			var i 			= _cubes.length;
			var maxDepth 	= 0;
			var range;
			var cube;
			while( --i > -1 )
			{
				range					= ( depth )? depth : utils.randRange( 100, 600 );
				cube 					= _cubes[ i ];
				cube.mesh.position.z 	= range;
				cube.render();
				_maxDepth 				= ( depth )? range : Math.max( range , _maxDepth );
			}
			if( _lightsOn ) loopThroughLights( ( 2 - ( _maxDepth * .001 )  ), _maxDepth + 100, false );
			animate();
		}
		// add random flip duration
		function randomiseSpin( value ) { _randomiseFlip = value; }
		
		// add lights
		function addLights()
		{
			_lightsOn = true;
			Threasy.removeLight( _directionLightRef );
			loopThroughLights( ( 2 - ( _maxDepth * .001 )  ), _maxDepth + 100, true );
		}
		
		/*
		 * add lights to the scene
		 */
		function initiateLights()
		{
			var cubeViewProps	= CubieCreator.viewProperties();
			var totalWidth		= cubeViewProps.totalWidth;
			var totalHeight 	= cubeViewProps.totalHeight;
			var lightMargin 	= totalWidth / _numLights;
			
			var xPos 			= totalWidth - _cubesWidth;
			var yPos			= totalHeight;
			
			var col;
			var spotLight
			
			var i = _numLights;
			while( --i > -1 )
			{
				col = Math.random() * 0xffffff;
			  	spotLight = new THREE.PointLight(  col, 0, 1000 );
			  	spotLight.position.set( xPos, yPos, _minDepth + 100 );
;  
			  	Threasy.addLight( spotLight, "spotLight"+ i );
			   	xPos -= lightMargin;
			}
		}
		
		// loop through lights 
		function loopThroughLights( intesity, depth, changeColour )
		{
			var lights = Threasy.lights();
			if( lights === undefined ) return;
			
			var light;
			var i = lights.length;
			
			while( --i > -1 )
			{
				light = lights[ i ];
				if( intesity !== undefined ) light.intensity = intesity;
				if( depth ) light.position.z = depth;
				if( changeColour ) light.color = new THREE.Color( Math.random() * 0xffffff );
			}
		}
		
		// remove lights
		function removeLights( )
		{
			_lightsOn = false;
			loopThroughLights( 0, _minDepth + 100, false );
			Threasy.addLight( _sceneLight, _directionLightRef );
		}
		
		/*
		 * Dispose
		 */
		function dispose()
		{
			if( !_cubes ) return;
			
			stopAnimation(); // stop animation and remove
			var cube;
			var materials;
			var meshes;
			
			var j;
			var i = _cubes.length;
			while( --i > -1 )
			{
				cube = _cubes[ i ];
				meshes = cube.slicedMeshes;
				for( var mesh in meshes ) 
				{
					Threasy.renderer.deallocateObject( meshes[ mesh ] );
				}
				
				Threasy.removeFromScene( cube.mesh );
				Threasy.renderer.deallocateObject( cube.mesh );
				Threasy.renderer.deallocateObject( cube.geometry );
				cube.mesh 	= undefined;
				cube 		= undefined;
				
				Threasy.renderer.clear( 0xffffff, 1 );
			}
			
			Threasy.renderer.deallocateObject( CubieCreator.globalGeometry() );
			Threasy.renderer.clear();
			_cubes = [];
			_slicedMaterials = [];
			CubieCreator.dispose();
		}
		
		/*
		 * resize the renderer
		 */
		function resizeHandler()
		{
			
		}
	
	// ]
		
		return {
			init 				: init,
			animate				: animate,
			stopAnimation		: stopAnimation,
			changeDepths		: changeDepths,
			resetDepth			: resetDepth,
			changeMargin		: changeMargin,
			randomiseSpin		: randomiseSpin,
			addLights			: addLights,
			removeLights		: removeLights,
			dispose				: dispose,
			loadImages			: loadImages,
			addStats			: addStats,
			removeStats			: removeStats,
			resizeHandler		: resizeHandler
		}
	}
	return CubieView;
});