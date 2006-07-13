// ScatterPlot.js
// Created by Hiran Ganegedara

// Dojo Package System "provide" and "require" statements
dojo.provide("orp.plugins.ScatterPlot");
dojo.require("orp.view.PluginView");
dojo.require("dojo.lang.*");
dojo.require("dojo.widget.Chart");
dojo.require("dojo.widget.ColorPalette");

/**
 * The ScatterPlot view displays a set of content items.
 *
 * @scope    public instance constructor
 * @extends  PluginView
 * @param    superview    The View that serves as the superview for this view.
 * @param    htmlElement    The HTMLElement to display this view in.
 * @param    querySpec    The Query Spec item that provides the items for this PluginView to display
 * @param    layoutItem    An item that can be used to store layout data (like table column order).
 */
orp.plugins.ScatterPlot = function(superview, htmlElement, querySpec, layoutItem) {
	orp.view.PluginView.call(this, superview, htmlElement, querySpec, layoutItem, "ScatterPlot");
	this._hashTableOfAttributesKeyedByUuid = {};
	this._listOfAxisAttributes = [];
	this._numberOfSelectableAttributes = 0;
	this._MAXIMUM_BUBBLE_SIZE = 10;
	this._colorElement = null;
};


dojo.inherits(orp.plugins.ScatterPlot, orp.view.PluginView);  // makes ScatterPlot be a subclass of PluginView

// -------------------------------------------------------------------
// Public constants
// -------------------------------------------------------------------
	orp.plugins.ScatterPlot.cssClass = {
	CHARTDIV: "chart_container",
	SELECTCONTAINER: "select_container",
	BLANKCOLUMN: "empty_column"};
// -------------------------------------------------------------------
// Register this plugin in the SectionView registry
// -------------------------------------------------------------------
orp.plugins.ScatterPlot.UUID = "1189c400-0b1d-11db-a93c-0011111f4abe";
orp.view.SectionView.registerPlugin(orp.plugins.ScatterPlot);


// -------------------------------------------------------------------
// Public class methods
// -------------------------------------------------------------------

/**
 * Returns the UUID of the item that represents this class of plugin.
 *
 * @scope    public class method
 * @return   The UUID of the item that represents this class of plugin.
 */
orp.plugins.ScatterPlot.getPluginItemUuid = function() {
	return orp.plugins.ScatterPlot.UUID;
};

/**
 * Returns a list of anonymous objects representing Entries that describe the plugin.
 *
 * @scope    public class method
 * @return   A list of anonymous objects representing Entries that describe the plugin.
 */
orp.plugins.ScatterPlot.getEntriesForItemRepresentingPluginClass = function(pluginItem, world) {
	return [
		{	uuid: "1189c401-0b1d-11db-a93c-0011111f4abe",
			item: pluginItem,
			attribute: world.getAttributeCalledName(),
			value: "Scatter Plot" },
		{	uuid: "1189c402-0b1d-11db-a93c-0011111f4abe",
			item: pluginItem,
			attribute: world.getAttributeCalledShortName(),
			value: "ScatterPlot" },
		{	uuid: "1189c403-0b1d-11db-a93c-0011111f4abe",
			item: pluginItem,
			attribute: world.getAttributeCalledClassName(),
			value: "ScatterPlot" },
		{	uuid: "118c3500-0b1d-11db-a93c-0011111f4abe",
			item: pluginItem,
			attribute: world.getAttributeCalledCategory(),
			inverseAttribute: world.getAttributeCalledItemsInCategory(),
			value: world.getItemFromUuid(orp.view.SectionView.UUID.CATEGORY_PLUGIN_VIEW) }
	];
};

// -------------------------------------------------------------------
// Public instance methods
// -------------------------------------------------------------------

/**
 * Returns the class of this instance.
 *
 * @scope    public instance method
 * @return   A JavaScript class.
 */
orp.plugins.ScatterPlot.prototype.getClass = function() {
	return orp.plugins.ScatterPlot;
};

/**
 * This method is called whenever the ScatterPlot plugin is used to
 * display the results of a query.
 *
 * @scope    public instance method
 */
