window.ImageUtils = {}
var cacheCounter = 0;

/*
 * return an array of a sliced texture elements
 */
window.ImageUtils.slicedTextures = function( cubes, texture, cubesWidth, cubesHeight, totalWidth, totalHeight, marginX, marginY, cubeColour )
{
	if( marginX === undefined ) 	marginX = 0;
	if( marginY === undefined ) 	marginY = 0;
	if( cubeColour === undefined ) 	cubeColour = 0x000000;
	
	// make sure that the image fits within the view
	var cube
	var pos;
	var posX;
	var posY;
	
	var discardWidth		= ( texture.image.width >= totalWidth );
	var discardHeight		= ( texture.image.height >= totalHeight );
	var halfHeight			= ( totalHeight >> 1 ) - ( cubesHeight >> 1 );
	
	var cubeDeductionX		= cubesWidth;
	var cubeDeductionY		= ( totalHeight );
	var meshes				= [];
	var i					= cubes.length;
	while( --i > -1 )
	{
		cube = cubes[ i ];
		pos = cube.position();
		
		posX = ( pos.x - cubeDeductionX ) - marginX;
		posY = ( pos.y - cubeDeductionY ) + marginY;
		meshes[ cube.id ] = ImageUtils.sliceTexture( texture, posX, posY, cubesWidth, cubesHeight, halfHeight, marginY, cubeColour, discardWidth, discardHeight ) 
	}
	return meshes;
}

/*
 * slice the texture passed in
 * and return a section of that texture based
 * on dimensions passed
 */
window.ImageUtils.sliceTexture = function( texture, offsetX, offsetY, sliceWidth, sliceHeight, halfHeight, marginY, outOfBoundsCol, discardWidth, discardHeight )
{
	
	if( discardWidth === undefined ) 	discardWidth 	= false;
	if( discardHeight === undefined ) 	discardHeight 	= false;
	
	var imageWidth		= texture.image.width;							// get the width
	var imageHeight		= texture.image.height;							// get the height
	
	// if the slice is out of bounds then just colour the cube
	var maxX				= imageWidth;
	var minX				= -sliceWidth;
	var maxY				= ImageUtils.resizeToNearest(  ( marginY <= 0 )? ( imageHeight - sliceHeight ) : 0, sliceHeight );
	var minY				= ( marginY <= 0 )? -( imageHeight ) : -( halfHeight - sliceHeight );
	
	if( !discardWidth )  if( ( offsetX >= maxX ) || ( offsetX <= minX ) ) return null;
	if( !discardHeight ) if( ( offsetY > maxY ) || ( offsetY <= minY ) ) return null;
	
	var textureID		= 'texture' + cacheCounter++;
	texture				= ImageUtils.webGLRendererCache.getSet( textureID, texture.clone() );
	
	// console.log("textures:: " + textureID );
	
	// ImageUtils.webGLRendererCache.getSet( textureID, texture.clone() ); //( ImageUtils.webGLRendererCache ) ? ImageUtils.webGLRendererCache.getSet( textureID, texture.clone() ) // clone the texture
															 // : texture.clone();		
															  
	texture.repeat.x = ( sliceWidth / imageWidth );						// repeat Width ratio [ section width / total image width ]
	texture.repeat.y = ( sliceHeight / imageHeight );					// repeat Height ratio [ section height / total image height ]
	texture.offset.x = ( Math.abs( offsetX ) / imageWidth );			// offset X ration [ offset position / total image height ]
	texture.offset.y = ( Math.abs( offsetY )/ imageHeight );			// offset Y ration [ offset position / total image height ]
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	texture.needsUpdate = true;
	return new THREE.MeshBasicMaterial({ color : outOfBoundsCol, map: texture, overdraw: false });
}

window.ImageUtils.webGLRendererCache = null;
window.ImageUtils.resetCacheCounter = function() 
{ 
	cacheCounter = 0;
};


/*
 * resize a THREE.js texture image
 */
window.ImageUtils.scaleTexture = function( texture, maxWidth, maxHeight, roundTo )
{
	var image = texture.image;
	var srcWidth = image.width;
	var srcHeight = image.height;
	
	
	var ratio = [ maxWidth / srcWidth, maxHeight / srcHeight ];
        ratio = Math.min(ratio[0], ratio[1]);

	image.width = ImageUtils.resizeToNearest( srcWidth*ratio, roundTo );
    image.height = ImageUtils.resizeToNearest( srcHeight*ratio, roundTo ) ;

	// if( ( image.height / image.width ) > ratio )
	// {
		// if( image.height > maxHeight )
		// {
			 // image.width 	= ImageUtils.resizeToNearest( Math.round( image.width * ( maxHeight / image.height ), roundTo ) );
	     	 // image.height 	= ImageUtils.resizeToNearest( maxHeight, roundTo );
		// }
	// }
	// else
	// {
		// if( image.width > maxHeight )
		// {
			// image.height 	= ImageUtils.resizeToNearest( Math.round( image.height * ( maxWidth / image.width ) ), roundTo );
      		// image.width 	= ImageUtils.resizeToNearest( maxWidth, roundTo );
		// }
	// }
	texture.needsUpdate = true;
}


/*
 * round to the nearest Nth
 */
window.ImageUtils.resizeToNearest = function( number, roundTo ) { return Math.round(number/roundTo)*roundTo; }

