function SimpleCubie()
{
	// cube CLazz
	var _self = {};
	
	// total cibe textures
	var TOTAL_TEXTURES 				= 6;
	
	// rotation range
	var _PI							= 3.1415;
	var _range						= [ -180, -90, 90, 180 ];
	// mesh index
	var _meshRange					= [ 4, 1, 5, 0, 4 ];
	
	// defined properties
	var _segmentsWidth				= 3;
	var _segmentsHeight				= 3;
	var _segmentsDepth				= 3;
	var _url;
	var _cubeColour;
	var _xpos;
	var _ypos;
	var _materials;
	var _cubeMaterial;
	
	var _targetRotationX			= 0;
	var _targetRotationY			= 0;
	var _targetRotationZ			= 0;
	var _targetsVect;
	
	var _vx							= 0;
	var _vy							= 0;
	var _vz							= 0;
	var _stopperPoint				= 0.0001;
	var _ease						= 0.05;
	var _tmpEase					= 0;
	var _animate					= false;
	var _lastRotationY				= 0;
	var _rotateBy					= 90; // 90 degrees
	var _useRandomRotation			= false;
	
	// interval
	var _timeoutIndex;
	var _tempMaterial;
	var _nextMeshIndex				= -1;
	var _needsResetting 			= false; 
	var _swappingMaterial			= false;
	var _resetCompletedHandler 		= null;
	var _usingMeshLambertMaterial	= false;
	var _webGL						= true;
	var _fadeInterval;
	var _cubesCompletedSpinHandler;
	
	// public properties
	_self.width						= 0;
	_self.height					= 0;
	_self.z							= 0;
	_self.id						= -1;
	_self.cubeColour				= 0xcccccc;
	_self.geometry					= null;
	_self.mesh						= null;
	_self.boundingBox				= null;
	_self.texture					= null;
	_self.outOfBoundsColour	 		= 0xFFFFFF;
	_self.slicedMeshes				= null;
	
	var _geometry;
	
	
	/*
	 * instantiate cube Mesh
	 */
	_self.init = function( x, y, width, height, cubeDepth, id, colour, cubeTexture, geo )
	{
		
		_xpos					= x;
		_ypos					= y;
		_self.width				= width;
		_self.height			= height;
		_self.z					= cubeDepth;
		_self.id				= ( id === undefined ) ? -1 : id
		_self.cubeColour 		= ( colour === undefined ) ? Math.random() * 0xFFFFFF : colour;
		_self.texture			= cubeTexture;
		_geometry				= geo;
		
		prepareTexture();	
		_self.setPosition( _xpos, _ypos );	
		
	}
	
	// set the animation properties
	_self.animationProperties = function( stopperValue, ease )
	{
		_stopperPoint 	= stopperValue;
		_ease			= ease;
	}
	
	// set rotation properties
	_self.rotationProperties = function( rotateBy, useRandomRotation ) 
	{ 
		_rotateBy 			= rotateBy;
		_useRandomRotation	= useRandomRotation;
	}
	
	// set the reset complete handler
	_self.setCubeResetCompletedHandler = function( handler ) { _resetCompletedHandler = handler; }
	_self.setCubesCompletedSpinHandler = function( handler ) { _cubesCompletedSpinHandler = handler; }
	
	/*
	 * set the position of the cube
	 */
	_self.setPosition = function( x, y )
	{
		if( _self.mesh === null ) return;
		_self.mesh.position.x = x;
		_self.mesh.position.y = y;
		
		_xpos = x;
		_ypos = y;
	}
	
	/*
	 * movve cube externally to position
	 * prevents cube from moving internally if already
	 * animating or being reset
	 */
	_self.animateToPosition = function( x, y, z )
	{
		if( _needsResetting ) return;
		setTargets(  x, y, z )
	}
	
	// return position 
	_self.position = function(){ return { x : _xpos, y : _ypos, z : _self.z }; }
	
	/*
	 * RENDER the view, animate if targets are set
	 */
	_self.render = function()
	{
		if( !_animate ) return;
		
		_vx = ( _targetsVect.x - _self.mesh.rotation.x ) * _ease;
		_vy = ( _targetsVect.y - _self.mesh.rotation.y ) * _ease;
		_vz = ( _targetsVect.z - _self.mesh.rotation.z ) * _ease;
		
		if( Math.abs( _vx ) <= _stopperPoint && Math.abs( _vy ) <= _stopperPoint && Math.abs( _vz ) <= _stopperPoint )
		{
			stopAndReset();
			if( _cubesCompletedSpinHandler && _swappingMaterial ) _cubesCompletedSpinHandler();
			return;
		}
		_self.mesh.rotation.addSelf( new THREE.Vector3( _vx, _vy, _vz ) );
	}
	
	// force the cube to stop movement
	_self.forceStop = function()
	{
		_animate 			= false;
		_targetsVect		= new THREE.Vector3( 0, 0, 0 ) ;//modulatedVect( _self.mesh.rotation );
		_self.mesh.rotation = modulatedVect( _self.mesh.rotation );
	}
	
	// return if possitions match
	_self.positionsMatch = function( xPos, yPos ) 
	{ 
		if( _xpos === xPos && _ypos === yPos ) return true;
		return false;
	}
	
	/*
	 * switch face texture
	 */
	_self.switchFaceTextureMaterial = function( material, timeout )//( material, timeout )
	{
		if( _animate ) return;
		_tmpEase 		= _ease;
		_ease 			= 0.1;
		
		if( timeout ) _timeoutIndex = setInterval( function() { swapMaterial( material ) }, timeout );
		else swapMaterial( material );
	}
	
	/*
	 * switch face colour
	 */
	_self.switchFaceColourMaterial = function( colour, timeout )
	{
		if( _animate ) return;
		
		_tmpEase 	= _ease;
		_ease 		= 0.1;
		if( timeout ) _timeoutIndex = setTimeout( function() { swapMaterial( basicMaterial( colour ) ) }, timeout );
		else swapMaterial( basicMaterial( colour ) );
	}
	
	/*
	 * reset
	 */
	_self.reset = function( timeout )
	{
		_swappingMaterial	= false;
		_needsResetting 	= true;
		if( timeout ) _timeoutIndex = setInterval( resetView, timeout );
		else resetView();
	}
	
	/*
	 * set the availability of webgl
	 */
	_self.setWebgl = function( available ){ _webGL = available; }
	
	
// -----------------------------------------------------------[ PRIVATE METHODS ]----------------------------------------------------------- \\
	
	/*
	 * set animation targets to start the animated
	 * movement of the cube
	 */
	function setTargets( x, y, z )
	{
		_targetRotationX = ( x === undefined ) ? 0 : x;
		_targetRotationY = ( y === undefined ) ? 0 : y;
		_targetRotationZ = ( z === undefined ) ? 0 : z;
		_targetsVect 	 = new THREE.Vector3( _targetRotationX, _targetRotationY, _targetRotationZ );
		_animate 		 = true;
	}
	
	/*
	 * reset cube mesh position
	 */
	function stopAndReset()
	{
		if( _needsResetting ) 	resetMaterial();
		_needsResetting			= false;
		_animate 				= false;
		_self.mesh.rotation 	= modulatedVect( _targetsVect ); // modulates the rotation so its within 360 ( 2 * Math.PI )
	}
	
	// start reset after interval or immediately
	function resetView()
	{
		if( _timeoutIndex ) clearInterval( _timeoutIndex ) // remove timeout
		setTargets( 0, ( _lastRotationY ) ? _lastRotationY : 0 );
		
		// _self.geometry.materials[ _nextMeshIndex ] = undefined;
		_self.geometry.materials[ _nextMeshIndex ] = _tempMaterial;
		_tempMaterial 	= null;
	}
	
	/*
	 * swap out material of one face of the cube
	 */
	function swapMaterial( material )
	{
		if( _timeoutIndex ) clearInterval( _timeoutIndex ) // remove timeout
		if( material === null ) material = basicMaterial( 0x222222 );
		_self.mesh.autoUpdate = false;
		
		// store current location
		_lastRotationY	= _self.mesh.rotation.y;
		// calculate positions
		var nextAngle 	= ( _useRandomRotation ) ? getNextAngle( randomAngle(), _lastRotationY ) : getNextAngle( _rotateBy, _lastRotationY );
		_nextMeshIndex 	= getFaceIndex( nextAngle );
		// set the properties
		_tempMaterial 	= _self.geometry.materials[ _nextMeshIndex ];
		_self.geometry.materials[ _nextMeshIndex ] = material;
		THREE.GeometryUtils.merge( _self.geometry, _self.mesh ); // merge to optimise
	
		 // rotate
		_swappingMaterial = true;
		setTargets( 0, utils.deg2Rad( nextAngle ) );
	}
	
	/*
	 * calculate the next rotation
	 * based on angle addative
	 */
	function getNextAngle( rotationStep, currentAngle )
	{
		var angle			= utils.rad2Deg( currentAngle );
		var remainder		= rotationStep - ( angle % rotationStep );
		var nextStep		= ( remainder >= rotationStep )? remainder : ( rotationStep + remainder );
		return ( angle += nextStep );
	}
	
	/*
	 * return a random rotation of cube
	 */
	function randomAngle() { return _range[ ( utils.randRange( 0, 3 ) ) ]}
	
	/*
	 * get the next material face 
	 * in the range array
	 */
	function getFaceIndex( nextAngle ) { return _meshRange[ utils.getNearestPositiveRotation( nextAngle, 360 ) ];	}
	
	/*
	 * reset cube material once the cube has completed 
	 * animating
	 */
	function resetMaterial()
	{
		// if( _tempMaterial === undefined ) return;
		_nextMeshIndex 			= -1;
		_ease 					= _tmpEase;
		if( _resetCompletedHandler ) _resetCompletedHandler();
	}
	
	
	/* // start loading the texture
	 * var materials = [borderMaterial, // Left side
						borderMaterial, // Right side
						pictureMaterial, // Top side   ---> THIS IS THE FRONT
						pictureMaterial, // Bottom side --> THIS IS THE BACK
						borderMaterial, // Front side
						borderMaterial  // Back side
		];
	 */
	function prepareTexture()
	{
    	_self.mesh 	= new THREE.Mesh( new THREE.CubeGeometry( 
														_self.width, 
														_self.height, 
														_self.z, 
														_segmentsWidth, 
														_segmentsHeight, 
														_segmentsDepth//,
														, basicMaterial( 0xFFFFFF, _self.texture )
													), new THREE.MeshFaceMaterial() );
		_self.mesh.dynamic = true;
    	THREE.GeometryUtils.merge( _geometry , _self.mesh ); // merge to optimise
    	_self.geometry =  _self.mesh.geometry;
	}
	
	
	_self.dispose = function( renderer )
	{
		renderer.deallocateObject( _self.mesh );
	}
	
	 // return basic colour material
	function basicMaterial( colour, texture ) { return new THREE.MeshLambertMaterial( { map : ( texture )? texture : null, color : colour, wireframe: false, overdraw: true } ) }
	
	/*
	 * return modulated position vector
	 * to reset the cubes position when animation stops
	 */
	function modulatedVect( targetsVect )
	{
		return new THREE.Vector3( 
									utils.mudulateRADRotation( targetsVect.x ),
									utils.mudulateRADRotation( targetsVect.y ),
									utils.mudulateRADRotation( targetsVect.z )
								 ) 
	}
 
 //  ]
	
	
	// [ *************************** return CLASS *************************** ]
	return _self;
}