orp.plugins.ScatterPlot.prototype.refresh = function() {
	var pluginDiv = this.getHtmlElement();
	orp.view.View.removeChildrenOfElement(pluginDiv);
	pluginDiv.appendChild(this._setElementsForSelection());
	var divForChartWidget = orp.view.View.newElement("div");
	divForChartWidget.innerHTML = this._getHtmlTextForChart();

	var parser = new dojo.xml.Parse();
	var fragment = parser.parseElement(divForChartWidget, null, true);
	dojo.widget.getParser().createComponents(fragment);  
	pluginDiv.appendChild(divForChartWidget);
};

/**
 * This method sets the attribute selection drop downs and radio buttons.
 *
 * @scope    private instance method
 */
orp.plugins.ScatterPlot.prototype._setElementsForSelection = function() {
	var isComplete = false;
	var isBubblePlot = false;
	var listOfContentItems = [];
	var hasStoredAttributes = false;
	this._listOfAxisAttributes = [];
	
	// Check for stored attributes
	var world = this.getWorld();
	var createNewLayoutItemIfNecessary;
	var layoutItem = this.getLayoutItem(createNewLayoutItemIfNecessary = true);
	if (layoutItem) {
		var attributeCalledSelectedAttribute = world.getItemFromUuid(orp.view.SectionView.UUID.ATTRIBUTE_SELECTED_ATTRIBUTES);
		var listOfSelectedAttributes = layoutItem.getEntriesForAttribute(attributeCalledSelectedAttribute);
		if (listOfSelectedAttributes.length == 3) {
			isComplete = true;
			isBubblePlot = true;
			hasStoredAttributes = true;
		} else if (listOfSelectedAttributes.length == 2) {
			isComplete = true;
			isBubblePlot = false;
			hasStoredAttributes = true;
		}
		for(var i in listOfSelectedAttributes) {
			this._listOfAxisAttributes.push(listOfSelectedAttributes[i].getValue());
		}
	}
	
	// Load attribute data to drop down lists
	var hashTableOfAttributesKeyedByUuid = {};
	var contentItem;
	// Calculate the number of numeric instances for
	listOfContentItems = this.fetchItems();	
	for (var iKey in listOfContentItems) {
		contentItem = listOfContentItems[iKey];
		var listOfAttributesForItem = contentItem.getAttributes();
		for (var j in listOfAttributesForItem) {
			var temporaryAttribute = listOfAttributesForItem[j];
			var attributeUuid = temporaryAttribute.getUuid();			
			var listOfValues = contentItem.getValuesForAttribute(temporaryAttribute);
			if (listOfValues.length > 0) {
				firstValue = listOfValues[0];
				if (dojo.lang.isNumber(firstValue)) {
					this._hashTableOfAttributesKeyedByUuid[attributeUuid] = temporaryAttribute;						
				} 				
			}
		}
	}
	this._numberOfSelectableAttributes = 0;
	for(var tempAttributeUuid in this._hashTableOfAttributesKeyedByUuid) {
		this._numberOfSelectableAttributes = this._numberOfSelectableAttributes + 1;
	}
	if(this._numberOfSelectableAttributes < 2) {				
		var displayString = "Sorry, the number of attributes with numeric instances are insufficient to display the scatter plot";
		var spanObject = orp.view.View.newElement("span", null, null, displayString);
		return spanObject;
	} else {
		if(!hasStoredAttributes) {		
			for (var plotAttributeUuid in this._hashTableOfAttributesKeyedByUuid) {
				this._listOfAxisAttributes.push(this._hashTableOfAttributesKeyedByUuid[plotAttributeUuid]);
			}			
			world = this.getWorld();
			layoutItem = this.getLayoutItem(createNewLayoutItemIfNecessary = true);
			attributeCalledSelectedAttribute = world.getItemFromUuid(orp.view.SectionView.UUID.ATTRIBUTE_SELECTED_ATTRIBUTES);
			if(layoutItem) {
				listOfSelectedAttributes = layoutItem.getEntriesForAttribute(attributeCalledSelectedAttribute);
				if(listOfSelectedAttributes) {
					for (var key in listOfSelectedAttributes) {
						listOfEntriesForSelectedAttribute[key].voteToDelete();
					}
				}
				typeCalledItem = world.getTypeCalledItem();
				layoutItem.addEntry({attribute: attributeCalledSelectedAttribute, value: this._listOfAxisAttributes[0], type: typeCalledItem});
				layoutItem.addEntry({attribute: attributeCalledSelectedAttribute, value: this._listOfAxisAttributes[1], type: typeCalledItem});
			}
			isBubblePlot = false;
		}
	}
	
	var containerTableForDropDowns = orp.view.View.newElement("table");
	containerTableForDropDowns.className = orp.plugins.ScatterPlot.cssClass.SELECTCONTAINER;
	var containerRowForDropDowns = orp.view.View.appendNewElement(containerTableForDropDowns, "tr");
	var xAxisDropDown = orp.view.View.newElement("select");
	xAxisDropDown.id = "0";
	var yAxisDropDown = orp.view.View.newElement("select");
	yAxisDropDown.id = "1";
	var zAxisDropDown = orp.view.View.newElement("select");
	zAxisDropDown.id = "2";
	
	if(this._numberOfSelectableAttributes >= 2) {
		for (var newAttributeUuid in this._hashTableOfAttributesKeyedByUuid) {
			var currentAttribute = this._hashTableOfAttributesKeyedByUuid[newAttributeUuid];
			var xAttributeOption = orp.view.View.newElement("option");
			xAttributeOption.value = currentAttribute.getUuid();
			xAttributeOption.text = currentAttribute.getDisplayName();
			var yAttributeOption = orp.view.View.newElement("option");
			yAttributeOption.value = currentAttribute.getUuid();
			yAttributeOption.text = currentAttribute.getDisplayName();
			xAxisDropDown.options[xAxisDropDown.options.length] = xAttributeOption;
			yAxisDropDown.options[yAxisDropDown.options.length] = yAttributeOption;			
			
			if(this._listOfAxisAttributes[0].getUuid() == currentAttribute.getUuid()) {
				xAxisDropDown.options[xAxisDropDown.options.length-1].selected = true;	
			} 
			if(this._listOfAxisAttributes[1].getUuid() == currentAttribute.getUuid()){
				yAxisDropDown.options[yAxisDropDown.options.length-1].selected = true;
			}
			if (this._numberOfSelectableAttributes > 2) {				
				var zAttributeOption = orp.view.View.newElement("option");
				zAttributeOption.value = currentAttribute.getUuid();
				zAttributeOption.text = currentAttribute.getDisplayName();
				zAxisDropDown.options[zAxisDropDown.options.length] = zAttributeOption;
				if(this._listOfAxisAttributes[2]) {
					if(this._listOfAxisAttributes[2].getUuid() == currentAttribute.getUuid()) {
						zAxisDropDown.options[zAxisDropDown.options.length-1].selected = true;
					}
				}
			}
		}
		
		if(this._numberOfSelectableAttributes > 2) {
			var tableCellForRadioButtons = orp.view.View.appendNewElement(containerRowForDropDowns, "td");
			tableCellForRadioButtons.rowSpan = 2;
			tableCellForRadioButtons.width = "20%";
			var formObject = orp.view.View.appendNewElement(tableCellForRadioButtons, "form");
			//var uniqueIdForRadioButtons = 
			var htmlStringForRadioButtons = '<input type="radio" ID="ScatterPlot" name="radio_button" value="Scatter Plot" checked>Scatter Plot</input><br /><br /><input type="radio" ID="ScatterPlot" name="radio_button" value="Bubble Plot">Bubble Plot</input>';
			var tableRowForBubblePlot = orp.view.View.appendNewElement(containerTableForDropDowns, "tr");
			formObject.innerHTML = htmlStringForRadioButtons;
			orp.view.View.appendNewElement(tableRowForBubblePlot, "td");
			orp.view.View.appendNewElement(tableRowForBubblePlot, "td", null, null, "z Axis").width="10%";
			tableCellForzAxisDropDown = orp.view.View.appendNewElement(tableRowForBubblePlot, "td");
			tableCellForzAxisDropDown.colSpan = 4;
			tableCellForzAxisDropDown.appendChild(zAxisDropDown);
			zAxisDropDown.disabled = true;
			if(isBubblePlot) {
				zAxisDropDown.disabled = false;
				formObject.elements[1].checked = true;
			}			
			dojo.event.connect(zAxisDropDown, "onchange", this, "_changeAxisAttribute");
			dojo.event.connect(formObject.elements[0], "onclick", this, "_changeModeToScatterPlot");
			dojo.event.connect(formObject.elements[1], "onclick", this, "_changeModeToBubblePlot");
		}
		orp.view.View.appendNewElement(containerRowForDropDowns, "td", orp.plugins.ScatterPlot.cssClass.BLANKCOLUMN);
		orp.view.View.appendNewElement(containerRowForDropDowns, "td", null, null, "x Axis").width="10%";		
		var tableCellForxAxisDropDown = orp.view.View.appendNewElement(containerRowForDropDowns, "td");
		tableCellForxAxisDropDown.appendChild(xAxisDropDown);
		orp.view.View.appendNewElement(containerRowForDropDowns, "td", orp.plugins.ScatterPlot.cssClass.BLANKCOLUMN);
		orp.view.View.appendNewElement(containerRowForDropDowns, "td", null, null, "y Axis").width="10%";		
		var tableCellForyAxisDropDown = orp.view.View.appendNewElement(containerRowForDropDowns, "td");
		tableCellForyAxisDropDown.appendChild(yAxisDropDown);
		var tableRowForColorpalette = orp.view.View.appendNewElement(containerTableForDropDowns, "tr");
		var tableCellForColorPicker = orp.view.View.appendNewElement(tableRowForColorpalette, "td");
		tableCellForColorPicker.colSpan = 7;
		var anchorObject = orp.view.View.appendNewElement(tableCellForColorPicker, "a", null, null, "Color");
		dojo.event.connect(anchorObject, "onclick", this, "_displayColorPalette");
		dojo.event.connect(xAxisDropDown, "onchange", this, "_changeAxisAttribute");
		dojo.event.connect(yAxisDropDown, "onchange", this, "_changeAxisAttribute");
		return containerTableForDropDowns;
	}
};

