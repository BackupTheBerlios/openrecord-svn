/*****************************************************************************
 DetailPlugin.js
 
******************************************************************************
 Written in 2005 by Brian Douglas Skinner <brian.skinner@gumption.org>
  
 Copyright rights relinquished under the Creative Commons  
 Public Domain Dedication:
    http://creativecommons.org/licenses/publicdomain/
  
 You can copy freely from this file.  This work may be freely reproduced, 
 distributed, transmitted, used, modified, built upon, or otherwise exploited
 by anyone for any purpose.
  
 This work is provided on an "AS IS" basis, without warranties or conditions 
 of any kind, either express or implied, including, without limitation, any 
 warranties or conditions of title, non-infringement, merchantability, or 
 fitness for a particular purpose. You are solely responsible for determining 
 the appropriateness of using or distributing the work and assume all risks 
 associated with use of this work, including but not limited to the risks and 
 costs of errors, compliance with applicable laws, damage to or loss of data 
 or equipment, and unavailability or interruption of operations.

 In no event shall the authors or contributors have any liability for any 
 direct, indirect, incidental, special, exemplary, or consequential damages,
 however caused and on any theory of liability, whether in contract, strict 
 liability, or tort (including negligence), arising in any way out of or in 
 connection with the use or distribution of the work.
*****************************************************************************/


// -------------------------------------------------------------------
// Provides and Requires
// -------------------------------------------------------------------
dojo.provide("orp.DetailPlugin");
dojo.require("orp.view.PluginView");
dojo.require("orp.view.SectionView");
dojo.require("orp.util.Util");
dojo.require("orp.model.Item");
dojo.require("orp.lang.Lang");
dojo.require("dojo.widget.*");
dojo.require("dojo.widget.ComboBox");
dojo.require("dojo.widget.html.ComboBox");

// -------------------------------------------------------------------
// Dependencies, expressed in the syntax that JSLint understands:
// 
/*global Util  */
/*global Item  */
/*global SectionView  */
/*global PluginView  */
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------

/**
 * A DetailPlugin displays one or more content items. 
 *
 * @scope    public instance constructor
 * @extends  PluginView
 * @param    superview    The View that serves as the superview for this view. 
 * @param    htmlElement    The HTMLElement to display this view in. 
 * @param    querySpec    The Query Spec item that provides the items for this PluginView to display
 * @param    layoutItem    ???. 
 * @syntax   var detailPlugin = new orp.DetailPlugin()
 */
orp.DetailPlugin = function(superview, htmlElement, querySpec, layoutItem) {
  orp.view.PluginView.call(this, superview, htmlElement, querySpec, layoutItem, "DetailPlugin");
  dojo.event.connect(this.getRootView(), "setShowToolsMode", this, "justSwitchedShowToolsMode");
};

dojo.inherits(orp.DetailPlugin, orp.view.PluginView);  // makes DetailPlugin be a subclass of PluginView


// -------------------------------------------------------------------
// Register this plugin in the SectionView registry
// -------------------------------------------------------------------
orp.DetailPlugin.UUID = { PLUGIN_VIEW_DETAIL: "00040303-ce7f-11d9-8cd5-0011113ae5d6" };
// FIXME:
// orp.view.SectionView.registerPlugin(orp.DetailPlugin);


// -------------------------------------------------------------------
// Public class methods
// -------------------------------------------------------------------

/**
 * Returns the UUID of the item that represents this class of plugin.
 *
 * @scope    public class method
 * @return   The UUID of the item that represents this class of plugin
 */
