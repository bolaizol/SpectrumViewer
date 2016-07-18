function spectrumViewer(canvasID){

	////////////////////////////////////////////////////////////////////////
	//member variables//////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////
	//canvas & context
	this.canvasID = canvasID; //canvas ID
	this.canvas = document.getElementById(canvasID); //dom element pointer to canvas
	this.canvas.style.backgroundColor = '#333333';
	this.context = this.canvas.getContext('2d'); //context pointer
	this.stage = new createjs.Stage(canvasID);  //transform the canvas into an easelJS sandbox
	this.containerMain = new createjs.Container(); //layer for main plot
	this.containerOverlay = new createjs.Container(); //layer for overlay: cursors, range highlights
	this.containerPersistentOverlay = new createjs.Container(); //layer for persistent overlay features
	this.containerAnnotations = new createjs.Container(); //layer for annotations
	this.stage.addChild(this.containerMain);
	this.stage.addChild(this.containerOverlay);
	this.stage.addChild(this.containerPersistentOverlay);
	this.stage.addChild(this.containerAnnotations);

	//axes & drawing
	this.fontScale = Math.min(Math.max(this.canvas.width / 50, 10), 16); // 10 < fontScale < 16
	this.context.font = this.fontScale + 'px Arial';
	this.leftMargin = Math.max(7*this.fontScale, this.canvas.width*0.05); //px
	this.rightMargin = 20; //px
	this.bottomMargin = 50; //px
	this.topMargin = 20; //px
	this.xAxisPixLength = this.canvas.width - this.leftMargin - this.rightMargin; //px
	this.yAxisPixLength = this.canvas.height - this.topMargin - this.bottomMargin; //px
	this.binWidth = 0; //px
	this.XaxisLimitMin = 0; //default min channel to show on x-axis
	this.XaxisLimitMax = 2048; //default max channel to show on x-axis
	this.YaxisLimitMin = 0; //default min counts to show on y-axis
	this.YaxisLimitMax = 500; //default max counts to show on y-axis
	this.XaxisLimitAbsMax = 2048; //highest maximum allowed on the x-axis
	this.XaxisLength = this.XaxisLimitMax-this.XaxisLimitMin; //length of x-axis in bins
	this.YaxisLength = this.YaxisLimitMax-this.YaxisLimitMin; //height of y-axis in counts
	this.countHeight = 0; //height of one count
	this.axisColor = '#999999'; //color for axes
	this.axisLineWidth = 1; //weight of axis lines in px
	this.nXticks = 6; //default number of ticks on the x axis
	this.nYticks = 5; //default number of ticks on the y axis
	this.tickLength = 5; //default tick length in px
	this.xLabelOffset = 5; //default x label offset in px
	this.yLabelOffset = 5; //default y label offset in px
	this.AxisType = 0; //0 == linear, 1 == log
	this.baseFont = '16px Arial'; //default base font
	this.expFont = '12px Arial'; //default font for exponents
	this.xAxisTitle = 'Channel'; //default x-axis title
	this.yAxisTitle = 'Counts'; //default y-axis title
	this.drawCallback = function(){}; //callback after plotData, no arguments passed.
	this.demandXmin = null; //override values for x and y limits, to be used in favour of automatically detected limits.
	this.demandXmax = null;
	this.demandYmin = null;
	this.demandYmax = null;
	this.minY = 0; //minimum Y value currently being plotted
	this.maxY = 1000000; //max Y value currently being plotted
	this.chooseLimitsCallback = function(){};
	this.unitsPerTick = 1; //numerical scaling from bins to whatever units
	this.unitName = ''; //name of unit corresponding to unitsPerTick; ie unitsPerTick = 100 and unitName = 'keV' means 1 bin == 100 keV.
	this.onshiftclick = function(event, viewer, xBin, yBin){};
	this.onmetaclick = function(event, viewer, xBin, yBin){};

	//data
	this.plotBuffer = {}; //buffer holding all the spectra we have on hand, packed as 'name':data[], where data[i] = counts in channel i
	this.baselines = {}; //as plotBuffer, but these arrays are subtracted from the corresponding entries in plotBuffer before plotting.
	this.fakeData = {};
	this.fakeData.energydata0 = [200,48,42,48,58,57,59,72,85,68,61,60,72,147,263,367,512,499,431,314,147,78,35,22,13,9,16,7,10,13,5,5,3,1,2,4,0,1,1,1,0,1,0,1,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,111,200,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,80,120,70,20,20,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,300,650,200,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
	this.entries = {}; //number of entries in each displayed spectrum
	this.dataColor = ["#FFFFFF", "#FF0000", "#00FFFF", "#FFFF00", "#FF9900", "#0066FF", "#44FF44", "#FF00CC", "#00CC00", "#994499"]; //colors to draw each plot line with
	this.colorAssignment = [null, null, null, null, null, null, null, null, null, null]; //holds the data series key in the array position corresponding to the color to draw it with from this.dataColor
	this.hideSpectrum = {}; //any spectrum name used as a key holding a truthy value here will be skipped during plotting

    //cursors
    this.cursorX = 0; //x-bin of cursor
    this.cursorY = 0; //y-bin of cursor
    this.mouseMoveCallback = function(){}; //callback on moving the cursor over the plot, arguments are (x-bin, y-bin)
    this.highlightColor = '#8e44ad'; //color of drag highlight

    //annotations
    this.verticals = {};
    this.lines = {}
    this.suppressedAnnotations = []; //list of annotation id's to not draw
    this.binHighlights = [] //array of objects {color, height in counts}
    this.activePersistentOverlays = {} //object containing persistent overlays to repaint
	// mask so annotations only appear in plot area (ie don't overflow the axes)
	this.annotationMask = new createjs.Shape();
	this.annotationMask.graphics.mt(this.leftMargin, this.canvas.height - this.bottomMargin).lt(this.leftMargin, this.topMargin).lt(this.canvas.width - this.rightMargin, this.topMargin).lt(this.canvas.width-this.rightMargin, this.canvas.height - this.bottomMargin).closePath();
	this.containerAnnotations.mask = this.annotationMask;
	this.containerPersistentOverlay.mask = this.annotationMask;

    //click interactions
    this.XMouseLimitxMin = 0; //limits selected with the cursor
    this.XMouseLimitxMax = 0;
    this.clickBounds = [];
    this.shiftclickCallback = function(){}; //callback on shift+click, passed {x,y} in bins, spectrumViewer bound as this

	//plot repaint loop
	this.RefreshTime = 3; //seconds to wait before a plot refresh when requested
	this.refreshHandler = null; //pointer to the plot's setTimeout when a repaint is requested

	//state variables
	this.waveformLock = 0; //state of waveform snap
	this.windowHistory = [[this.XaxisLimitMin, this.XaxisLimitMax]];  //history of x-axis limits as [lo, hi]
	this.windowHistoryAt = 0; //index of current x axis limits in this.windowHistory

	////////////////////////////////////////////////////////////////
	//member functions//////////////////////////////////////////////
	////////////////////////////////////////////////////////////////

	//recalculate all scale parameters in case canvas size changes
	this.rescale = function(){
		this.fontScale = Math.min(Math.max(this.canvas.width / 50, 10), 16); // 10 < fontScale < 16
		this.context.font = this.fontScale + 'px Arial';
		this.leftMargin = Math.max(7*this.fontScale, this.canvas.width*0.05); //px
		this.rightMargin = 20; //px
		this.bottomMargin = 50; //px
		this.topMargin = 20; //px
		this.xAxisPixLength = this.canvas.width - this.leftMargin - this.rightMargin; //px
		this.yAxisPixLength = this.canvas.height - this.topMargin - this.bottomMargin; //px
		this.binWidth = 0; //px
	}



	//draw the plot frame
	this.drawFrame = function(suppressHistoryRecord){
		var binsPerTick, countsPerTick, i, label, minBin, interval, axis, tick, text, buffer;

		//determine bin render width
		this.binWidth = this.xAxisPixLength / (this.XaxisLimitMax - this.XaxisLimitMin);
		//determine the scale render height per count for linear view:
		this.countHeight = this.yAxisPixLength / this.YaxisLength;

		//clear canvas
		this.containerMain.removeAllChildren();
		this.containerOverlay.removeAllChildren();

		//draw principle axes:
		axis = new createjs.Shape();
		axis.graphics.ss(this.axisLineWidth).s(this.axisColor);
		axis.graphics.mt(this.leftMargin, this.topMargin);
		axis.graphics.lt(this.leftMargin, this.canvas.height-this.bottomMargin);
		axis.graphics.lt(this.canvas.width - this.rightMargin, this.canvas.height - this.bottomMargin);
		axis.graphics.lt(this.canvas.width - this.rightMargin, this.topMargin);
		this.containerMain.addChild(axis);

		//Decorate x axis
		interval = Math.log10((this.XaxisLimitMax - this.XaxisLimitMin));
		if(interval % 1 < 0.35)
			binsPerTick = Math.pow(10, Math.floor(interval)) / 5 ;
		else if(interval % 1 < 0.6)
			binsPerTick = Math.pow(10, Math.floor(interval)) / 2 ;
		else
			binsPerTick = Math.pow(10, Math.floor(interval)) ;
		minBin = Math.ceil(this.XaxisLimitMin / binsPerTick )*binsPerTick;
		this.nXticks = Math.floor( (this.XaxisLimitMax - minBin)) / binsPerTick;

		//draw x axis ticks & labels:
		for(i=0; i<this.nXticks; i++){
			//ticks
			tick = new createjs.Shape();
			tick.graphics.ss(this.axisLineWidth).s(this.axisColor);
			tick.graphics.mt(this.leftMargin + (i*binsPerTick+minBin-this.XaxisLimitMin)*this.binWidth, this.canvas.height - this.bottomMargin);
			tick.graphics.lt(this.leftMargin + (i*binsPerTick+minBin-this.XaxisLimitMin)*this.binWidth, this.canvas.height - this.bottomMargin + this.tickLength);
			this.containerMain.addChild(tick);

			//labels
			label = ((minBin + i*binsPerTick)*this.unitsPerTick).toFixed(0);
			text = new createjs.Text(label, this.context.font, this.axisColor);
			text.textBaseline = 'top';
			text.x = this.leftMargin + (i*binsPerTick+minBin-this.XaxisLimitMin)*this.binWidth - this.context.measureText(label).width/2;
			text.y = this.canvas.height - this.bottomMargin + this.tickLength + this.xLabelOffset;
			this.containerMain.addChild(text);
		}

		//keep track of x range limit history
		//don't add to history if asked not to or if nothing's changed
		if(!suppressHistoryRecord && (this.windowHistory[this.windowHistoryAt][0] != this.XaxisLimitMin || this.windowHistory[this.windowHistoryAt][1] != this.XaxisLimitMax) ){
			this.windowHistory = this.windowHistory.slice(0, this.windowHistoryAt+1)
			this.windowHistory.push([this.XaxisLimitMin, this.XaxisLimitMax]);
			this.windowHistoryAt = this.windowHistory.length - 1;
		}

		//Decorate Y axis/////////////////////////////////////////////////////////
		//decide how many ticks to draw on the y axis; come as close to a factor of the number of bins as possible:
		this.nYticks = 5;
		while( Math.floor(this.YaxisLength / this.nYticks) == Math.floor(this.YaxisLength / (this.nYticks-1)) )
			this.nYticks--;

		//how many counts should each tick increment?
		countsPerTick = Math.floor(this.YaxisLength / (this.nYticks-1));

		//draw y axis ticks and labels:
		for(i=0; i<this.nYticks; i++){
			//ticks
			tick = new createjs.Shape();
			tick.graphics.ss(this.axisLineWidth).s(this.axisColor);
			tick.graphics.mt(this.leftMargin, this.canvas.height - this.bottomMargin - i*countsPerTick*this.countHeight);
			tick.graphics.lt(this.leftMargin - this.tickLength, this.canvas.height - this.bottomMargin - i*countsPerTick*this.countHeight);
			this.containerMain.addChild(tick);

			//labels
			//this.context.textBaseline = 'middle';
			if(this.AxisType == 0){ //linear scale
				label = (this.YaxisLimitMax<10000) ? (i*countsPerTick + this.YaxisLimitMin).toFixed(0) : (i*countsPerTick + this.YaxisLimitMin).toExponential(1);
				text = new createjs.Text(label, this.context.font, this.axisColor);
				text.textBaseline = 'middle';
				text.x = this.leftMargin - this.tickLength - this.yLabelOffset - this.context.measureText(label).width;
				text.y = this.canvas.height - this.bottomMargin - i*countsPerTick*this.countHeight;
				this.containerMain.addChild(text);
			} else {  //log scale
				label = i*countsPerTick + Math.floor(Math.log10(this.YaxisLimitMin));
				//exponent
				text = new createjs.Text(label, this.context.expFont, this.axisColor);
				text.textBaseline = 'middle';
				text.x = this.leftMargin - this.tickLength - this.yLabelOffset - this.context.measureText(label).width;
				text.y = this.canvas.height - this.bottomMargin - i*countsPerTick*this.countHeight - 10;
				this.containerMain.addChild(text);
				//base
				text = new createjs.Text(10, this.context.baseFont, this.axisColor);
				text.textBaseline = 'middle';
				text.x = this.leftMargin - this.tickLength - this.yLabelOffset - this.context.measureText('10'+label).width;
				text.y = this.canvas.height - this.bottomMargin - i*countsPerTick*this.countHeight;
				this.containerMain.addChild(text);				
			}
		}

		//x axis title:
		buffer = this.xAxisTitle + (this.unitName.length>0? ` [${this.unitName}]`: '');
		text = new createjs.Text(buffer, this.context.font, this.axisColor);
		text.textBaseline = 'bottom';
		text.x = this.canvas.width - this.rightMargin - this.context.measureText(buffer).width;
		text.y = this.canvas.height - this.fontScale/2;
		this.containerMain.addChild(text);

		//y axis title:
		text = new createjs.Text(this.yAxisTitle, this.context.font, this.axisColor);
		text.textBaseline = 'alphabetic';
		text.rotation = -90;
		text.x = this.leftMargin*0.25;
		text.y = this.context.measureText(this.yAxisTitle).width + this.topMargin;
		this.containerMain.addChild(text);		

	};

	//update the plot
	this.plotData = function(RefreshNow, suppressHistoryRecord){

		var i, j, data, thisSpec, totalEntries, color, binBaseline;
		this.entries = {};
		var text, histLine;

		//get the axes right
		this.chooseLimits();	

		this.drawFrame(suppressHistoryRecord);

		// Now the limits are set loop through and plot the data points
		j = 0; //j counts plots in the drawing loop
		for(thisSpec in this.plotBuffer){
			//skip hidden spectra
			if(this.hideSpectrum[thisSpec]) continue;			

			color = this.dataColor[this.colorAssignment.indexOf(thisSpec)];
			text = new createjs.Text(thisSpec + ': '+this.entries[thisSpec] + ' entries', this.context.font, color);
			text.textBaseline = 'top';
			text.x = this.canvas.width - this.rightMargin - this.context.measureText(thisSpec + ': '+this.entries[thisSpec] + 'entries').width - this.fontScale;
			text.y = (j+1)*this.fontScale;
			this.containerMain.addChild(text);

			// Loop through the data spectrum that we have
			histLine = new createjs.Shape();
			histLine.graphics.ss(this.axisLineWidth).s(color);
			for(i=Math.floor(this.XaxisLimitMin); i<Math.floor(this.XaxisLimitMax); i++){
				//determine the baseline; 0 if nothing is found
				if(this.baselines[thisSpec] && this.baselines[thisSpec][i])
					binBaseline = this.baselines[thisSpec][i]
				else
					binBaseline = 0

				// Protection at the end of the spectrum (minimum and maximum X)
				if(i<this.XaxisLimitMin || i>this.XaxisLimitMax) continue;

				// Protection in Overlay mode for spectra which are shorter (in x) than the longest spectrum overlayed.
				if(i==this.plotBuffer[thisSpec].length){
					//left side of bar
					histLine.graphics.lt( this.leftMargin + (i-this.XaxisLimitMin)*this.binWidth, this.canvas.height - this.bottomMargin );				
				} else if(i<this.plotBuffer[thisSpec].length){

					if(this.AxisType==0){
						//draw canvas line:
						//left side of bar
						if(i != Math.floor(this.XaxisLimitMin))
							histLine.graphics.lt( this.leftMargin + (i-this.XaxisLimitMin)*this.binWidth, this.canvas.height - this.bottomMargin - Math.max(0,(this.plotBuffer[thisSpec][i] - binBaseline - this.YaxisLimitMin))*this.countHeight );
						else
							histLine.graphics.mt( this.leftMargin + (i-this.XaxisLimitMin)*this.binWidth, this.canvas.height - this.bottomMargin - Math.max(0,(this.plotBuffer[thisSpec][i] - binBaseline - this.YaxisLimitMin))*this.countHeight );
						//top of bar
						histLine.graphics.lt( this.leftMargin + (i+1-this.XaxisLimitMin)*this.binWidth, this.canvas.height - this.bottomMargin - Math.max(0,(this.plotBuffer[thisSpec][i] - binBaseline - this.YaxisLimitMin))*this.countHeight );
					}

					if(this.AxisType==1){
						//draw canvas line:
						if(this.plotBuffer[thisSpec][i] - binBaseline > 0){
							//left side of bar
							if( i != Math.floor(this.XaxisLimitMin))
								histLine.graphics.lt( this.leftMargin + (i-this.XaxisLimitMin)*this.binWidth, this.canvas.height - this.bottomMargin - Math.max(0, (Math.log10(this.plotBuffer[thisSpec][i] - binBaseline) - Math.log10(this.YaxisLimitMin)))*this.countHeight );
							else
								histLine.graphics.mt( this.leftMargin + (i-this.XaxisLimitMin)*this.binWidth, this.canvas.height - this.bottomMargin - Math.max(0, (Math.log10(this.plotBuffer[thisSpec][i] - binBaseline) - Math.log10(this.YaxisLimitMin)))*this.countHeight );
							//top of bar
							histLine.graphics.lt( this.leftMargin + (i+1-this.XaxisLimitMin)*this.binWidth, this.canvas.height - this.bottomMargin - Math.max(0, (Math.log10(this.plotBuffer[thisSpec][i] - binBaseline) - Math.log10(this.YaxisLimitMin)))*this.countHeight );
						} else {
							//drop to the x axis
							if( i != Math.floor(this.XaxisLimitMin) )
								histLine.graphics.lt( this.leftMargin + (i-this.XaxisLimitMin)*this.binWidth, this.canvas.height - this.bottomMargin );
							else
								histLine.graphics.mt( this.leftMargin + (i-this.XaxisLimitMin)*this.binWidth, this.canvas.height - this.bottomMargin );
							//crawl along x axis until log-able data is found:
							histLine.graphics.lt( this.leftMargin + (i+1-this.XaxisLimitMin)*this.binWidth, this.canvas.height - this.bottomMargin );
						}
					}

				} else continue;
			}
			this.containerMain.addChild(histLine);
			j++;
		}

		//redraw annotation items
		this.redrawAnnotation();
		//redraw persistent overlay
		this.redrawPersistentOverlay();
		//shade bins
		this.shadeBins();

		this.stage.update();

		//callback
		this.drawCallback();
	};

	//handle drag-to-zoom on the plot
	this.DragWindow = function(){
		var buffer;

		//don't even try if there's only one bin selected:
		if(this.XMouseLimitxMin != this.XMouseLimitxMax){
			//don't confuse the click limits with the click and drag limits:
			this.clickBounds[0] = 'abort';

			//Make sure the max is actually the max:
			if(this.XMouseLimitxMax < this.XMouseLimitxMin){
				buffer = this.XMouseLimitxMax;
				this.XMouseLimitxMax = this.XMouseLimitxMin;
				this.XMouseLimitxMin = buffer;
			}

			//keep things in range
			if(this.XMouseLimitxMin < 0) this.XMouseLimitxMin = 0;
			if(this.XMouseLimitxMax > this.XaxisLimitAbsMax) this.XMouseLimitxMax = this.XaxisLimitAbsMax;

			//stick into the appropriate globals
			this.XaxisLimitMin = parseInt(this.XMouseLimitxMin);
			this.XaxisLimitMax = parseInt(this.XMouseLimitxMax);

			//drawXaxis();
			this.YaxisLimitMax=5;

			//callback for limit change
			this.chooseLimitsCallback();

			this.plotData();
			this.clickBounds = [];
		} else
			this.ClickWindow(this.XMouseLimitxMax)
	};

	//handle clicks on the plot
	this.ClickWindow = function(bin){
		var redline;

		if(bin<0) return

		//decide what to do with the clicked limits
		if(this.clickBounds.length == 0){
			this.clickBounds[0] = bin;
			redline = new createjs.Shape();
			redline.graphics.ss(this.axisLineWidth).s('#FF0000');
			redline.graphics.mt(this.leftMargin + this.binWidth*(bin-this.XaxisLimitMin), this.canvas.height - this.bottomMargin);
			redline.graphics.lt(this.leftMargin + this.binWidth*(bin-this.XaxisLimitMin), this.topMargin);
			this.containerPersistentOverlay.addChild(redline);
		} else if(this.clickBounds[0] == 'abort'){
			this.clickBounds = [];
		} else if(this.clickBounds.length == 2 ){
			this.clickBounds = [];
			this.clickBounds[0] = bin;
		} else if(this.clickBounds.length == 1){
			this.clickBounds[1] = bin;
			//use the mouse drag function to achieve the same effect for clicking:
			this.XMouseLimitxMin = this.clickBounds[0];
			this.XMouseLimitxMax = this.clickBounds[1];
			this.DragWindow();
			this.clickBounds = [];
			this.containerPersistentOverlay.removeAllChildren();
			this.stage.update();
		}
	};

	//scroll the plot x-window by x to the right
	this.scrollSpectra = function(step){
		var windowSize = this.XaxisLimitMax - this.XaxisLimitMin;

		this.XaxisLimitMin += step;
		this.XaxisLimitMax += step;

		if(this.XaxisLimitMin < 0){
			this.XaxisLimitMin = 0;
			this.XaxisLimitMax = windowSize;
		}

		if(this.XaxisLimitMax > this.XaxisLimitAbsMax){
			this.XaxisLimitMax = this.XaxisLimitAbsMax;
			this.XaxisLimitMin = this.XaxisLimitMax - windowSize;
		}

		this.plotData();

		this.chooseLimitsCallback();
	};

	//recalculate x axis limits, for use when plots are deleted or hidden
	this.adjustXaxis = function(){
		this.XaxisLimitMin = (typeof this.demandXmin === 'number') ? this.demandXmin : 0;
		//use override max is present
		if(typeof this.demandXmax === 'number'){
			this.XaxisLimitAbsMax = this.demandXmax;
			this.XaxisLimitMax = this.demandXmax;
			this.chooseLimitsCallback();
			return;
		}
		//autodetect max otherwise
		this.XaxisLimitAbsMax = 2048;
		for(thisSpec in this.plotBuffer){
			//skip hidden spectra
			if(this.hideSpectrum[thisSpec]) continue;

			//Find the maximum X value from the size of the data
			this.XaxisLimitAbsMax = Math.max(this.XaxisLimitAbsMax, this.plotBuffer[thisSpec].length);
		}
		this.XaxisLimitMax = this.XaxisLimitAbsMax;	
		this.chooseLimitsCallback();	
	}

	//choose appropriate axis limits: default will fill the plot area, but can be overridden with this.demandXmin etc.
	this.chooseLimits = function(){
		var thisSpec, minYvalue, maxYvalue, 
			originalMinX = this.XaxisLimitMin,
			originalMaxX = this.XaxisLimitMax,
			spectrum;

		this.YaxisLimitMax=5;
		this.XaxisLength = this.XaxisLimitMax - this.XaxisLimitMin;
		
		minYvalue = 1000000;
		this.XaxisLimitAbsMax = 2048;
		maxYvalue=this.YaxisLimitMax;
		// Loop through to get the data and set the Y axis limits
		for(thisSpec in this.plotBuffer){
			//skip hidden spectra
			if(this.hideSpectrum[thisSpec]) continue;

			//Find the maximum X value from the size of the data
			this.XaxisLimitAbsMax = Math.max(this.XaxisLimitAbsMax, this.plotBuffer[thisSpec].length);

			// Find minimum and maximum Y value in the part of the spectrum to be displayed
			spectrum = this.plotBuffer[thisSpec].slice(Math.floor(this.XaxisLimitMin),Math.floor(this.XaxisLimitMax));
			if(this.baselines[thisSpec])
				spectrum = spectrum.map(
					function(current, index, arr){
						return current - this[index];
					}, 
					this.baselines[thisSpec]
				)
			if(Math.min.apply(Math, spectrum)<minYvalue){
				minYvalue=Math.min.apply(Math, spectrum);
			}
			if(Math.max.apply(Math, spectrum)>maxYvalue){
				maxYvalue=Math.max.apply(Math, spectrum);
			}

			// Find the sum of everything in the current x range
			data = spectrum;
			totalEntries = 0;
			for(j=0; j<data.length; j++ ){
				totalEntries += data[j];
			}
			//report number of entries:
			this.entries[thisSpec] = totalEntries;

		}

		//keep track of min and max y in a convenient place
		this.minY = minYvalue;
		this.maxY = maxYvalue;

		//use demand overrides if present:
		if(typeof this.demandXmin === 'number') this.XaxisLimitMin = this.demandXmin;

		if(typeof this.demandXmax === 'number'){
			this.XaxisLimitMax = this.demandXmax;
			if(this.demandXmax > this.XaxisLimitAbsMax)
				this.XaxisLimitAbsMax = this.demandXmax;
		}

		if(typeof this.demandYmin === 'number') this.YaxisLimitMin = this.demandYmin;
		else this.YaxisLimitMin = (this.AxisType == 0) ? 0 : 0.1;
		if(typeof this.demandYmax === 'number') maxYvalue = this.demandYmax;

		// Adjust the Y axis limit and compression and redraw the axis
		if(maxYvalue>5){
			if(this.AxisType==0) this.YaxisLimitMax=Math.floor(maxYvalue*1);
			if(this.AxisType==1) this.YaxisLimitMax=maxYvalue*10;
		} else {
			if(this.AxisType==0) this.YaxisLimitMax=5;
			if(this.AxisType==1) this.YaxisLimitMax=50;
		}

		if(this.AxisType==0)
			this.YaxisLength = this.YaxisLimitMax-this.YaxisLimitMin;

		if(this.AxisType==1)
			//this.YaxisLength=Math.log10(this.YaxisLimitMax-this.YaxisLimitMin);
			this.YaxisLength = Math.log10(this.YaxisLimitMax) - Math.log10(this.YaxisLimitMin);

		//callback when x limits are changed - user fudges
		if(originalMinX != this.XaxisLimitMin || originalMaxX != this.XaxisLimitMax)
			this.chooseLimitsCallback();

	};

	//zoom out to the full x-range
	this.unzoom = function(){

		this.adjustXaxis();
		this.plotData();
	};

	//restore x-axis limits to a different point in history
	this.restoreLimits = function(step){
		this.windowHistoryAt += step;
		this.windowHistoryAt = Math.min(this.windowHistoryAt, this.windowHistory.length-1);
		this.windowHistoryAt = Math.max(this.windowHistoryAt, 0);

		this.XaxisLimitMin = this.windowHistory[this.windowHistoryAt][0];
		this.XaxisLimitMax = this.windowHistory[this.windowHistoryAt][1];

		this.plotData(null, true);
	}

	//set the axis to 'linear' or 'log', and repaint
	this.setAxisType = function(type){
		if(type=='log'){
			this.YaxisLimitMin = 0.1;
			this.AxisType = 1;
		}
		else{
			this.YaxisLimitMin = 0;
			this.AxisType = 0;
		}
		this.plotData();
	};

	this.updatePersistentOverlay = function(line){
		// adds line to persistent overlay; <line>: {
		//   min: minimum bin to start drawing line in 
		//   nBins: number of bins to draw line over
		//   line: function of x-bin number, returns height to draw line at 
		//}

		var i, x, y, height, path = new createjs.Shape();
		path.graphics.ss(3).s('#FF0000');
		path.graphics.mt( this.leftMargin + (line.min-this.XaxisLimitMin)*this.binWidth, this.canvas.height - this.bottomMargin - line.line(line.min)*this.countHeight);
		
		for(i=0;i<line.nBins;i+=0.2){
			//draw line on canvas:
			x = i+line.min;
			y = line.line(x); 

			if(i!=0){
				if(this.AxisType == 0){
					path.graphics.lt( this.leftMargin + (line.min-this.XaxisLimitMin)*this.binWidth + i*this.binWidth, this.canvas.height - this.bottomMargin - y*this.countHeight);
				} else if(this.AxisType == 1){
					if(y<=0) height = 0;
					else height = Math.log10(y) - Math.log10(this.YaxisLimitMin);
					if(height<0) height = 0;
					path.graphics.lt( this.leftMargin + (line.min-this.XaxisLimitMin)*this.binWidth + i*this.binWidth, this.canvas.height - this.bottomMargin - height*this.countHeight);
				}
			} else{
				if(this.AxisType == 0){
					path.graphics.mt( this.leftMargin + (line.min-this.XaxisLimitMin)*this.binWidth + i*this.binWidth, this.canvas.height - this.bottomMargin - y*this.countHeight);
				} else if(this.AxisType == 1){
					if(y<=0) height = 0;
					else height = Math.log10(y) - Math.log10(this.YaxisLimitMin);
					if(height<0) height = 0;
					path.graphics.mt( this.leftMargin + (line.min-this.XaxisLimitMin)*this.binWidth + i*this.binWidth, this.canvas.height - this.bottomMargin - height*this.countHeight);
				}				
			}
		}

		this.containerPersistentOverlay.addChild(path);
		this.stage.update();

		this.activePersistentOverlays[line.min+'Overlay'] = line;
	}

	this.redrawPersistentOverlay = function(){
		//redraw all the persistent overlay items where they should be

		var key, line;

		this.containerPersistentOverlay.removeAllChildren();

		for(key in this.activePersistentOverlays){
			this.updatePersistentOverlay(this.activePersistentOverlays[key]);
		}
	}

	this.dropPersistentOverlay = function(){
		//drop everything from the persistent overlay

		this.activePersistentOverlays = {};
		this.containerPersistentOverlay.removeAllChildren();
		this.stage.update();
	}

	this.bkgShape = function(x, amplitude, center, width, intercept, slope){
		//evaluate a gaussian + linear background at x

		return intercept + slope*x + amplitude*Math.exp(-1*(x-center)*(x-center)/2/width/width);
	}

	//given two arrays of bin numbers (bins) and counts in the corresponding bin (bkg), 
	//detects peaks, masks them out, and return the resulting bins.
	this.scrubPeaks = function(bins, bkg){
		var concavity, spikePosition,
			bkgBins = bins,
			bkgCandidate = bkg
			

		//detect spikes and throw away until not too spiky
		concavity = this.asymmetricConcavity(bkgBins, bkgCandidate)
		while(Math.min.apply(null, concavity.slice(1, concavity.length-2)) < -100){
			spikePosition = concavity.indexOf(Math.min.apply(null, concavity.slice(1, concavity.length-2)));
			bkgCandidate.splice(spikePosition, 1);
			bkgBins.splice(spikePosition, 1);
			concavity = this.asymmetricConcavity(bkgBins, bkgCandidate);
		}
		
		return [bkgBins, bkgCandidate];
	}

	//calucalte second derrivatives of spectrum; return as array
	//note first and last entry will be null, can't caluclate derivatives on edges.
	this.concavity = function(spectrum){
		var i, concavity = [null], slope = []

		for(i=0; i<spectrum.length-1; i++){
			slope.push(spectrum[i+1] - spectrum[i])
		}

		for(i=0; i<slope.length-1; i++){
			concavity.push(slope[i+1] - slope[i])
		}

		concavity.push(null)

		return concavity
	}



	//as concavity, but points may not be equidistant
	this.asymmetricConcavity = function(x, y){
		var i, concavity = [null], slope = [];

		for(i=0; i<y.length-1; i++){
			slope.push( (y[i+1] - y[i]) / (x[i+1] - x[i]) );
			//console.log((y[i+1] - y[i]) , (x[i+1] - x[i]))
		}

		for(i=1; i<slope.length;i++){
			concavity.push( (slope[i] - slope[i-1]) / (x[i+1]/2 - x[i-1]/2) );
		}
		concavity.push(null)

		return concavity
	}

	//suppress or unsuppress a spectrum from being shown
	this.toggleSpectrum = function(spectrumName, hide){
		this.hideSpectrum[spectrumName] = hide;

		this.adjustXaxis();

		this.plotData();
	};

	//add a data series to the list to be plotted with key name and content [data]
	//if such a series already exists, just update its data.
	this.addData = function(name, data){
		var nSeries, i;
		//data = this.fakeData.energydata0 //fake for testing

		//if a series with this name already exists, just update the data
		if(this.plotBuffer[name]){
			this.plotBuffer[name] = data;
			return;
		}

		//refuse to display more than 10 data series, it's ugly.
		nSeries = Object.keys(this.plotBuffer).length;
		if(nSeries >= this.dataColor.length){
			alert('gammaSpectrum only allows at most ' + this.dataColor.length + ' series to be plotted simultaneously.');
			return;
		}

		//choose the first available color and assign it to this data series
		if(this.colorAssignment.indexOf(name) == -1){
			i=0;
			while(this.colorAssignment[i]) i++;
			this.colorAssignment[i] = name;
		}

		//append the data to the data buffer
		this.plotBuffer[name] = data;
	};

	//remove a data series from the buffer
	this.removeData = function(name){
		//free the color
		this.colorAssignment[this.colorAssignment.indexOf(name)] = null;

		//delete the data
		delete this.plotBuffer[name];
	};

	//////////////////////////////////////////
	// annotation objects
	//////////////////////////////////////////

	//redraw all the annotation opbjects in their appropriate places
	this.redrawAnnotation = function(){
		var key;

		this.containerAnnotations.removeAllChildren();

		//vertical lines
		for(key in this.verticals){
			if(this.suppressedAnnotations.indexOf(key) == -1)
				this.vertical(this.verticals[key].bin, this.verticals[key].color);
		}

		//lines
		for(key in this.lines){
			if(this.suppressedAnnotations.indexOf(key) == -1)
				this.line(this.lines[key].x0, this.lines[key].y0, this.lines[key].x1, this.lines[key].y1, this.lines[key].color)
		}
	}

	//draw a vertical line of a given color '#123456' at left edge of bin
	this.vertical = function(bin, color){
		var line

		line = new createjs.Shape();
		line.graphics.ss(this.axisLineWidth*2).s(color);
		line.graphics.mt(this.leftMargin + this.binWidth*(bin-this.XaxisLimitMin), this.canvas.height - this.bottomMargin);
		line.graphics.lt(this.leftMargin + this.binWidth*(bin-this.XaxisLimitMin), this.topMargin);
		this.containerAnnotations.addChild(line);

	}

	//draw a straight line from the centers of the noted bins.
	this.line = function(x0, y0, x1, y1, color){
		var line;

		line = new createjs.Shape();
		line.graphics.ss(this.axisLineWidth*2).s(color);
		line.graphics.mt(this.leftMargin + this.binWidth*(x0-this.XaxisLimitMin + 0.5), this.canvas.height - this.bottomMargin - Math.max(0,(y0 - this.YaxisLimitMin))*this.countHeight);
		line.graphics.lt(this.leftMargin + this.binWidth*(x1-this.XaxisLimitMin + 0.5), this.canvas.height - this.bottomMargin - Math.max(0,(y1 - this.YaxisLimitMin))*this.countHeight);
		this.containerAnnotations.addChild(line);
	}

	//add a persistent vertical
	this.addVertical = function(name, bin, color){
		this.verticals[name] = {'bin': parseInt(bin, 10), 'color': color}
	}

	//remove a persistent vertical
	this.removeVertical = function(name){
		if(this.verticals.hasOwnProperty(name))
			delete this.verticals[name];
	}

	//add an arbitrary line
	this.addLine = function(name, x0,y0,x1,y1,color){
		this.lines[name] = {'x0':x0, 'y0':y0, 'x1':x1, 'y1':y1, 'color':color};
	}

	//remove an annotation line
	this.removeLine = function(name){
		if(this.lines.hasOwnProperty(name))
			delete this.lines[name];
	}	

	//suppress a persistent annotation without deleting it
	this.suppressAnnotation = function(id){
		if(this.suppressedAnnotations.indexOf(id) == -1)
			this.suppressedAnnotations.push(id);
	}

	//unsuppress a persistent annotation
	this.unsuppressAnnotation = function(id){
		var index = this.suppressedAnnotations.indexOf(id);
		if(index != -1)
			this.suppressedAnnotations.splice(index, 1);
	}

	//highlight some bins
	this.shadeBins = function(){
		var i, bin, x0, y0;

		for(i=0; i<this.binHighlights.length; i++){
			if(this.binHighlights[i]){
				x0 = this.leftMargin + this.binWidth*(i-this.XaxisLimitMin)
				y0 = this.canvas.height - this.bottomMargin - this.binHighlights[i].height*this.countHeight;
				bin = new createjs.Shape();
 				bin.graphics.beginFill(this.binHighlights[i].color).drawRect(x0, y0, this.binWidth, this.binHighlights[i].height*this.countHeight);
 				bin.graphics.beginStroke(this.binHighlights[i].color).drawRect(x0, y0, this.binWidth, this.binHighlights[i].height*this.countHeight);
				this.containerAnnotations.addChild(bin);
			}
		}
	}

	//how long is the longest histogam?
	this.longestHist = function(){
		var i, longest = 0;
		var keys = Object.keys(this.plotBuffer) 

		for(i=0; i<keys.length; i++){
			longest = Math.max(longest, this.plotBuffer[keys[i]].length)
		}

		return longest;
	}

	//////////////////////////////////////////////////////
	//initial setup///////////////////////////////////////
	//////////////////////////////////////////////////////
	this.drawFrame();
	//plot mouseover behavior - report mouse coordinates in bin-space, and manage the cursor style
	this.canvas.addEventListener('mousemove', function(event){
		var coords, bins, x, y, xBin, yBin;
		var crosshairs, highlight;

		coords = this.canvas.relMouseCoords(event);
		x = coords.x;
		y = coords.y;
		bins = this.coord2bin(x,y);
		xBin = bins.x; yBin = bins.y

        this.mouseMoveCallback(xBin, Math.max(yBin,0) );

        //change cursor to indicate draggable region:
        if(event.shiftKey){
        	if( y < (this.canvas.height - this.bottomMargin) )
	        	document.body.style.cursor = 's-resize';
	        else 
	        	document.body.style.cursor = 'n-resize';
	    } else if(y>this.canvas.height-this.bottomMargin) 
        	document.body.style.cursor = 'pointer';
        else
        	document.body.style.cursor = 'default';

        //draw crosshairs
        this.containerOverlay.removeAllChildren();
        if(x > this.leftMargin && x < this.canvas.width - this.rightMargin && y > this.topMargin && y<this.canvas.height-this.bottomMargin){
        	if(this.clickBounds.length!=1){  //normal crosshairs
				crosshairs = new createjs.Shape();
				crosshairs.graphics.ss(this.axisLineWidth).s(this.axisColor);
				crosshairs.graphics.mt(this.leftMargin, y);
				crosshairs.graphics.lt(this.canvas.width-this.rightMargin, y);
				this.containerOverlay.addChild(crosshairs);

				crosshairs = new createjs.Shape();
				crosshairs.graphics.ss(this.axisLineWidth).s(this.axisColor);
				crosshairs.graphics.mt(x, this.canvas.height-this.bottomMargin);
				crosshairs.graphics.lt(x, this.topMargin);
				this.containerOverlay.addChild(crosshairs);
			} else { //red vertical line to mark second bound of click-and-zoom
				crosshairs = new createjs.Shape();
				crosshairs.graphics.ss(this.axisLineWidth).s('#FF0000');
				crosshairs.graphics.mt(x, this.canvas.height-this.bottomMargin);
				crosshairs.graphics.lt(x, this.topMargin);
				this.containerOverlay.addChild(crosshairs);				
			}
		}
		//highlight region on drag
		if(this.highlightStart != -1){
			highlight = new createjs.Shape();
			highlight.alpha = 0.3;
			highlight.graphics.beginFill(this.highlightColor).r(this.highlightStart, this.topMargin, Math.max(x, this.leftMargin) - this.highlightStart, this.canvas.height-this.topMargin-this.bottomMargin)
			this.containerOverlay.addChild(highlight);
		}
		this.stage.update();

	}.bind(this), false);

	this.canvas.onmouseout = function(event){
		document.body.style.cursor = 'default';
		this.containerOverlay.removeAllChildren();
		this.stage.update();
	}.bind(this);

	this.canvas.onmousedown = function(event){
		if(event.shiftKey || event.metaKey) return

		if(event.button == 0){
			this.highlightStart = this.canvas.relMouseCoords(event).x;
			this.XMouseLimitxMin = this.xpix2bin(this.canvas.relMouseCoords(event).x);
		}
	}.bind(this);

	this.canvas.onmouseup = function(event){
		if(event.shiftKey || event.metaKey) return

		if(event.button == 0){
			this.highlightStart = -1;
			this.XMouseLimitxMax = parseInt((this.canvas.relMouseCoords(event).x-this.leftMargin)/this.binWidth + this.XaxisLimitMin); 
			this.DragWindow();
		}

	}.bind(this);

	this.canvas.ondblclick = function(event){
		this.unzoom();
	}.bind(this);

	this.canvas.onclick = function(event){
		// expose some optional click responses to the user

		var coords = this.canvas.relMouseCoords(event),
			x = coords.x,
			y = coords.y,
			bins = this.coord2bin(x,y),
			xBin = bins.x, 
			yBin = bins.y;

		//shift and ctrl-click are optionally user defined
		if(event.shiftKey){
			this.onshiftclick(event, this, xBin, yBin);
		} else if(event.metaKey){
			this.onmetaclick(event, this, xBin, yBin);
		}
	}.bind(this);

	//right clicking does obnoxious focus things, messes with canvas onclicks.
	this.canvas.oncontextmenu = function(){
		return false;
	};

	this.xpix2bin = function(x){
		// convert the x pixel position returned by relMouseCoords into a bin number
		return parseInt((x-this.leftMargin)/this.binWidth + this.XaxisLimitMin);
	};

	this.ypix2bin = function(y){
		// convert the y pixel position returned by relMouseCoords into a bin number
		return Math.floor((this.canvas.height - this.bottomMargin - y)/this.yAxisPixLength * this.YaxisLength + this.YaxisLimitMin);
	};

	this.coord2bin = function(x,y){
		//translate a canvas coordinate into a histogram bin

		var xBin, yBin

        if(x > this.leftMargin && x < this.canvas.width - this.rightMargin && y > this.topMargin){
	        xBin = Math.floor((x-this.leftMargin)/this.binWidth) + this.XaxisLimitMin;
    	    
    	    if(this.AxisType == 1){
    	    	yBin = (this.canvas.height-this.bottomMargin - y) / this.countHeight;
    	    	yBin = Math.floor(Math.pow(10,yBin)/10);
    	    } else {
    	    	yBin = Math.floor((this.canvas.height-this.bottomMargin - y) / this.countHeight);
    	    }
    	    this.cursorX = xBin.toFixed(0);
    	    this.cursorY = yBin.toFixed(0);
        }

        return {x:xBin, y:yBin};
	}

}

//stick a coordinate tracker on the canvas prototype:
function relMouseCoords(event){
    var totalOffsetX = 0,
    totalOffsetY = 0,
    canvasX = 0,
    canvasY = 0,
    currentElement = this,
    test = [],
    elts = [];

	if (event.offsetX !== undefined && event.offsetY !== undefined) { return {x:event.offsetX, y:event.offsetY}; }
	//if (event.layerX !== undefined && event.layerY !== undefined) { return {x:event.layerX, y:event.layerY}; }

    do{
        totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
        totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
        //test[test.length] = currentElement.offsetLeft - currentElement.scrollLeft
        //elts[elts.length] = currentElement
    }
    while(currentElement = currentElement.offsetParent)

    canvasX = event.pageX - totalOffsetX;
    canvasY = event.pageY - totalOffsetY;

    //hack to deal with FF scroll, better solution TBD:
    if(event.offsetX == undefined){
    	canvasX -= document.body.scrollLeft;
    	canvasY -= document.body.scrollTop;
    }

    return {x:canvasX, y:canvasY}
}
HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;

//tell the Math library about log base 10:
Math.log10 = function(n) {
	return (Math.log(n)) / (Math.log(10));
};