/**
 * This method compares the current maximum and minimum with a give value and
 * palces it in the right place if is either greater than the currnt maximum or 
 * or less than the current minimum and returns the updated list
 *
 * @scope    private instance method
 * @param	 listOfMaxAndMin 	A list containing the current minimum and the current maximum respectively
 * @param	 newValue			The potential maximum or minimum
 * @return	 The updated list
 */
orp.plugins.ScatterPlot.prototype._checkForMaxOrMin = function(listOfMaxAndMin, newValue) {
	listOfMaxAndMin[0] = Math.min(listOfMaxAndMin[0], newValue);
	listOfMaxAndMin[1] = Math.max(listOfMaxAndMin[1], newValue);
	return listOfMaxAndMin;
};

/**
 * This method caluculates the range for each axis based on the maximum and minimum
 * each axis and returns the range list
 *
 * @scope    private instance method
 * @param	 arrayOfMaxAndMinValues		A two dimensional array containing the maximum and minimum of each axis
 * @return	 A two dimensional array of upper bound and lower bould for the range of each axis
 */
orp.plugins.ScatterPlot.prototype._calculateRangesForAxes = function(arrayOfMaxAndMinValues) {
	var stringForNumber;
	var numberOfCharactersInString;
	var arrayOfRangesForValues = new Array();
	
	for (var key in arrayOfMaxAndMinValues) {
		var minRange = 0;
		var maxRange = 0;
		var temporaryValue;
		if(arrayOfMaxAndMinValues[key][0] < 0) {
			stringForNumber = arrayOfMaxAndMinValues[key][0].toString();
			var exponentToTheBase10 = stringForNumber.length - 2;
			temporaryValue = Math.ceil(arrayOfMaxAndMinValues[key][0] / Math.pow(10, exponentToTheBase10));
			if(arrayOfMaxAndMinValues[key][0] == (temporaryValue*Math.pow(10, exponentToTheBase10))) {
				minRange = arrayOfMaxAndMinValues[key][0];
			} else if(arrayOfMaxAndMinValues[key][0] > ((temporaryValue - 0.5)*Math.pow(10, exponentToTheBase10))){
				minRange = (temporaryValue - 0.5)*Math.pow(10, exponentToTheBase10);
			} else {
				minRange = (temporaryValue - 1)*Math.pow(10, exponentToTheBase10);
			}
		}
		if(arrayOfMaxAndMinValues[key][1] > 0) {
			stringForNumber = arrayOfMaxAndMinValues[key][1].toString();
			exponentToTheBase10 = stringForNumber.length - 1;
			temporaryValue = Math.floor(arrayOfMaxAndMinValues[key][1] / Math.pow(10, exponentToTheBase10));
			if(arrayOfMaxAndMinValues[key][1] == (temporaryValue*Math.pow(10, exponentToTheBase10))) {
				maxRange = arrayOfMaxAndMinValues[key][1];
			} else if(arrayOfMaxAndMinValues[key][1] < ((temporaryValue + 0.5)*Math.pow(10, exponentToTheBase10))){
				maxRange = (temporaryValue + 0.5)*Math.pow(10, exponentToTheBase10);
			} else {
				maxRange = (temporaryValue + 1)*Math.pow(10, exponentToTheBase10);
			}
		}
		
		arrayOfRangesForValues.push(minRange + " " +maxRange);
	}
	return arrayOfRangesForValues;
};
			
