define([ "scripts/js/plugins/MinimalComps-0.1.min.js"], function()
{
	function ControlPanel()
	{
		var _addLightsCheckbox;
		var _changeDepthsCheckbox;
		var _changeMarginSlider;
		var _randomiseSpinCheckbox;
		var _domElement;
		var _statsCheckBox;
		
		var _tmpSlidePercent = -1;
		
		var _addLightsHandler;
		var _changeDepthHandler;
		var _changeMarginHandler;
		var randomiseSpinHanldler;
		var _showStatsHandler;
		
		
		
		function init( domElement, addlights, changeDepths, changeMargin, randomiseSpinHanldler, showStatsHandler )
		{
			_domElement				= domElement;
			_addLightsHandler 		= addlights;
			_changeDepthHandler		= changeDepths;
			_changeMarginHandler	= changeMargin;
			_randomiseSpinHanldler	= randomiseSpinHanldler;
			_showStatsHandler		= showStatsHandler;
			initView();
		}
		
		
		function initView()
		{
			_addLightsCheckbox 		= new mc.CheckBox( _domElement, 230, 8, "Toggle Lights" , false, toggleLightsHandler );
			_changeDepthsCheckbox 	= new mc.CheckBox( _domElement, 230, 23, "Change Depths" , false, toggleDepth );
			// _jayTastickCheckbox		= new mc.CheckBox( _domElement, 320, 8, "JayTastic" , false, jayTasticHandler );
			_randomiseSpinCheckbox	= new mc.CheckBox( _domElement, 320, 23, "Randomise Spin Checkbox" , false, randomiseSpinHandler );
			_statsCheckBox 			= new mc.CheckBox( _domElement, 320, 8, "Stats" , false, toggleStatsHandler );

			_changeMarginSlider 	= new mc.HSlider( _domElement, 100, 23, marginPercentageHandler ).bindLabel(new mc.Label( _domElement, 190, 8 ).setAlign("left"), 0 );
			_changeMarginSlider.setMaximum( 30 );
			_changeMarginSlider.updateLabel();
			var marginLabel 		= new mc.Label( _domElement, 100, 8, "margin" ).setAlign("left");
		}
		
		
		// lights
		function toggleLightsHandler( event )
		{
			if( _addLightsHandler ) _addLightsHandler( event.getSelected() );
		}
		
		// depth
		function toggleDepth( event )
		{
			if( _changeDepthHandler ) _changeDepthHandler( event.getSelected() );
		}
		
		// jay tastic
		// function jayTasticHandler( event )
		// {
			// if( _jayTastickHandler !== undefined ) _jayTastickHandler( event.getSelected() );
		// }
		
		// margin
		function marginPercentageHandler( event )
		{
			if( _tmpSlidePercent == event.getValue() ) return;
			_tmpSlidePercent = event.getValue();
			if( _changeMarginHandler ) _changeMarginHandler( Math.round( _tmpSlidePercent ) );
		}
		
		// stats
		function toggleStatsHandler( event )
		{
			if( _showStatsHandler !== undefined ) _showStatsHandler( event.getSelected() );
		}
		// flip controls
		function randomiseSpinHandler( event )
		{
			if( _randomiseSpinHanldler !== undefined ) _randomiseSpinHanldler( event.getSelected() );
		}
		
		return {
			init	: init
		}
		
	}
	return ControlPanel;
})
