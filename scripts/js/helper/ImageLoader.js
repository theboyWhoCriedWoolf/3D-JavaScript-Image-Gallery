define( [ "scripts/js/helper/ImageUtils.js", "scripts/js/plugins/Three.js" ], function()
{
	
	var _resizedTextures 	= [];
	var _originalImages	 	= [];
	var _tmpHolder			= []
	var _idCounter			= -1;
	var _completeCounter 	= 0;
	
	// properties
	var _fitToCanvas;
	var _resizeToCenter;
	var _resizeToClosest;
	var _completed;
	
	// view and cube props
	var _canvasWidth		= 0;
	var _canvasHeight		= 0;
	var _cubeWidth			= 0;
	var _cubeHeight			= 0;
	var _webgl				= true; // default is webgl
	
	
	var ImageLoader = function()
	{
		
		/*
		 * init
		 * set initial properties
		 */
		function init( onCompleteCallback, resizeToClosest, cubeWidth, cubeHeight, canvasWidth, canvasHeight, fitToCanvas, resizeToCenter )
		{
			
			if( fitToCanvas === undefined ) 	fitToCanvas 	= false;
			if( resizeToCenter === undefined ) 	resizeToCenter 	= false;
			
			_completed			= onCompleteCallback;
			_fitToCanvas 		= fitToCanvas;
			_resizeToClosest	= resizeToClosest;
			_resizeToCenter		= resizeToCenter;
			
			_canvasWidth		= canvasWidth;
			_canvasHeight		= canvasHeight;
			_cubeWidth			= cubeWidth;
			_cubeHeight			= cubeHeight;
		}
		
		
		/*
		 * resize
		 */
		function resize( canvasWidth, canvasHeight )
		{
			_canvasWidth 	= canvasWidth;
			_canvasHeight	= canvasHeight;
			resizeImages();
		}
		
		
		/*
		 * load
		 * Start loading images
		 */
		function load()
		{
			var i = _tmpHolder.length;
			var image;
			var texture;
			var vo;	
			while( --i > -1 )
			{
				vo = _tmpHolder[ i ];
				if( _originalImages[ vo.id ] ) return;
				
				image 		= new Image();
				image.id	= vo.id;
				image.onload = function( event )
				{
					texture 								= new THREE.Texture( event.target );
					texture.needsUpdate 					= true;
					texture.minFilter 						= texture.magFilter = THREE.LinearFilter;
					_originalImages[ event.target.id ] 		= texture;
					_resizedTextures[ event.target.id ] 	= ( _webgl )? texture.clone() : new THREE.Texture( event.target );
					onComplete_handler();
				}
				image.src = vo.url;
				// var texture					= THREE.ImageUtils.loadTexture( vo.url, undefined, onComplete_handler ); 
				// texture.minFilter 			= texture.magFilter = THREE.LinearFilter;
				// _originalImages[ vo.id ] 	= texture;
				// _resizedTextures[ vo.id ] 	= ( _webgl )? texture.clone() : THREE.ImageUtils.loadTexture( vo.url );
			}
		}
		
		/*
		 * set if webGL is available
		 */
		function setWebgl( available ) { _webgl = available; }
		
		/*
		 * start loading an image, if image already exists, 
		 * return that image
		 */
		function add( url, id )
		{
			if( id === undefined ) id = _idCounter++;
			_tmpHolder.push( { url : url, id : id } );
		}
		
		/*
		 * get images by ID
		 */
		function getImageByID( id )
		{
			if( _resizedTextures[ id ] ) return _resizedTextures[ id ];
			return null;
		}
		
		/*
		 * complete handler
		 */
		function onComplete_handler()
		{
			_completeCounter++;
			if( _completeCounter >= _tmpHolder.length )
			{
				console.log("***** [ Image Load Completed ] *****")
				
				resizeImages();
				_tmpHolder 			= [];
				_completeCounter	= 0;
				_idCounter			= -1;
				if( _completed !== undefined ) _completed( _originalImages, _resizedTextures );
				
				_originalImages = [];
			}
		}
		
		/*
		 * resize image, must occure after images have been 
		 * loaded otherwise image dimensions dont appear
		 */
		function resizeImages()
		{
			for( var id in _resizedTextures ) 
			{
				if( _resizeToClosest )		resizeImageToNearest( _resizedTextures[  id ] );
				if( _fitToCanvas )			resizeToFullView( _resizedTextures[ id ] );
				if( _resizeToCenter)		resizeImageToCenter( _resizedTextures[ id ] );
			};
		}
		
		/*
		 * return resized iamge arrays
		 */
		function getResizedImages() { return _resizedTextures; }
		/*
		 * return originals iamge arrays
		 */
		function getOriginalImages() { return _originalImages; }
		
		
		/*
		 * resize the image to the nearest value passed
		 */
		function resizeImageToNearest( texture )
		{
			texture.image.width 	= ImageUtils.resizeToNearest( texture.image.width, _resizeToClosest )
			texture.image.height 	= ImageUtils.resizeToNearest( texture.image.height, _resizeToClosest )
		}
		
		/*
		 * resize the image to center
		 */
		function resizeImageToCenter( texture )
		{
			if( _fitToCanvas ) return; // not needed
			var centerWidth 		= ( _canvasWidth - ( _cubeWidth * 2 ) );
			var centerHeight		= ( _canvasHeight - ( _cubeHeight * 2 ) );
			
			if( centerHeight <= _cubeHeight ) centerHeight = _canvasHeight;
			// make sure that the image can be centered reducing its size to fit
			// if( texture.image.width > centerWidth || texture.image.height > centerHeight )
			// {
				ImageUtils.scaleTexture( texture, centerWidth, centerHeight, ( _resizeToClosest ) ? _resizeToClosest : 100 )
			// }
		}
		
		
		/*
		 * resize the image to the full width
		 */
		function resizeToFullView( texture )
		{
			// height 0 so that the image will scale to the width
			ImageUtils.scaleTexture( texture, _canvasWidth, _canvasHeight, ( _resizeToClosest ) ? _resizeToClosest : 100 );
		}
		
		
		return { // return Class object
			init 				: init,
			load 				: load,
			add  				: add,
			getImageByID		: getImageByID,
			getResizedImages 	: getResizedImages,
			getOriginalImages	: getOriginalImages,
			setWebgl			: setWebgl,
			resize				: resize
		}
	}
	// return Class
	return new ImageLoader();
})