/**
 * This method returns the string for the HTML table that is drawn to provide
 * data for the chart widget.
 *
 * @scope    public instance method
 * @return	 The HTML string
 */
orp.plugins.ScatterPlot.prototype._getHtmlTextForChart = function() {
	
	var isComplete = false;
	var isBubblePlot = false;
	var listOfAttributesForAxes = [];
	var arrayOfMaxAndMinValues = new Array();
	
	var world = this.getWorld();
	var createNewLayoutItemIfNecessary;
	var layoutItem = this.getLayoutItem(createNewLayoutItemIfNecessary = true);
	if (layoutItem) {
		var attributeCalledSelectedAttribute = world.getItemFromUuid(orp.view.SectionView.UUID.ATTRIBUTE_SELECTED_ATTRIBUTES);
		var listOfSelectedAttributes = layoutItem.getEntriesForAttribute(attributeCalledSelectedAttribute);
		alert(listOfSelectedAttributes);
		if (listOfSelectedAttributes.length == 3) {
			isComplete = true;
			isBubblePlot = true;
			listOfAttributesForAxes = listOfSelectedAttributes;
			arrayOfMaxAndMinValues[0] = [0, 0];
			arrayOfMaxAndMinValues[1] = [0, 0];
			arrayOfMaxAndMinValues[2] = [0, 0];
		} else if (listOfSelectedAttributes.length == 2) {
			isComplete = true;
			isBubblePlot = false;
			listOfAttributesForAxes = listOfSelectedAttributes;
			arrayOfMaxAndMinValues[0] = [0, 0];
			arrayOfMaxAndMinValues[1] = [0, 0];
		}
		// Calculate maximum and minimum for each selected attribute
		var listOfContentItems = [];
		listOfContentItems = this.fetchItems();				
		for(var key in listOfContentItems) {
			var contentItem = listOfContentItems[key];
			var listOfAttributesForItem = contentItem.getAttributes();
			for (var aKey in this._listOfAxisAttributes) {					
				var listOfValues = contentItem.getValuesForAttribute(this._listOfAxisAttributes[aKey]);
				if (listOfValues.length > 0) {
					firstValue = listOfValues[0];
					if (dojo.lang.isNumber(firstValue)) {
						arrayOfMaxAndMinValues[aKey] = this._checkForMaxOrMin(arrayOfMaxAndMinValues[aKey], firstValue);
					}
				}
			}
		}
		// Calculate the range for each attribute
		var arrayOfRangesForAxes = this._calculateRangesForAxes(arrayOfMaxAndMinValues);			
	}
	
	var difference;
	if(isBubblePlot) {
		difference = arrayOfMaxAndMinValues[2][1] - arrayOfMaxAndMinValues[2][0];
	}
	var plotType;
	if(isBubblePlot) {
		plotType = "bubble";
	} else {
		plotType = "scatter";
	}
	var xAxisLocation = 0;
	if((arrayOfMaxAndMinValues[0][0] < 0) && (arrayOfMaxAndMinValues[0][1] === 0)) {
		xAxisLocation = arrayOfMaxAndMinValues[0][0];
	}
	var axisLocation = "0 " + xAxisLocation;
	var listOfHtmlStrings = [];
	listOfHtmlStrings.push('<div dojoType="chart" class="' + orp.plugins.ScatterPlot.cssClass.CHARTDIV+ '">');
	listOfHtmlStrings.push('<table width="550" height="400" padding="24" plotType="line" axisAt="' + axisLocation + '" rangeX="' + arrayOfRangesForAxes[0] + '" rangeY="' + arrayOfRangesForAxes[1] +'">');
	listOfHtmlStrings.push('<thead>');
	listOfHtmlStrings.push('<tr>');
	listOfHtmlStrings.push('<th>X</th>');
	listOfHtmlStrings.push('<th plotType="' + plotType + '" color="' + this._getColorOfPoints() + '">Series A</th>');
	listOfHtmlStrings.push('</tr>');
	listOfHtmlStrings.push('</thead>');

	listOfHtmlStrings.push('<tbody>');
	
	for(var cKey in listOfContentItems) {
		var newContentItem = listOfContentItems[cKey];
		var newListOfAttributesForItem = contentItem.getAttributes();
		var newListOfAttributeValues = [];
		for (var j in this._listOfAxisAttributes) {					
			var newListOfValues = newContentItem.getValuesForAttribute(this._listOfAxisAttributes[j]);
			if (newListOfValues.length > 0) {
				firstValue = newListOfValues[0];
				if (dojo.lang.isNumber(firstValue)) {
					newListOfAttributeValues.push(firstValue);						
				}
			}
		}
		if((newListOfAttributeValues.length == 2) && !isBubblePlot) {
			listOfHtmlStrings.push('<tr><td>' + newListOfAttributeValues[0] + '</td><td>' + newListOfAttributeValues[1] + '</td></tr>');
		} else if((newListOfAttributeValues.length == 3) && isBubblePlot) {
			var size = 0;
			if(difference !== 0) {
				size = Math.abs(newListOfAttributeValues[2]/difference*this._MAXIMUM_BUBBLE_SIZE);
				listOfHtmlStrings.push('<tr><td>' + newListOfAttributeValues[0] + '</td><td size=' + size + '>' + newListOfAttributeValues[1] + '</td></tr>');
			}
		}	
	}
	listOfHtmlStrings.push('</tbody>');
	listOfHtmlStrings.push('</table>');
	listOfHtmlStrings.push('</div>');
	return listOfHtmlStrings.join("\n");
};

