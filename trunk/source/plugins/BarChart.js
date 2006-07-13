// BarChart.js
// Created by Hiran Ganegedara

// Dojo Package System "provide" and "require" statements
dojo.provide("orp.plugins.BarChart");
dojo.require("orp.view.PluginView");

/**
 * The BarChart view displays a set of content items.
 *
 * @scope    public instance constructor
 * @extends  PluginView
 * @param    superview    The View that serves as the superview for this view.
 * @param    htmlElement    The HTMLElement to display this view in.
 * @param    querySpec    The Query Spec item that provides the items for this PluginView to display
 * @param    layoutItem    An item that can be used to store layout data (like table column order).
 */
orp.plugins.BarChart = function(superview, htmlElement, querySpec, layoutItem) {
	orp.view.PluginView.call(this, superview, htmlElement, querySpec, layoutItem, "BarChart");
	this._arrayOfAttributeValues = new Array();
	this._arrayOfAttributeLabels = new Array();
	this._barHeight = 20;
	this._maxWidth = 500;
	this._pointerLocation = 0;
	this._changedValue = 0;
	this._valueIndex = 0;
	this._attributeIndex = 0;
	this._barObject = null;
	this._maxValue = 0;
	this._chartAttributes = [];
	this._listOfContentItems = [];
	this._colorElement = null;
	this._barColors = [];	
	this._hasNegativeValues = false;
	this._fromNegativeToPositive = false;
	this._fromPositiveToNegative = false;
	this._tableRowObject = null;	
	this._isEnteringOnlyOnce = true;
};

dojo.inherits(orp.plugins.BarChart, orp.view.PluginView);  // makes BarChart be a subclass of PluginView

// -------------------------------------------------------------------
// Public constants
// -------------------------------------------------------------------
	orp.plugins.BarChart.cssClass = {
	TABLE: "",
	PLAIN: "",
	FRAME: "",
	BAR: "",
	POSITIVE: "positive_bar",
	NEGATIVE: "negative_bar",
	INSIDEBAR: "inside_bar_text",
	OUTSIDEBAR: "outside_bar_text",
	FIRSTBORDER: "first_row_break",
	ROWBORDER: "row_break",
	COLORTABLE: "color_table",
	COLORCELL: "color_cell"};
	
// -------------------------------------------------------------------
// Register this plugin in the SectionView registry
// -------------------------------------------------------------------
orp.plugins.BarChart.UUID = "a4d265d0-124f-11db-b5c2-0011111f4abe";
orp.view.SectionView.registerPlugin(orp.plugins.BarChart);


// -------------------------------------------------------------------
// Public class methods
// -------------------------------------------------------------------

/**
 * Returns the UUID of the item that represents this class of plugin.
 *
 * @scope    public class method
 * @return   The UUID of the item that represents this class of plugin.
 */
orp.plugins.BarChart.getPluginItemUuid = function() {
	return orp.plugins.BarChart.UUID;
};

/**
 * Returns a list of anonymous objects representing Entries that describe the plugin.
 *
 * @scope    public class method
 * @return   A list of anonymous objects representing Entries that describe the plugin.
 */
