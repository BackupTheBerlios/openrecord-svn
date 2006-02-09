/*****************************************************************************
 ButtonView.js

******************************************************************************
 Created in 2006 by Brian Douglas Skinner <skinner@dojotoolkit.org>

 Copyright rights relinquished under the Creative Commons  
 Public Domain Dedication:
    http://creativecommons.org/licenses/publicdomain/
*****************************************************************************/

// Dojo Package System "provide" and "require" statements
dojo.provide("orp.plugins.ButtonView");
dojo.require("orp.view.PluginView");

dojo.require("dojo.widget.*");
dojo.require("dojo.widget.Button2");
dojo.require("dojo.widget.html.Button2");
dojo.require("dojo.widget.Menu2");

/**
 * The ButtonView view displays a set of content items. 
 *
 * @scope    public instance constructor
 * @extends  PluginView
 * @param    superview    The View that serves as the superview for this view. 
 * @param    htmlElement    The HTMLElement to display this view in. 
 * @param    querySpec    The Query Spec item that provides the items for this PluginView to display
 * @param    layoutItem    An item that can be used to store layout data (like table column order). 
 */
orp.plugins.ButtonView = function(superview, htmlElement, querySpec, layoutItem) {
  orp.view.PluginView.call(this, superview, htmlElement, querySpec, layoutItem, "ButtonView");
};

dojo.inherits(orp.plugins.ButtonView, orp.view.PluginView);  // makes ButtonView be a subclass of PluginView


// -------------------------------------------------------------------
// Register this plugin in the SectionView registry
// -------------------------------------------------------------------
orp.plugins.ButtonView.UUID = "b8344e10-7bdf-11da-a86a-0011111f4abe";
orp.view.SectionView.registerPlugin(orp.plugins.ButtonView);


// -------------------------------------------------------------------
// Public class methods
// -------------------------------------------------------------------

/**
 * Returns the UUID of the item that represents this class of plugin.
 *
 * @scope    public class method
 * @return   The UUID of the item that represents this class of plugin.
 */
orp.plugins.ButtonView.getPluginItemUuid = function() {
  return orp.plugins.ButtonView.UUID;
};

/**
 * Returns a list of anonymous objects representing Entries that describe the plugin.
 *
 * @scope    public class method
 * @return   A list of anonymous objects representing Entries that describe the plugin.
 */
orp.plugins.ButtonView.getEntriesForItemRepresentingPluginClass = function(pluginItem, world) {
  return [
    { uuid: "b8344e11-7bdf-11da-a86a-0011111f4abe",
      item: pluginItem,
      attribute: world.getAttributeCalledName(),
      value: "Dojo Button" },
    { uuid: "b8344e12-7bdf-11da-a86a-0011111f4abe",
      item: pluginItem,
      attribute: world.getAttributeCalledShortName(),
      value: "ButtonView" },
    { uuid: "b8344e13-7bdf-11da-a86a-0011111f4abe",
      item: pluginItem,
      attribute: world.getAttributeCalledClassName(),
      value: "ButtonView" },
    { uuid: "b8344e14-7bdf-11da-a86a-0011111f4abe",
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
orp.plugins.ButtonView.prototype.getClass = function() {
  return orp.plugins.ButtonView;
};

/**
 * This method is called whenever the ButtonView plugin is used to
 * display the results of a query.
 *
 * @scope    public instance method
 */
orp.plugins.ButtonView.prototype.refresh = function() {
  var listOfContentItems = this.fetchItems();
  var outlineDiv = this.getHtmlElement();

  orp.view.View.removeChildrenOfElement(outlineDiv);
  var divElement = orp.view.View.appendNewElement(outlineDiv, "div");
  
  // This doesn't work yet:
  // var popupMenu = dojo.widget.createWidget("PopupMenu2", {toggle: "wipe"}, divElement, "last");
  // var menuItemA = dojo.widget.createWidget("MenuItem2", {caption: "Save", accelKey: "Ctrl+S"}, divElement, "last");
  // var menuItemB = dojo.widget.createWidget("MenuItem2", {caption: "Save As", accelKey: "Ctrl+A"}, divElement, "last");
  
  for (var i in listOfContentItems) {
    var contentItem = listOfContentItems[i];
    var itemName = contentItem.getDisplayName("{no name}");
    var button2 = dojo.widget.createWidget("Button2", {caption: itemName}, divElement, "last");
    dojo.event.connect(button2, "onClick", this, "buttonClick")
  }
  orp.view.View.appendNewElement(divElement, "p");
  for (var i in listOfContentItems) {
    var contentItem = listOfContentItems[i];
    var itemName = contentItem.getDisplayName("{no name}");
    var dropdown2 = dojo.widget.createWidget("DropDownButton2", {caption: itemName}, divElement, "last");
    dojo.event.connect(dropdown2, "onClick", this, "buttonClick")
  }
  orp.view.View.appendNewElement(divElement, "p");
  for (var i in listOfContentItems) {
    var contentItem = listOfContentItems[i];
    var itemName = contentItem.getDisplayName("{no name}");
    var combo2 = dojo.widget.createWidget("ComboButton2", {caption: itemName}, divElement, "last");
    dojo.event.connect(combo2, "onClick", this, "buttonClick")
  }

};

orp.plugins.ButtonView.prototype.buttonClick = function(clickEvent) {
  var htmlButtonElement = clickEvent.target;
  var textNode = htmlButtonElement.firstChild;
  alert(textNode.nodeValue);
};