/**
 * This method checks for stored color values for the selected attributes and returns the color for the plot
 *
 * @scope    private instance method
 * @return	 The color value
 */
orp.plugins.ScatterPlot.prototype._getColorOfPoints = function () {
	var color = "#963";
	var listOfColorEntries = [];
	var listOfColorValues = [];
	var world = this.getWorld();
	var attributeCalledSelectedColor = world.getItemFromUuid(orp.view.SectionView.UUID.ATTRIBUTE_BACKGROUND_COLOR); 
	for(var cKey in this._listOfAxisAttributes) {
		listOfColorEntries = this._listOfAxisAttributes[cKey].getValuesForAttribute(attributeCalledSelectedColor);
		if(listOfColorEntries[0]) {
			listOfColorValues.push(listOfColorEntries[0]);
		}
	}
	if((listOfColorValues.length == 3) && (listOfColorValues[0] == listOfColorValues[1]) && (listOfColorValues[1] == listOfColorValues[2])) {
		color = listOfColorValues[0];
	} else if ((listOfColorValues.length == 2) && (listOfColorValues[0] == listOfColorValues[1])) {
		color = listOfColorValues[0];
	}
	return color;
};

/**
 * This method changes the attribute for a particular axis for which the scatter plot is displayed.
 *
 * @scope    event handler
 * @param	 evt			The event object
 */
