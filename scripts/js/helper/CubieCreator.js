define( [ "scripts/js/helper/ImageLoader.js", "scripts/js/helper/ImageUtils.js", "scripts/js/SimpleCubie.js" ], function( ImageLoader )
{
	var CubieCreator = function()
	{
		
		var _globalGeometry;
		var _cubesWidth		= 100;
		var _cubesHeight	= 100;
		var _cubesZ			= 100;
		var _fitToCanvas	= false;
		var _resizeToCenter	= false;
		var _margin			= 0;
		var _borderColour	= 0xFFFFFF;
		var _totalCubes		= 0;
		
		var _cubeWidthWithMargin
		var _cubeHeightWithMargin;
		
		// sliced container
		var _slicedImages	= [];
		var _cubes			= [];
		var _imageUrls;			
		
		// grid properties
		var _gridRows;
		var _gridColumns;
		var _viewWidth;
		var _viewHeight;
		
		// camera position
		var _cameraPosition;
		
		var _cubeTextures;
		var _resizedTextures;
		var _slicedMaterials = [];	
		
		var _webGL			 = true;
		
		var _cubesSpinCompletedCallback;
		var _cubeRestCallback;
		
		/*
		 * init
		 * start loading and prepare cubes
		 */
		function init( imageUrls, cubesCreatedCallback, fitToCanvas, resizeToCenter, webGL )
		{
			if( imageUrls === undefined ) return;
			
			_imageUrls				= imageUrls;
			_cubesCreatedCallback	= cubesCreatedCallback;
			_fitToCanvas			= fitToCanvas;
			_resizeToCenter			= resizeToCenter;
			_webGL					= ( webGL === undefined )? _webGL : webGL;
			
			calculateView();
			loadImages();
		}
		
		/*
		 * set the cube properties
		 */
		function setCubeProperties( cubesResetCallback, cubeSpinCompletedHandler, cubeWidth, cubeHeight, cubeZ, margin )
		{
			_cubesWidth 					= ( cubeWidth === undefined 			) ? _cubesWidth : cubeWidth;
			_cubesHeight					= ( cubeHeight === undefined 			) ?  _cubesHeight : cubeHeight;
			_cubesZ							= ( cubeZ === undefined 				) ? _cubesZ : cubeZ;
			_margin							= ( margin === undefined 				) ? _margin : margin;
			_cubeRestCallback				= ( cubesResetCallback === undefined 	) ? _cubeRestCallback : cubesResetCallback;
			_cubesSpinCompletedCallback		= cubeSpinCompletedHandler;
		}
		
		/*
		 * calculate view dimensions
		 */
		function calculateView()
		{
			_cubeWidthWithMargin		= ( _cubesWidth  + _margin );
			_cubeHeightWithMargin		= ( _cubesHeight + _margin ); 
			_gridColumns	 			= Math.min( 10, Math.floor( window.innerWidth / _cubeWidthWithMargin ) ); 		// ||||||| \\ columns
			_gridRows					= Math.min( 6, Math.floor( window.innerHeight / _cubeHeightWithMargin ) );  // ------- \\ rows
			_viewWidth 					= ( _cubeWidthWithMargin * ( _gridColumns - 1 ) );
			_viewHeight					= ( _cubeHeightWithMargin * ( _gridRows - 1 ) ) 
			_totalCubes					= ( _gridColumns - 1 ) * ( _gridRows - 1 );
		}
		
		/*
		 * load Images
		 */
		function loadImages()
		{
			// initialise the image loader
			ImageLoader.setWebgl( _webGL );
			ImageLoader.init( imagesLoaded_handler, Math.min( _cubesWidth, _cubesHeight ), _cubesWidth, 
							  _cubesHeight, _viewWidth, _viewHeight, _fitToCanvas, _resizeToCenter );
			
			var url;
			var totalImages = _imageUrls.length;
			var i 			= _totalCubes;
			while( --i > -1 )
			{
				url = _imageUrls[ i % totalImages ];
				ImageLoader.add( url, i )
			}
			// start loading images
			ImageLoader.load();
		}
		
		/*
		 * images completed loading
		 * prepare the view
		 */
		function imagesLoaded_handler(  originalTextures, resizedTextures )
		{
			_cubeTextures				= originalTextures;
			_resizedTextures			= resizedTextures;
			createCubies();
			sliceTextures();
			if( _cubesCreatedCallback ) _cubesCreatedCallback( _cubes, _slicedMaterials );
		}
		
		/*
		 * create the cubes
		 */
		function createCubies( )
		{
			// create cubes
			var cubeID;
			var xpos 					= 0;
			var ypos 					= 0;
			var r						= 0;
			var c						= 0;
			var i						= 0;
			_globalGeometry 			= new THREE.Geometry();
			
			var cube;
			while( ++r < _gridRows )
			{
				c = 0;
				while( ++c < _gridColumns )
				{
					xpos 		= ( _cubeWidthWithMargin  * c );
					ypos 		= ( _cubeHeightWithMargin * r ); 
					cubeID		=  "r:" + r + "c:" + c;
					
					cube = new SimpleCubie();
					cube.setWebgl( _webGL ); // set the availability of webGL
					cube.init( xpos, ypos, _cubesWidth, _cubesHeight, _cubesZ, cubeID, undefined, _cubeTextures[ i % _cubeTextures.length ], _globalGeometry );
					
					cube.setCubeResetCompletedHandler( _cubeRestCallback ) // set callback functiion
					cube.setCubesCompletedSpinHandler( _cubesSpinCompletedCallback ) // set callback functiion
					
					cube.rotationProperties( 90 , true );
					
					_cubes.push( cube );
					i++;
				}
			}
		}
		
		/*
		 * slice cube texture
		 */
		function sliceTextures()
		{
			var cubeDeductionX		= _cubesWidth;
			var cubeDeductionY		= ( _viewWidth - _cubesHeight );
			var rowsEven			= ( ( ( _gridRows - 1 ) % 2 ) === 0 );
			var colsEven			= ( ( _gridColumns % 2 ) === 0 );
			
			var meshes;
			var pos;	
			
			var cube;
			var texture;
			
			var middleX;
			var middleY;
			
			var i = _cubes.length;
			while( --i > -1 )
			{
				cube 	= _cubes[ i ];
				texture	= _resizedTextures[ i % _resizedTextures.length ];
				if( texture === undefined ) texture = cube.texture;
				
				if( !_fitToCanvas || _resizeToCenter )
				{
					middleX = ImageUtils.resizeToNearest( ( ( _viewWidth >> 1 ) - ( texture.image.width >> 1 ) ), _cubesWidth );
					middleY = ImageUtils.resizeToNearest(( ( _viewHeight >> 1 ) - _cubesHeight ), _cubesHeight );
					
					if( !colsEven ) middleX -= _cubesWidth; 
					if( !rowsEven ) middleY -= _cubesHeight;
					if( _resizeToCenter ) middleY = 0;
				}
				
				_slicedMaterials[ cube.id ] = ImageUtils.slicedTextures( 	// loop through and create a texture for each of the cube textures
																	_cubes, 
																	texture, 
																	_cubesWidth, 
																	_cubesHeight, 
																	_viewWidth, 
																	_viewHeight,
																	middleX,
																	middleY,
																	_borderColour );
				// cube.slicedMeshes = _slicedMaterials;
				
			}
		}
		
		
		function getSlicedMaterial( cube )
		{
			var cubeDeductionX		= _cubesWidth;
			var cubeDeductionY		= ( _viewWidth - _cubesHeight );
			var rowsEven			= ( ( ( _gridRows - 1 ) % 2 ) === 0 );
			var colsEven			= ( ( _gridColumns % 2 ) === 0 );
			
			var meshes;
			var pos;	
			
			var cube;
			var texture;
			
			var middleX;
			var middleY;
			
			if( !_fitToCanvas || _resizeToCenter )
			{
				middleX = ImageUtils.resizeToNearest( ( ( _viewWidth >> 1 ) - ( texture.image.width >> 1 ) ), _cubesWidth );
				middleY = ImageUtils.resizeToNearest(( ( _viewHeight >> 1 ) - _cubesHeight ), _cubesHeight );
				
				if( !colsEven ) middleX -= _cubesWidth; 
				if( !rowsEven ) middleY -= _cubesHeight;
				if( _resizeToCenter ) middleY = 0;
			}
			
			return _slicedMaterials[ cube.id ] = ImageUtils.slicedTextures( 	// loop through and create a texture for each of the cube textures
																_cubes, 
																cube.texture, 
																_cubesWidth, 
																_cubesHeight, 
																_viewWidth, 
																_viewHeight,
																middleX,
																middleY,
																_borderColour );
																
			ImageUtils.resetCacheCounter();															
		}
		
		
		/*
		 * reset margins, strech out or reduce
		 */
		function resetMargins( margin )
		{
			_margin 					= margin;
			_cubeWidthWithMargin		= ( _cubesWidth  + _margin );
			_cubeHeightWithMargin		= ( _cubesHeight + _margin ); 
			_viewWidth 					= ( _cubeWidthWithMargin * ( _gridColumns - 1 ) );
			_viewHeight					= ( _cubeHeightWithMargin * ( _gridRows - 1 ) ) 
			
			var xpos 					= 0;
			var ypos 					= 0;
			var r						= 0;
			var c						= 0;
			var i						= 0;
			
			var cube;
			while( ++r < _gridRows )
			{
				c = 0;
				while( ++c < _gridColumns )
				{
					cube 		= _cubes[ i ];
					xpos 		= ( _cubeWidthWithMargin  * c );
					ypos 		= ( _cubeHeightWithMargin * r ); 
					cube.setPosition( xpos , ypos );
					cube.render();
					i++;
				}
			}
		}
		
		
		/*
		 * return sliced array
		 */
		function slicedMaterials( forceReslice ) 
		{ 
			if( forceReslice )
			{
				ImageLoader.resize( _viewWidth, _viewHeight ); 
				ImageUtils.resetCacheCounter();
				sliceTextures();
			} 
			return _slicedMaterials; 
		}
		
		/*
		 * return resized array
		 */
		function resizedTextures() { return _resizedTextures; }
		
		/*
		 * return view properties
		 */
		function viewProperties() { return { totalWidth : _viewWidth, totalHeight : _viewHeight }; }
		
		
	// [ GETTERS AND SETTERS
		
		function cubeWidth() { return _cubesWidth; }
		function cubeHeight() { return _cubesHeight; }
		function cubesZ() { return _cubesZ; }
		function cubeMargin() { return _margin; }
		function numRows() { return _gridRows; }
		function numColumns() { return _gridColumns; }
		function globalGeometry() { return _globalGeometry; }
		
	// ]
	
	
		function dispose()
		{
			_cubesWidth 			= undefined;
			_cubesWidth 			= undefined;
			_cubesZ 				= undefined;
			_margin 				= undefined;
			_gridColumns 			= undefined;
			_cubesCreatedCallback 	= undefined;
			_totalCubes 			= 0
			_slicedMaterials 		= [];
			_cubes 					= [];
			_imageUrls 				= [];
		}
	
		// return Class Object
		return {
			init				: init,
			viewProperties		: viewProperties,
			setCubeProperties	: setCubeProperties,
			cubeWidth			: cubeWidth,
			cubeHeight			: cubeHeight,
			cubesZ				: cubesZ,
			cubeMargin			: cubeMargin,
			numRows				: numRows,
			numColumns			: numColumns,
			resetMargins		: resetMargins,
			slicedMaterials		: slicedMaterials,
			globalGeometry		: globalGeometry,
			dispose				: dispose,
			getSlicedMaterial	: getSlicedMaterial
		}
	
	}
	// return Class
	return new CubieCreator();
})
