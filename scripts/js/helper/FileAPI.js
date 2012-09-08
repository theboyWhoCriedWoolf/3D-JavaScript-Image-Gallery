var FileAPI = ( function()
{
	
	var _totalFiles;
	var _progressHandler;
	var _completeHandler;
	var _selectedHandler;
	var _errorHandler;
	var _domElement;
	var _imageURLS;
	var _loadedCounter;
	var _debugMode;
	var _percentLoaded = 0;
	
	/**
	 * init 
	 * @param domElement 		- the element to append the browse button to
	 * @param completeHandler	- completed handler callback function
	 * @param progressHandler	- progress callback
	 */
	function init( domElement, fileSelectedHandler, progressHandler, completeHandler, errorHandler, debugMode )
	{
		_domElement 			= domElement;
		_totalFiles				= 0;
		_loadedCounter			= 0;
		_imageURLS 				= [];
		_completeHandler 		= completeHandler;
		_progressHandler 		= progressHandler;
		_selectedHandler		= fileSelectedHandler;
		_errorHandler			= errorHandler;
		_debugMode				= ( debugMode === ( undefined || null ) ) ? false : debugMode;
		
		// Check for the various File API support.
		if( window.File && window.FileReader && window.FileList && window.Blob ) addBrowseButton();
		else console.log("**************** [ ERROR : File API Not Supported ] ****************"); 
	}
	
	/*
	 * return the images array
	 */
	function getImages() { return _imageURLS; }

	/*
	 * add button to dom element
	 * only if FileAPI is supported
	 */
	function addBrowseButton() 
	{ 
		_domElement.innerHTML = "<div class='js-file-api'> <input type='file' class='js-hidden-browse' id='js-browse' name='js-fileAPI[]' multiple='' /><output id='file_list'/></div>"
		document.getElementById('js-browse').addEventListener('change', fileSelectedHandler, false);
		$('#js-browse').hover( function() {
			if( $(".button") )
			{
				$(".button").toggleClass( "active" );
			};
		})
	}
	
	/*
	 * files selected handler
	 * start loading the file data
	 */
	function fileSelectedHandler( event )
	{
		if( _selectedHandler ) _selectedHandler();
		
		_imageURLS					= [];
		var files 					= event.target.files; // FileList object
		_totalFiles					= files.length - 1;
		
		var reader;
		for ( var i = 0, f; f = files[i]; i++ ) 
		{
			// Only process image files.
		    if ( !f.type.match('image.*') ) continue;
		    
		    reader 						= new FileReader();
			reader.onerror 				= errorHandler;
	    	reader.onprogress 			= progressHandler;
	    	// on cancellation
	    	reader.onabort = function(e) { if( _debugMode ) console.log('************ [ ERROR : Load Aborted ] ************'); };
			reader.onload = ( function( theFile ) 
			{
				 return function( e ) 
				 { 
				 	_imageURLS.push( e.target.result );
				 	if( _loadedCounter == _totalFiles )
				 	{
				 		if( _completeHandler ) _completeHandler( _imageURLS );
				 		
				 		_percentLoaded 	= 0;
				 		_loadedCounter 	= 0;
				 		_totalFiles		= 0;
				 	}
				 	_loadedCounter++;
				 }
			})(f);
			// Read in the image file as a data URL.
     		reader.readAsDataURL(f);
     		// reader.readAsBinaryString( f );
		}
			
	}
	
	/*
	 * progress handler
	 * dispatch progress if handler has been provided
	 */
	function progressHandler( event )
	{
		if ( event.lengthComputable ) 
		{
      		// var percentLoaded 		= ( event.loaded / event.total) * 100 / _totalFiles;
      		
      		 _percentLoaded 		+= ( event.loaded / event.total ) * 100 / _totalFiles;
      		var roundPercent		= Math.min( Math.round( _percentLoaded ), 100 );	
      		if( _progressHandler )	_progressHandler( roundPercent );
      		if( _debugMode ) console.log("***********[ progress :: "+ roundPercent + " - total files :: " + _totalFiles + " ]***********" );
      	}
	}
	
	/*
	 * error handler
	 * dispatch error if handler has been provided
	 */
	function errorHandler( event )
	{
		 switch( event.target.error.code ) 
		 {
		      case event.target.error.NOT_FOUND_ERR:
		        	if( _debugMode ) console.log("**************** [ ERROR : File Not Found ] ****************")
		        	break;
		      case event.target.error.NOT_READABLE_ERR:
		        	if( _debugMode ) console.log("**************** [ ERROR : File is not readable ] ****************")
		        	break;
		      case event.target.error.ABORT_ERR:
		        	break; // noop
		      default:
		      		if( _debugMode ) console.log("**************** [ ERROR : An error occurred reading this file ] ****************")
		  }
		  if( _errorHandler ) _errorHandler( event.target.error.code ) // dispatch error code
    }
	// return CLASS object
	return {
				init 		: init,
				getImages	: getImages
	}
	
})();