orp.plugins.ScatterPlot.prototype._changeAxisAttribute = function (evt) {
	var newAttributeUuid = evt.target.value;
	var axisIndex = parseInt(evt.target.id);
	var selectedAttribute = this._hashTableOfAttributesKeyedByUuid[newAttributeUuid];
	if(this._listOfAxisAttributes[axisIndex]) {
		this._listOfAxisAttributes[axisIndex] = selectedAttribute;
	} else {
		this._listOfAxisAttributes.push(selectedAttribute);
	}
	var world = this.getWorld();
	var createNewLayoutItemIfNecessary;
	var layoutItem = this.getLayoutItem(createNewLayoutItemIfNecessary = true);
	if (layoutItem) {
		var attributeCalledSelectedAttribute = world.getItemFromUuid(orp.view.SectionView.UUID.ATTRIBUTE_SELECTED_ATTRIBUTES);
		var listOfSelectedAttributes = layoutItem.getEntriesForAttribute(attributeCalledSelectedAttribute);
		for(var i in listOfSelectedAttributes) {
			listOfSelectedAttributes[i].voteToDelete();
		}
		for(var j in this._listOfAxisAttributes) {					
			var typeCalledItem =  world.getTypeCalledItem();
			layoutItem.addEntry({attribute: attributeCalledSelectedAttribute, value: this._listOfAxisAttributes[j], type: typeCalledItem});
		}
		this.refresh();
		return;
	}			
};