orp.plugins.BarChart.getEntriesForItemRepresentingPluginClass = function(pluginItem, world) {
	return [
		{	uuid: "a4d265d1-124f-11db-b5c2-0011111f4abe",
			item: pluginItem,
			attribute: world.getAttributeCalledName(),
			value: "Bar Chart" },
		{	uuid: "a4d265d2-124f-11db-b5c2-0011111f4abe",
			item: pluginItem,
			attribute: world.getAttributeCalledShortName(),
			value: "BarChart" },
		{	uuid: "a4d265d3-124f-11db-b5c2-0011111f4abe",
			item: pluginItem,
			attribute: world.getAttributeCalledClassName(),
			value: "BarChart" },
		{	uuid: "a4d265d4-124f-11db-b5c2-0011111f4abe",
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
orp.plugins.BarChart.prototype.getClass = function() {
	return orp.plugins.BarChart;
};

/**
 * This method is called whenever the BarChart plugin is used to
 * display the results of a query.
 *
 * @scope    public instance method
 */
orp.plugins.BarChart.prototype.refresh = function() {
	
	var listOfStrings = [];
	var contentItem = null;
	var temporaryAttribute = null;
	this._chartAttributes = [];
	this._barColors = [];
	this._arrayOfAttributeValues = new Array();
	this._arrayOfAttributeLabels = new Array();
	this._barObject = null;
	this._listOfContentItems = [];
	var listOfValues;
	var firstValue;	
	var attributeUuid;
	var uniqueIdforInstance = dojo.dom.getUniqueId();
	var hashTableOfNumericValueIncidenceKeyedByUuid = {};
	var hashTableOfAttributesKeyedByUuid = {};
	this._listOfContentItems = this.fetchItems();
	if(this._listOfConentItems) {
		this._listOfContentItems.sort(orp.plugins.BarChart.compareItemsByName);
		if(this._hasNegativeValues) {
			this._hasNegativeValues = false;
			this._maxWidth = this._maxWidth * 2;
			
		}
		var world = this.getWorld();
		var createNewLayoutItemIfNecessary;
		var layoutItem = this.getLayoutItem(createNewLayoutItemIfNecessary = true);
		if (layoutItem) {
			// for each attribute, count the number of items where that attribute has a numeric value
			for (var iKey in this._listOfContentItems) {
				contentItem = this._listOfContentItems[iKey];
				var listOfAttributesForItem = contentItem.getAttributes();
				for (var i in listOfAttributesForItem) {
					temporaryAttribute = listOfAttributesForItem[i];
					attributeUuid = temporaryAttribute.getUuid();
					hashTableOfAttributesKeyedByUuid[attributeUuid] = temporaryAttribute;
					listOfValues = contentItem.getValuesForAttribute(temporaryAttribute);
					if (listOfValues.length > 0) {
						firstValue = listOfValues[0];
						if (dojo.lang.isNumber(firstValue)) {
							var count = hashTableOfNumericValueIncidenceKeyedByUuid[attributeUuid];
							if (!count) {
								count = 0;
							}
							count += 1;
							hashTableOfNumericValueIncidenceKeyedByUuid[attributeUuid] = count;						
						} 				
					}
				}
			}
			
					// Get the value for the stored attribute for which the chart is drawn.
			var attributeCalledSelectedAttribute = world.getItemFromUuid(orp.view.SectionView.UUID.ATTRIBUTE_SELECTED_ATTRIBUTES);
			var listOfSelectedAttributes = layoutItem.getEntriesForAttribute(attributeCalledSelectedAttribute);
			// If the attribute is null then decide for which attribute the chart is going to be drawn.
			if(listOfSelectedAttributes.length === 0) {
				
				// find the attribute for which most of the items have a numeric value
				var maxIncidence = 0;
				var selectedAttribute;
				for (attributeUuid in hashTableOfNumericValueIncidenceKeyedByUuid) {
					var incidenceOfAttribute = hashTableOfNumericValueIncidenceKeyedByUuid[attributeUuid];
					if (incidenceOfAttribute > maxIncidence) {
						selectedAttribute = hashTableOfAttributesKeyedByUuid[attributeUuid];
						maxIncidence = incidenceOfAttribute;
					}
				}
				if(selectedAttribute) {
					var typeCalledItem = world.getTypeCalledItem();
					layoutItem.addEntry({attribute: attributeCalledSelectedAttribute, value: selectedAttribute, type: this._typeCalledItem});
					this._chartAttributes.push(selectedAttribute);
				}
			} else {		
				for(var key in listOfSelectedAttributes) {	
					this._chartAttributes.push(listOfSelectedAttributes[key].getValue());
				}
			}	
		}
		// find the maximum value for the selected attributes
		if (this._chartAttributes[0]) {
			this._maxValue = 0;
			for (var jkey in this._listOfContentItems) {
				contentItem = this._listOfContentItems[jkey];
				for(var mKey in this._chartAttributes) {
					listOfValues = contentItem.getValuesForAttribute(this._chartAttributes[mKey]);
					if (listOfValues.length > 0) {
						var nextValue = listOfValues[0];
						if (dojo.lang.isNumber(nextValue)) {					
							if ((nextValue < 0) && !this._hasNegativeValues) {
									this._hasNegativeValues = true;
									this._maxWidth = this._maxWidth/2;
							}
							nextValue = Math.abs(nextValue);
							this._maxValue = Math.abs(Math.max(this._maxValue, nextValue));
						}
					}
				}
			}
		}
		
		// Set the color of the bars if there is no value, use green.
		var attributeCalledBackgroundColor = world.getItemFromUuid(orp.view.SectionView.UUID.ATTRIBUTE_BACKGROUND_COLOR);	
		for (var cKey in this._chartAttributes) {
			var listOfEntries = this._chartAttributes[cKey].getEntriesForAttribute(attributeCalledBackgroundColor);
			if (listOfEntries[0]) {
				this._barColors.push(listOfEntries[0].getValue());
			} else {
				this._barColors.push("#00ff00");
			}
		}
		
		// add the table header row(s)
		listOfStrings.push("<table class=\"" + orp.plugins.BarChart.cssClass.TABLE + "\">");
		listOfStrings.push("<tr>");
		var attributeCalledName = this.getWorld().getAttributeCalledName();
		listOfStrings.push("<th>" + "" + "</th>"); // listOfStrings.push("<th>" + attributeCalledName.getDisplayName() + "</th>");
	
		if (this._chartAttributes[0]) {
			listOfStrings.push("<th align=left colspan=4>");
			for(var aKey in this._chartAttributes){
				if (aKey > 0) {
					listOfStrings.push(",");
				}
				listOfStrings.push(" " + this._chartAttributes[aKey].getDisplayName());
			}
			listOfStrings.push("</th>");
			listOfStrings.push("<tr><td align=right>Select the Attribute</td><td><form method=post action=\"\"><select ID=" + uniqueIdforInstance + " size=2 multiple>");
			for (attributeUuid in hashTableOfNumericValueIncidenceKeyedByUuid) {
				var incidence = hashTableOfNumericValueIncidenceKeyedByUuid[attributeUuid];
				if (incidence > 0) {
					var displayableAttribute = hashTableOfAttributesKeyedByUuid[attributeUuid];
					listOfStrings.push("<option value="+attributeUuid);
					for(var sKey in this._chartAttributes) {
						if(attributeUuid == this._chartAttributes[sKey].getUuid()) {
							listOfStrings.push(" selected");
							break;
						}
					}
					listOfStrings.push(">"+displayableAttribute.getDisplayName()+"</option>");
				}
			}
			listOfStrings.push("</select></form></td>");
		} else {
			listOfStrings.push("<th>" + "Sorry, there are no attributes with numeric values to chart" + "</th>");
		}
		listOfStrings.push("</tr>");
	
		var staticThis = this;
		this._listOfContentItems.sort(orp.plugins.BarChart.compareItemsByName);
		// add all the table body rows
		for (var kKey in this._listOfContentItems) {
			contentItem = this._listOfContentItems[kKey];
			this._arrayOfAttributeLabels[kKey] = contentItem.getDisplayName("{no name}");		
			var numericValue = "&nbsp;";
			if (this._chartAttributes[0]) {
				listOfStrings.push("<tr>");
				if(kKey === 0) {
					listOfStrings.push("<td width=10% align=right rowspan=" + this._chartAttributes.length + " class=\"" + orp.plugins.BarChart.cssClass.FIRSTBORDER + "\">" + contentItem.getDisplayName("{no name}") + "</td>");
				} else {
					listOfStrings.push("<td width=10% align=right rowspan=" + this._chartAttributes.length + " class=\"" + orp.plugins.BarChart.cssClass.ROWBORDER + "\">" + contentItem.getDisplayName("{no name}") + "</td>");
				}
				for (var index in this._chartAttributes) {
					if(index > 0) {
						listOfStrings.push("<tr>");										
					}
					listOfValues = contentItem.getValuesForAttribute(this._chartAttributes[index]);
					if (listOfValues.length > 0) {
						firstValue = listOfValues[0];
						if (dojo.lang.isNumber(firstValue)) {
							numericValue = firstValue;
							if(this._arrayOfAttributeValues[index]) {
								this._arrayOfAttributeValues[index].push(numericValue);
							} else {
								this._arrayOfAttributeValues[index] = new Array();
								this._arrayOfAttributeValues[index].push(numericValue);
							}
							
						}else {
							numericValue = null;
							if(this._arrayOfAttributeValues[index]) {
								this._arrayOfAttributeValues[index].push(numericValue);
							} else {
								this._arrayOfAttributeValues[index] = new Array();
								this._arrayOfAttributeValues[index].push(numericValue);
							}
						}			
					}
					else {
						if(this._arrayOfAttributeValues[index]) {
								this._arrayOfAttributeValues[index].push(null);
						} else {
							this._arrayOfAttributeValues[index] = new Array();
							this._arrayOfAttributeValues[index].push(null);
						}
					}
					var width = this._maxWidth;
					width = Math.abs(Math.round((numericValue / this._maxValue) * this._maxWidth));
					
					
	
					var tooltip;
					var onlyForNumericValues = null;
					var nonNumeric = false;
					if(this._arrayOfAttributeValues[index][kKey] !== null) {
						if(dojo.lang.isNumber(this._arrayOfAttributeValues[index][kKey])) {
							var cssClassName;
							if (numericValue >= 0) {
								cssClassName = orp.plugins.BarChart.cssClass.POSITIVE;
							} else {
								cssClassName = orp.plugins.BarChart.cssClass.NEGATIVE;
							}
							onlyForNumericValues = " bgcolor="+this._barColors[index]+" class=\"" + cssClassName + "\" style=\"border-color: "+this._barColors[index]+"; cursor: w-resize\" cellspacing=0 cellpadding=0 ";
							toolTip =this._arrayOfAttributeLabels[kKey] +" "+ this._chartAttributes[index].getDisplayName()+ ": "+ numericValue;
						}
					}
					else {
						toolTip= "Non numeric property";
						numericValue = "Non numeric value";
						nonNumeric = true;
					}
					var barAlign = "left";
					var textAlign = "right";
					if((this._hasNegativeValues && (numericValue >= 0)) || (this._hasNegativeValues && nonNumeric)) {
						listOfStrings.push("<td></td><td align=right width=1%></td>");
					}
					if(this._hasNegativeValues && (numericValue < 0)) {
						barAlign = "right";
						textAlign = "left";
						listOfStrings.push("<td>&nbsp;</td>");
					}
					listOfStrings.push("<td align= " + barAlign + "><table ID=\""+ uniqueIdforInstance + "_%_" + index + "_%_" + kKey + "\"");
					listOfStrings.push(onlyForNumericValues);
					listOfStrings.push("width=" + width + "><tr style=cursor:default><td title=\"" + toolTip + "\" align=" + textAlign +">" + numericValue + "</td></tr></table></td><td >&nbsp;</td>");
					if(this._hasNegativeValues && (numericValue < 0)) {
						listOfStrings.push("<td align=left>&nbsp;</td>");
					}
					if(index > 0) {
						listOfStrings.push("</tr>");
					}
				}
			}
			onlyForNumericValues = "";
		}
		listOfStrings.push("</table>");
		// return all the new content
		var finalString = listOfStrings.join("");
		this.getHtmlElement().innerHTML = finalString;
		this.getHtmlElement().align = "center";
		var dropDownObject = document.getElementById(uniqueIdforInstance);
		dojo.event.connect(dropDownObject, "onchange", this, "chageSelectedAttribute");
		for (var j in this._arrayOfAttributeValues[0]) {
			if(this._chartAttributes[0]) {
				for (var bKey in this._chartAttributes) {
					var one = 1;
					var two = 2;
					var three = 3;
					var four = 4;
					if(bKey > 0) {
						one = 0;
						two = 1;
						three = 2;
						four = 3;
					}
					var tableObject = document.getElementById(uniqueIdforInstance+ "_%_" + bKey + "_%_" + j);
					var tableRow = tableObject.parentNode.parentNode;
					if(dojo.lang.isNumber(this._arrayOfAttributeValues[bKey][j])) {
						
						dojo.event.connect(tableObject, "onmousedown", this, "mouseDown");
						var spanElement = orp.view.View.newElement("span", "", null, this._arrayOfAttributeValues[bKey][j].toString());
						this.getHtmlElement().appendChild(spanElement);
						var elementWidth = spanElement.offsetWidth;
						this.getHtmlElement().removeChild(spanElement);
						spanElement.className = orp.plugins.BarChart.cssClass.INSIDEBAR;	
						var barTableRow = tableObject.rows[0];		
						if(this._hasNegativeValues) {					
							if((tableObject.width-5) < elementWidth) {
								spanElement.className = orp.plugins.BarChart.cssClass.OUTSIDEBAR;
								if(this._arrayOfAttributeValues[bKey][j] < 0) {							
									barTableRow.cells[0].innerHTML = "&nbsp;";					
									tableRow.cells[one].appendChild(spanElement);
									tableRow.cells[one].align = "right";
									tableRow.cells[three].colSpan = 2;
									tableRow.cells[two].width = parseInt(tableObject.width) + 5;
									tableRow.removeChild(tableRow.cells[four]);							
								} else {	
									barTableRow.cells[0].innerHTML = "&nbsp;";					
									tableRow.cells[four].appendChild(spanElement);
									tableRow.cells[four].align = "left";
									tableRow.cells[two].colSpan = 2;
									tableRow.cells[three].width = parseInt(tableObject.width) + 5;
									tableRow.removeChild(tableRow.cells[one]);							
								}
							} else {
								barTableRow.cells[0].innerHTML = "";
								barTableRow.cells[0].appendChild(spanElement);
								tableRow.cells[three].colSpan = 2;
								tableRow.removeChild(tableRow.cells[four]);
								tableRow.cells[two].colSpan = 2;
								tableRow.removeChild(tableRow.cells[one]);												
							}
						} else {
							if((tableObject.width - 5) < elementWidth) {
								spanElement.className = orp.plugins.BarChart.cssClass.OUTSIDEBAR;		
								barTableRow.cells[0].innerHTML = "&nbsp;";
								tableRow.cells[one].width = parseInt(tableObject.width) + 5;					
								tableRow.cells[two].appendChild(spanElement);
								tableRow.cells[two].align = "left";
								
							} else {
								barTableRow.cells[0].innerHTML = "";
								barTableRow.cells[0].appendChild(spanElement);
								tableRow.cells[one].colSpan = 2;
								tableRow.removeChild(tableRow.cells[two]);				
							}
						}									
					} else {
						if(this._hasNegativeValues) {
							tableRow.cells[three].colSpan = 2;
							tableRow.removeChild(tableRow.cells[four]);
							tableRow.cells[two].colSpan = 2;
							tableRow.removeChild(tableRow.cells[one]);
						} else {
							tableRow.cells[one].colSpan = 2;
							tableRow.removeChild(tableRow.cells[two]);
						}
					}
				}
			}
		}
		var colorTableObject = orp.view.View.appendNewElement(this.getHtmlElement(), "table", orp.plugins.BarChart.cssClass.COLORTABLE, null, null);
		for (var colorKey in this._chartAttributes) {
			var tableRowObject = orp.view.View.appendNewElement(colorTableObject, "tr", null, null, null);
			var attributeNameCell = orp.view.View.appendNewElement(tableRowObject, "td", null, null, this._chartAttributes[colorKey].getDisplayName());
			var colorCell = orp.view.View.appendNewElement(tableRowObject, "td", orp.plugins.BarChart.cssClass.COLORCELL, null, null);
			colorCell.id = colorKey.toString();
			colorCell.innerHTML = "&nbsp;";
			colorCell.bgColor = this._barColors[colorKey];
			dojo.event.connect(colorCell, "onclick", this, "displayColorPalette");
		}
	} else {
		return;
	}
};

/**
 * This method the selection of the drop down list
 *
 * @scope    public instance method
 */
 
orp.plugins.BarChart.prototype.chageSelectedAttribute = function (evt) {
	var world = this.getWorld();
	var listOfSelectedAttributes = [];
	var hashTableOfAttributesKeyedByUuid = {};
	this._chartAttributes = [];
	for(var j in evt.target.options) {
		if(evt.target.options[j].selected) {
			listOfSelectedAttributes.push(evt.target.options[j].value);
		}
	}
	for (var iKey in this._listOfContentItems) {
		contentItem = this._listOfContentItems[iKey];
		var listOfAttributesForItem = contentItem.getAttributes();
		for (var i in listOfAttributesForItem) {
			temporaryAttribute = listOfAttributesForItem[i];
			attributeUuid = temporaryAttribute.getUuid();
			hashTableOfAttributesKeyedByUuid[attributeUuid] = temporaryAttribute;
		}
	}
	var layoutItem = this.getLayoutItem();
	var attributeCalledSelectedAttribute = world.getItemFromUuid(orp.view.SectionView.UUID.ATTRIBUTE_SELECTED_ATTRIBUTES);
	
	if (layoutItem) {
		var listOfEntriesForSelectedAttribute = layoutItem.getEntriesForAttribute(attributeCalledSelectedAttribute);			
		for (var aKey in listOfEntriesForSelectedAttribute) {
			listOfEntriesForSelectedAttribute[aKey].voteToDelete();
		}
		if (listOfSelectedAttributes[0]) {
			this._chartAttributes = [];
			for (var index in listOfSelectedAttributes) {	
				var newSelectedAttribute = hashTableOfAttributesKeyedByUuid[listOfSelectedAttributes[index]];
				this._chartAttributes.push(newSelectedAttribute);					
				var typeCalledItem = world.getTypeCalledItem();
				layoutItem.addEntry({attribute: attributeCalledSelectedAttribute, value: newSelectedAttribute, type: typeCalledItem});
			}
		}
	}
	this.refresh();	
};


/**
 * This method is called whenever the mouse is moved after executing the
 * orp.plugins.BarChart.prototype.mouseDown function.
 *
 * @scope    public instance method
 */
orp.plugins.BarChart.prototype.mouseMove = function(evt) {	
	var mouseX = evt.clientX;
	var barWidth = parseInt(this._barObject.width);
	var change = mouseX-this._pointerLocation;
	var barChartRowHtml = [];
	var newWidth = 0;
	var newValue = 0;
	var barTableRow = null;	
	var spanElement;
	var elementWidth;
	var one = 1;
	var two = 2;
	var three = 3;
	var four = 4;
	if(this._attributeIndex > 0) {
		one = 0;
		two = 1;
		three = 2;
		four = 3;
	}
	barChartRowHtml.push("<tr style=\"cursor:default\"><td bgcolor="+this._barColors[this._attributeIndex]);
	
	if(this._changedValue > 0) {
		newWidth = barWidth + change;
		if(newWidth > this._maxWidth) {
			newWidth = this._maxWidth;
		} else if(newWidth <=0) {
			newWidth = 0;
		}		
		newValue= Math.abs(Math.round(newWidth/this._maxWidth*this._maxValue));
		spanElement = orp.view.View.newElement("span", "", null, newValue.toString());				
		this.getHtmlElement().appendChild(spanElement);
		elementWidth = spanElement.offsetWidth;
		this.getHtmlElement().removeChild(spanElement);
		barChartRowHtml.push("  title=\""+this._arrayOfAttributeLabels[this._valueIndex]+": "+this._chartAttributes[this._attributeIndex].getDisplayName()+" is "+newValue+"\" align=right>&nbsp;</td></tr>");
		this._barObject.innerHTML = barChartRowHtml.join("");		
		spanElement.className = orp.plugins.BarChart.cssClass.INSIDEBAR;
		barTableRow = this._barObject.rows[0];
		if(this._hasNegativeValues) {
			if((newWidth-5) < elementWidth) {
				spanElement.className = orp.plugins.BarChart.cssClass.OUTSIDEBAR;
				if(this._tableRowObject.cells.length == three) {					
					this._tableRowObject.cells[two].colSpan = 1;
					this._tableRowObject.insertCell(three);
				} else if(this._tableRowObject.cells[four]) {
					this._tableRowObject.removeChild(this._tableRowObject.cells[four]);
				}	
				this._barObject.rows[0].cells[0].innerHTML = "&nbsp;";
				this._tableRowObject.cells[three].innerHTML = "";
				this._tableRowObject.cells[three].appendChild(spanElement);
				this._tableRowObject.cells[three].align = "left";
				this._tableRowObject.cells[two].innerHTML = "";
				this._tableRowObject.cells[two].appendChild(this._barObject);
				this._tableRowObject.cells[two].width = newWidth + 5;
				this._tableRowObject.cells[two].align = "left";				
			} else {
				spanElement.className = orp.plugins.BarChart.cssClass.INSIDEBAR;
				barTableRow.cells[0].innerHTML = "";
				barTableRow.cells[0].appendChild(spanElement);
				barTableRow.cells[0].align = "right";
				this._tableRowObject.cells[two].innerHTML = "";
				this._tableRowObject.cells[two].appendChild(this._barObject);
				if(this._tableRowObject.cells[two].colSpan != 2) {
					this._tableRowObject.removeChild(this._tableRowObject.cells[three]);
					this._tableRowObject.cells[two].colSpan = 2;
					this._tableRowObject.cells[two].width = null;
				}
			}
			this._isEnteringOnlyOnce = true;
			this._fromNegativeToPositive = false;
			this._fromPositiveToNegative = true;					
		} else {
			if((newWidth-5) < elementWidth) {
				spanElement.className = orp.plugins.BarChart.cssClass.OUTSIDEBAR;
				if(this._tableRowObject.cells[one].colSpan == 2) {		
					this._barObject.rows[0].cells[0].innerHTML = "&nbsp;";
					this._tableRowObject.insertCell(two);
					this._tableRowObject.cells[one].width = newWidth + 5;
					this._tableRowObject.cells[one].colSpan = 1;
					this._tableRowObject.cells[one].innerHTML = "";
					this._tableRowObject.cells[one].appendChild(this._barObject);
					this._tableRowObject.cells[two].appendChild(spanElement);
					this._tableRowObject.cells[two].align = "left";
				} else {
					this._tableRowObject.cells[two].innerHTML = "";
					this._tableRowObject.cells[two].appendChild(spanElement);
					this._tableRowObject.cells[two].align = "left";
					this._tableRowObject.cells[one].innerHTML = "";
					this._tableRowObject.cells[one].appendChild(this._barObject);
					this._tableRowObject.cells[one].width = newWidth + 5;
				}
			} else {	
				spanElement.className = orp.plugins.BarChart.cssClass.INSIDEBAR;			
				barTableRow.cells[0].innerHTML = "";
				barTableRow.cells[0].appendChild(spanElement);
				barTableRow.cells[0].align = "right";
				this._tableRowObject.cells[one].innerHTML = "";
				this._tableRowObject.cells[one].appendChild(this._barObject);
				if(this._tableRowObject.cells[one].colSpan != 2) {
					this._tableRowObject.removeChild(this._tableRowObject.cells[two]);
					this._tableRowObject.cells[one].colSpan = 2;
					this._tableRowObject.cells[one].width = null;
				}
			}
		}		
		
	} else if(this._changedValue <0) {
		newWidth = barWidth - change;
		if(newWidth > this._maxWidth) {
			newWidth = this._maxWidth;
		} else if(newWidth <=0) {
			newWidth = 0;
		}
		newValue= 0 - Math.round(newWidth/this._maxWidth*this._maxValue);
		spanElement = orp.view.View.newElement("span", "", null, newValue.toString());				
		this.getHtmlElement().appendChild(spanElement);
		elementWidth = spanElement.offsetWidth;
		this.getHtmlElement().removeChild(spanElement);
		barChartRowHtml.push("  title=\""+this._arrayOfAttributeLabels[this._valueIndex]+": "+this._chartAttributes[this._attributeIndex].getDisplayName()+" is "+newValue+"\" align=right>&nbsp;</td></tr>");
		this._barObject.innerHTML = barChartRowHtml.join("");
		spanElement.className = orp.plugins.BarChart.cssClass.INSIDEBAR;
		barTableRow = this._barObject.rows[0];
		if(this._hasNegativeValues) {
			if((newWidth-5) < elementWidth) {
				spanElement.className = orp.plugins.BarChart.cssClass.OUTSIDEBAR;
				if(this._tableRowObject.cells.length == three) {					
					this._tableRowObject.cells[one].colSpan = 1;
					this._tableRowObject.insertCell(one);																
				} else if (this._tableRowObject.cells[four]){
					this._tableRowObject.removeChild(this._tableRowObject.cells[four]);
					this._tableRowObject.cells[three].colSpan = 2;
					this._tableRowObject.cells[three].innerHTML = "";
				}
				this._barObject.rows[0].cells[0].innerHTML = "&nbsp;";	
				this._tableRowObject.cells[two].width = newWidth + 5;
				this._tableRowObject.cells[two].innerHTML = "";
				this._tableRowObject.cells[two].appendChild(this._barObject);
				this._tableRowObject.cells[two].align = "right";
				this._tableRowObject.cells[one].innerHTML = "";
				this._tableRowObject.cells[one].appendChild(spanElement);
				this._tableRowObject.cells[one].align = "right";					
			
			} else {	
				spanElement.className = orp.plugins.BarChart.cssClass.INSIDEBAR;							
				barTableRow.cells[0].innerHTML = "";
				barTableRow.cells[0].appendChild(spanElement);
				barTableRow.cells[0].align = "left";
				this._tableRowObject.cells[one].innerHTML = "";
				this._tableRowObject.cells[one].appendChild(this._barObject);
				if(this._tableRowObject.cells[two].colSpan != 2) {
					this._tableRowObject.removeChild(this._tableRowObject.cells[two]);
					this._tableRowObject.cells[one].colSpan = 2;
				}
			}									
		}
		this._isEnteringOnlyOnce = true;
		this._fromNegativeToPositive = true;
		this._fromPositiveToNegative = false;
	} else {
		if(!this._isEnteringOnlyOnce) {
			if(this._fromNegativeToPositive) {
				this._changedValue = 0.001;
				this._pointerLocation = mouseX;
				dojo.event.connect(document, "onmouseup", this, "mouseUp");
				dojo.event.disconnect(document, "onmousedown", this, "mouseDown");
				document.ondblclick = null;
				document.onclick = null;
				return;
			}
			else if(this._fromPositiveToNegative) {
				this._changedValue = -0.001;
				this._pointerLocation = mouseX;
				dojo.event.connect(document, "onmouseup", this, "mouseUp");
				dojo.event.disconnect(document, "onmousedown", this, "mouseDown");
				document.ondblclick = null;
				document.onclick = null;
				return;
			}
		}
		if (this._fromNegativeToPositive && this._isEnteringOnlyOnce) {
			this._barObject.className = orp.plugins.BarChart.cssClass.POSITIVE;			
			newWidth = barWidth + 1;	
			newValue= Math.round(newWidth/this._maxWidth*this._maxValue);
			barChartRowHtml.push("  title=\""+this._arrayOfAttributeLabels[this._valueIndex]+": "+this._chartAttributes[this._attributeIndex].getDisplayName()+" is "+newValue+"\" align=right></td></tr>");
			this._barObject.innerHTML = barChartRowHtml.join("");
			this._barObject.rows[0].cells[0].innerHTML = "&nbsp;";
			spanElement = orp.view.View.newElement("span", "", null, newValue.toString());
			
			
			this._tableRowObject.cells[three].colSpan = 1;
			this._tableRowObject.cells[three].innerHTML = "";	
			this._tableRowObject.cells[three].width = newWidth;
			this._tableRowObject.cells[three].appendChild(this._barObject);
			this._tableRowObject.cells[two].innerHTML = "";
			this._tableRowObject.cells[two].colSpan = 2;
			this._tableRowObject.insertCell(four);
			this._tableRowObject.cells[four].innerHTML = "";
			this._tableRowObject.cells[four].appendChild(spanElement);
			this._tableRowObject.removeChild(this._tableRowObject.cells[one]);
		} else if(this._fromPositiveToNegative && this._isEnteringOnlyOnce) {
			this._barObject.className = orp.plugins.BarChart.cssClass.NEGATIVE;
			newWidth = barWidth + 1;
			newValue= 0 - Math.round(newWidth/this._maxWidth*this._maxValue);
			barChartRowHtml.push("  title=\""+this._arrayOfAttributeLabels[this._valueIndex]+": "+this._chartAttributes[this._attributeIndex].getDisplayName()+" is "+newValue+"\" align=right></td></tr>");
			this._barObject.innerHTML = barChartRowHtml.join("");
			this._barObject.rows[0].cells[0].innerHTML = "&nbsp;";
			spanElement = orp.view.View.newElement("span", "", null, newValue.toString());
			
			this._tableRowObject.cells[one].colSpan = 1;
			this._tableRowObject.cells[one].innerHTML = "";	
			this._tableRowObject.cells[one].width = newWidth;
			this._tableRowObject.cells[one].appendChild(this._barObject);
			this._tableRowObject.cells[two].innerHTML = "";
			this._tableRowObject.cells[two].colSpan = 2;
			this._tableRowObject.removeChild(this._tableRowObject.cells[three]);
			this._tableRowObject.insertCell(1);
			this._tableRowObject.cells[one].innerHTML = "";
			this._tableRowObject.cells[one].align = "right";
			this._tableRowObject.cells[one].appendChild(spanElement);
		} else if(!this._hasNegativeValues) {
			newWidth = barWidth + change;
			newValue = Math.round(newWidth/this._maxWidth*this._maxValue);
			barChartRowHtml.push("  title=\""+this._arrayOfAttributeLabels[this._valueIndex]+": "+this._chartAttributes[this._attributeIndex].getDisplayName()+" is "+newValue+"\" align=right>&nbsp;</td></tr>");
			this._barObject.innerHTML = barChartRowHtml.join("");
			this._barObject.rows[0].cells[0].innerHTML = "&nbsp;";
			spanElement = orp.view.View.newElement("span", "", null, newValue.toString());				
			this.getHtmlElement().appendChild(spanElement);
			elementWidth = spanElement.offsetWidth;
			this.getHtmlElement().removeChild(spanElement);
			this._tableRowObject.cells[one].innerHTML = "";
			this._tableRowObject.cells[one].appendChild(this._barObject);
			this._tableRowObject.cells[two].innerHTML = "";
			this._tableRowObject.cells[two].appendChild(spanElement);
			this._fromNegativeToPositive = false;
			this._fromPositiveToNegative = false;
			this._hasNegativeValues = false;		
		}
		this._isEnteringOnlyOnce = false;	
	}		
	this._changedValue = newValue;
	this._barObject.width = Math.abs(newWidth);	
	this._pointerLocation = mouseX;
	dojo.event.connect(document, "onmouseup", this, "mouseUp");
	dojo.event.disconnect(document, "onmousedown", this, "mouseDown");
	document.ondblclick = null;
	document.onclick = null;	
};

/**
 * This method is called whenever the left mouse button is released after executing the
 * orp.plugins.BarChart.prototype.mouseMove function.
 *
 * @scope    public instance method
 */
orp.plugins.BarChart.prototype.mouseUp = function(evt) {
	if(evt.which==1) {	
		dojo.event.disconnect(document, "onmousemove", this, "mouseMove");
		dojo.event.disconnect(document, "onmouseup", this, "mouseUp");
		var contentItem = this._listOfContentItems[this._valueIndex];
		var listOfEntries = contentItem.getEntriesForAttribute(this._chartAttributes[this._attributeIndex]);
		if (listOfEntries[0]) {
			var affectedEntry = listOfEntries[0];
			contentItem.replaceEntry({previousEntry: affectedEntry, value: this._changedValue});
			this._arrayOfAttributeValues[this._attributeIndex][this._valueIndex] = this._changedValue;
		}
		dojo.event.connect(this._barObject, "onmousedown", this, "mouseDown");
		document.ondblclick = null;
		document.onclick = null;
		this._fromNegativeToPositive = false;
		this._fromPositiveToNegative = false;
		this._barObject = null;
	}
};

/**
 * This method is called whenever the left mouse button is pressed down 
 * in order ot drag and resize the bars.
 *
 * @scope    public instance method
 */
orp.plugins.BarChart.prototype.mouseDown = function(evt) {
	if(evt.target.tagName=="TABLE" && evt.target.style.cursor =="w-resize")	{
		if(evt.which == 1) {
			document.onmousedown = orp.plugins.BarChart.nullfunc;
			document.onclick = null;
			document.ondblclick = null;
			this._pointerLocation=evt.clientX;
			this._barObject = evt.target;
			var splitArray = this._barObject.id.split("_%_");
			this._attributeIndex = parseInt(splitArray[1]);
			this._valueIndex = parseInt(splitArray[2]);
			var tableDataObject = this._barObject.parentNode;
			this._tableRowObject = tableDataObject.parentNode;
			this._isEnteringOnlyOnce = true;
			this._changedValue = this._arrayOfAttributeValues[this._attributeIndex][this._valueIndex];
			if(this._hasNegativeValues) {
				if(this._changedValue > 0) {
					this._fromPositiveToNegative = true;
					this._fromNegativeToPositive = false;
				} else {
					this._fromNegativeToPositive = true;
					this._fromPositiveToNegative = false;
				}
			} else {
				this._fromNegativeToPositive = false;
				this._fromPositiveToNegative = false;
			}
			dojo.event.connect(document, "onmousemove", this, "mouseMove");
			
		}
	}
};

/**
 * This method is called in order to stop event propegation
 *
 * @scope    provate instance method
 */
orp.plugins.BarChart.nullfinc = function() {
	return false;
};

orp.plugins.BarChart.prototype.displayColorPalette = function (evt) {
	this._colorElement = evt.target;
	orp.view.View.removeChildrenOfElement(this._colorElement);
	this._colorElement.parentNode.insertCell(2);
	var colorPicker = dojo.widget.createWidget("ColorPalette", null, this._colorElement.parentNode.cells[2], "last");
	dojo.event.connect(colorPicker, "click", this, "colorSelect");
};

// Sets the color of the selected attribute
orp.plugins.BarChart.prototype.colorSelect = function (evt) {
	
  	this.setBackgroundColorForAttribute(evt.target.color, this._colorElement.id);
	this._colorElement.parentNode.removeChild(this._colorElement.parentNode.cells[2]);
};

// Sets the color of any given attribute
orp.plugins.BarChart.prototype.setBackgroundColorForAttribute = function(color, attributeIndex) {
	var world = this.getWorld();
	var attributeCalledBackgroundColor = world.getItemFromUuid(orp.view.SectionView.UUID.ATTRIBUTE_BACKGROUND_COLOR);	
	var listOfEntries = this._chartAttributes[attributeIndex].getEntriesForAttribute(attributeCalledBackgroundColor);
	if (listOfEntries[0]) {
		var affectedEntry = listOfEntries[0];
		this._chartAttributes[attributeIndex].addEntry({attribute: attributeCalledBackgroundColor, previousEntry: affectedEntry, value: color});		
	} else {
		var typeCalledText = world.getTypeCalledText();
		this._chartAttributes[attributeIndex].addEntry({attribute: attributeCalledBackgroundColor, value: color, type: typeCalledText});
	}
	this.refresh();
};			

orp.plugins.BarChart.compareItemsByName = function(itemA, itemB) {
	var strA = itemA.getDisplayName().toLowerCase();
	var strB = itemB.getDisplayName().toLowerCase();
	if (strA < strB) {return -1;}
	if (strA == strB) {return 0;}
	return 1;
};
// End of file


// End of file