orp.DetailPlugin.getPluginItemUuid = function () {
  return orp.DetailPlugin.UUID.PLUGIN_VIEW_DETAIL;
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
orp.DetailPlugin.prototype.getClass = function () {
  return orp.DetailPlugin;
};


/**
 * Re-creates all the HTML for the DetailPlugin, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    public instance method
 */
orp.DetailPlugin.prototype.refresh = function () {
  orp.view.View.removeChildrenOfElement(this.getHtmlElement());

  // for each content item, create a table for it
  var listOfContentItems = this.fetchItems();
  for (var contentItemKey in listOfContentItems) {
    var contentItem = listOfContentItems[contentItemKey];
    this.createTableForItem(contentItem);
    orp.view.View.appendNewElement(this.getHtmlElement(),"p",null,null,'\u00a0'); // unicode for &nbsp;
  }
};

orp.DetailPlugin.prototype.justSwitchedShowToolsMode = function () {
  this.refresh();
};

/**
 * Given an item to display, returns a string with XHTML to display
 * the item.
 *
 * @scope    public instance method
 * @param    inItem    An item to be displayed. 
 * @return   A string containing the XHTML to display the item.
 */
orp.DetailPlugin.prototype.createTableForItem = function (inItem) {
  orp.lang.assert(inItem instanceof orp.model.Item);
  
  var attributeCalledName = this.getWorld().getAttributeCalledName();
  
  var itemTable = orp.view.View.appendNewElement(this.getHtmlElement(),"table", orp.view.SectionView.cssClass.SIMPLE_TABLE);
  var headerRow = orp.view.View.appendNewElement(itemTable, "tr");
  orp.view.View.appendNewElement(headerRow, "td", orp.view.SectionView.cssClass.TITLE, null, "Attribute");
  orp.view.View.appendNewElement(headerRow, "td", orp.view.SectionView.cssClass.TITLE, null, "Value");
  
  if (this.getRootView().isInShowToolsMode()) {
    orp.view.View.appendNewElement(headerRow, "td", orp.view.SectionView.cssClass.TITLE, null, "Expected Type");
  }
  
  this.createRowForAttribute(inItem, attributeCalledName, itemTable);
  
  var listOfAttributes = inItem.getAttributes();
  for (var key in listOfAttributes) { 
    var attribute = listOfAttributes[key];
    if (attribute != attributeCalledName) {
      this.createRowForAttribute(inItem, attribute, itemTable);
    }
  }
  if (this.isInEditMode()) {
    var newRow = orp.view.View.appendNewElement(itemTable,"tr");
    var cssLine = "comboBox";
    var newAttributeCell = orp.view.View.appendNewElement(newRow, "td", cssLine);
    newAttributeCell.superView = this;
    listOfAttributes = this.getWorld().getAttributes();
    
    var comboData = new Array();
    var j = 0;
    for (var i = 0; i < listOfAttributes.length; ++i) {
      // Only list attributes that aren't already in the table.
      if (inItem.getSingleEntryFromAttribute(listOfAttributes[i]) === null) {
        comboData[j] = new Array(listOfAttributes[i].getDisplayName(), listOfAttributes[i].getUuidString());
        ++j;
      }
    }
    var comboBox = dojo.widget.createWidget("ComboBox", {}, newAttributeCell, "last");
    var provider = comboBox.dataProvider;
    provider.setData(comboData);
    newAttributeCell.onComboBoxKeyUp = function(evt) {
      if (evt.keyCode != orp.util.ASCII.RETURN) {
        return;
      }
      var attribute = orp.DetailPlugin.getAttributeFromComboBoxValue(evt.target.value, this.superView.getWorld());
      inItem.addEntry({attribute: attribute, value: ""});
      orp.DetailPlugin.updateNewRow(newRow, inItem, attribute, this.superView);
    };
    dojo.event.connect(comboBox, "onKeyUp", newAttributeCell, "onComboBoxKeyUp");
    newAttributeCell.selectOption = function(evt) {
      if (evt && evt.type == "click" && evt.target && evt.target.textContent) {
        var attribute = orp.DetailPlugin.getAttributeFromComboBoxValue(evt.target.textContent, this.superView.getWorld());
        inItem.addEntry({attribute: attribute, value: ""});
        orp.DetailPlugin.updateNewRow(newRow, inItem, attribute, this.superView);
      }
    };
    dojo.event.connect(comboBox, "selectOption", newAttributeCell, "selectOption");
  }
};

orp.DetailPlugin.updateNewRow = function(newRow, item, attribute, superView) {
  orp.view.View.removeChildrenOfElement(newRow);
  var cssLine = orp.view.SectionView.cssClass.LABEL + " " + orp.view.SectionView.cssClass.PLAIN;  
  var columnOneCell = orp.view.View.appendNewElement(newRow, "td", cssLine, null, attribute.getDisplayName());
  var columnTwoCell = orp.view.View.appendNewElement(newRow, "td", null, null);
  var multiEntriesView = new orp.view.MultiEntriesView(superView, columnTwoCell, item, attribute);
  multiEntriesView.refresh();
  multiEntriesView.select(true);
  multiEntriesView.setKeyPressFunction(function (evt, entryView) {return superView.keyPressOnEditField(evt, entryView);});
};

orp.DetailPlugin.getAttributeFromComboBoxValue = function(comboBoxValue, world) {
  var listOfAttributes = world.getAttributes();
  var attribute;
  for (var i = 0; i < listOfAttributes.length; ++i) {
    if (listOfAttributes[i].getDisplayName() == comboBoxValue) {
      attribute = listOfAttributes[i];
      break;
    }
  }
  if (i == listOfAttributes.length) {
    attribute = world.newAttribute(comboBoxValue);
    var attributeCalledExpectedType = world.getAttributeCalledExpectedType();
    var typeCalledText = world.getTypeCalledText();
    attribute.addEntry({attribute: attributeCalledExpectedType, value: typeCalledText});
  }
  return attribute;
};

orp.DetailPlugin.prototype.createRowForAttribute = function (item, attribute, htmlTableElement, cssClass) {
  var tableRow = orp.view.View.appendNewElement(htmlTableElement, "tr");
  var cssLine = orp.view.SectionView.cssClass.LABEL;

  var columnOneCell = orp.view.View.appendNewElement(tableRow, "td", cssLine, null, attribute.getDisplayName());
  var columnTwoCell = orp.view.View.appendNewElement(tableRow, "td", cssClass, null);
  var multiEntriesView = new orp.view.MultiEntriesView(this, columnTwoCell, item, attribute);
  multiEntriesView.refresh();

  if (this.getRootView().isInShowToolsMode()) {
    var columnThreeCell = orp.view.View.appendNewElement(tableRow, "td", cssClass);
    var attributeCalledExpectedType = this.getWorld().getAttributeCalledExpectedType();
    var multiEntriesView2 = new orp.view.MultiEntriesView(this, columnThreeCell, attribute, attributeCalledExpectedType);
    multiEntriesView2.refresh();
  }
};

/*
This is a subset of orp.TablePlugin.prototype.keyPressOnEditField.
*/
orp.DetailPlugin.prototype.keyPressOnEditField = function(eventObject, anEntryView) {
  var asciiValueOfKey = eventObject.keyCode;
  var shiftKeyPressed = eventObject.shiftKey;
  
  var MOVE_LEFT = "left";
  var MOVE_UP = "up";
  var MOVE_RIGHT = "right";
  var MOVE_DOWN = "down";
  
  var move = null;
  switch (asciiValueOfKey) {
    case orp.util.ASCII.RETURN:
      move = (shiftKeyPressed) ? MOVE_UP : MOVE_DOWN;
      break;
    case orp.util.ASCII.TAB:
      move = (shiftKeyPressed) ? MOVE_LEFT : MOVE_RIGHT;
      break;
    default:
      move = null;
      break;
  }
  
  if (move) {
    anEntryView.stopEditing();
    this.refresh();
  }
  return move;
};

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