/**
 * This method changes the plot type to scatter plot.
 *
 * @scope    event handler
 * @param	 evt			The event object
 */	
orp.plugins.ScatterPlot.prototype._changeModeToScatterPlot = function (evt) {
	var containerTableObject = evt.target.parentNode.parentNode.parentNode.parentNode;
	var zAxisRow = containerTableObject.childNodes[1];
	var zAxisCell = zAxisRow.childNodes[2];
	zAxisCell.childNodes[0].disabled = true;
	var world = this.getWorld();
	var createNewLayoutItemIfNecessary;
	var layoutItem = this.getLayoutItem(createNewLayoutItemIfNecessary = true);
	if (layoutItem) {
		var attributeCalledSelectedAttribute = world.getItemFromUuid(orp.view.SectionView.UUID.ATTRIBUTE_SELECTED_ATTRIBUTES);
		var listOfSelectedAttributes = layoutItem.getEntriesForAttribute(attributeCalledSelectedAttribute);
		if(listOfSelectedAttributes[2]) {
			listOfSelectedAttributes[2].voteToDelete();
			while(this._listOfAxisAttributes[2]) {
				this._listOfAxisAttributes.pop();
			}
			this.refresh();
		}
	}
};

/**
 * This method changes the plot type to bubble plot
 *
 * @scope    event handler
 * @param	 evt			The event object
 */
orp.plugins.ScatterPlot.prototype._changeModeToBubblePlot = function (evt) {
	var containerTableObject = evt.target.parentNode.parentNode.parentNode.parentNode;
	var zAxisRow = containerTableObject.childNodes[1];
	var zAxisCell = zAxisRow.childNodes[2];
	zAxisCell.childNodes[0].disabled = false;
};

/**
 * This method displays the color palette for the user to select the color for the plot
 *
 * @scope    event handler
 * @param	 evt			The event object
 */
orp.plugins.ScatterPlot.prototype._displayColorPalette = function (evt) {
	this._colorElement = evt.target.parentNode;
	orp.view.View.removeChildrenOfElement(this._colorElement);
	var colorPicker = dojo.widget.createWidget("ColorPalette", null, this._colorElement, "last");
	dojo.event.connect(colorPicker, "click", this, "_colorSelect");
};

/**
 * This method handles the color selection of the color palette.
 *
 * @scope    event handler
 * @param	 evt			The event object
 */
orp.plugins.ScatterPlot.prototype._colorSelect = function (evt) {	
  	this._setBackgroundColorForAttribute(evt.target.color);
	orp.view.View.removeChildrenOfElement(this._colorElement);
	var anchorObject = orp.view.View.appendNewElement(this._colorElement, "a", null, null, "Color");
	dojo.event.connect(anchorObject, "onclick", this, "_displayColorPalette");
};

/**
 * This method saves the changes made to the color attribute
 *
 * @scope    private instance method
 * @param	 color			The color value
 */
orp.plugins.ScatterPlot.prototype._setBackgroundColorForAttribute = function(color) {
	var world = this.getWorld();
	var attributeCalledBackgroundColor = world.getItemFromUuid(orp.view.SectionView.UUID.ATTRIBUTE_BACKGROUND_COLOR);
	for (var key in this._listOfAxisAttributes) {
		var listOfEntries = this._listOfAxisAttributes[key].getEntriesForAttribute(attributeCalledBackgroundColor);
		if (listOfEntries[0]) {
			var affectedEntry = listOfEntries[0];
			this._listOfAxisAttributes[key].addEntry({attribute: attributeCalledBackgroundColor, previousEntry: affectedEntry, value: color});		
		} else {
			var typeCalledText = world.getTypeCalledText();
			this._listOfAxisAttributes[key].addEntry({attribute: attributeCalledBackgroundColor, value: color, type: typeCalledText});
		}
	}
	this.refresh();
};

// End of file
