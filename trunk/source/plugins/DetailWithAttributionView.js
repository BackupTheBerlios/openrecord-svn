// DetailWithAttributionView.js
// Created in 2005 by
//   Brian Douglas Skinner <brian.skinner@gumption.org>
//   Mignon Belongie

// Dojo Package System "provide" and "require" statements
dojo.provide("orp.plugins.DetailWithAttributionView");
dojo.require("orp.view.PluginView");

/**
 * The DetailWithAttributionView view displays a set of content items. 
 *
 * @scope    public instance constructor
 * @extends  PluginView
 * @param    superview    The View that serves as the superview for this view. 
 * @param    htmlElement    The HTMLElement to display this view in. 
 * @param    querySpec    The Query Spec item that provides the items for this PluginView to display
 * @param    layoutItem    An item that can be used to store layout data (like table column order). 
 */
orp.plugins.DetailWithAttributionView = function(superview, htmlElement, querySpec, layoutItem) {
  orp.view.PluginView.call(this, superview, htmlElement, querySpec, layoutItem, "DetailWithAttributionView");
};

dojo.inherits(orp.plugins.DetailWithAttributionView, orp.view.PluginView);  // makes DetailWithAttributionView be a subclass of PluginView


// -------------------------------------------------------------------
// Register this plugin in the SectionView registry
// -------------------------------------------------------------------
orp.plugins.DetailWithAttributionView.UUID = "e0f7b540-6b8a-11da-b1ed-0011111f4abe";
orp.view.SectionView.registerPlugin(orp.plugins.DetailWithAttributionView);


// -------------------------------------------------------------------
// Public class methods
// -------------------------------------------------------------------

/**
 * Returns the UUID of the item that represents this class of plugin.
 *
 * @scope    public class method
 * @return   The UUID of the item that represents this class of plugin.
 */
orp.plugins.DetailWithAttributionView.getPluginItemUuid = function() {
  return orp.plugins.DetailWithAttributionView.UUID;
};

/**
 * Returns a list of anonymous objects representing Entries that describe the plugin.
 *
 * @scope    public class method
 * @return   A list of anonymous objects representing Entries that describe the plugin.
 */
orp.plugins.DetailWithAttributionView.getEntriesForItemRepresentingPluginClass = function(pluginItem, world) {
  return [
    { uuid: "e0f7b541-6b8a-11da-b1ed-0011111f4abe",
      item: pluginItem,
      attribute: world.getAttributeCalledName(),
      value: "Detail View (with creator and time)" },
    { uuid: "e0f7b542-6b8a-11da-b1ed-0011111f4abe",
      item: pluginItem,
      attribute: world.getAttributeCalledShortName(),
      value: "DetailWithAttributionView" },
    { uuid: "e0f7b543-6b8a-11da-b1ed-0011111f4abe",
      item: pluginItem,
      attribute: world.getAttributeCalledClassName(),
      value: "DetailWithAttributionView" },
    { uuid: "e0f7b544-6b8a-11da-b1ed-0011111f4abe",
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
orp.plugins.DetailWithAttributionView.prototype.getClass = function() {
  return orp.plugins.DetailWithAttributionView;
};

/**
 * This method is called whenever the DetailWithAttributionView plugin is used to
 * display the results of a query.
 *
 * @scope    public instance method
 */
orp.plugins.DetailWithAttributionView.prototype.refresh = function() {
  var listOfContentItems = this.fetchItems();
  var outlineDiv = this.getHtmlElement();
  orp.view.View.removeChildrenOfElement(outlineDiv);

  for (var i in listOfContentItems) {
    var contentItem = listOfContentItems[i];
    this.createTableForItem(contentItem);
    orp.view.View.appendNewElement(this.getHtmlElement(),"p",null,null,'\u00a0'); // unicode for &nbsp;
  }
};


/**
 * Given an item to be display, returns a string with XHTML to display
 * the item.
 *
 * @scope    public instance method
 * @param    inItem    An item to be displayed. 
 * @return   A string containing the XHTML to display the item.
 */
orp.plugins.DetailWithAttributionView.prototype.createTableForItem = function (inItem) {
  orp.lang.assert(inItem instanceof orp.model.Item);
  
  var attributeCalledName = this.getWorld().getAttributeCalledName();
  
  var itemTable = orp.view.View.appendNewElement(this.getHtmlElement(),"table", orp.view.SectionView.cssClass.SIMPLE_TABLE);

  var tableRow = orp.view.View.appendNewElement(itemTable, "tr");
  orp.view.View.appendNewElement(tableRow, "td", orp.view.SectionView.cssClass.TITLE, null, "Attribute");
  orp.view.View.appendNewElement(tableRow, "td", orp.view.SectionView.cssClass.TITLE, null, "Value");
  orp.view.View.appendNewElement(tableRow, "td", orp.view.SectionView.cssClass.TITLE, null, "Creator");
  orp.view.View.appendNewElement(tableRow, "td", orp.view.SectionView.cssClass.TITLE, null, "Timestamp");
  
  this.createRowForAttribute(inItem, attributeCalledName, itemTable);
  
  var listOfAttributes = inItem.getAttributes();
  for (var key in listOfAttributes) { 
    var attribute = listOfAttributes[key];
    if (attribute != attributeCalledName) {
      this.createRowForAttribute(inItem, attribute, itemTable);
    }
  }

  var tableRow = orp.view.View.appendNewElement(itemTable, "tr");
  orp.view.View.appendNewElement(tableRow, "td", null, {colspan: "2"}, "<this item>");
  orp.view.View.appendNewElement(tableRow, "td", orp.view.SectionView.cssClass.TITLE, null, inItem.getUserstamp().getDisplayString());
  orp.view.View.appendNewElement(tableRow, "td", orp.view.SectionView.cssClass.TITLE, null, inItem.getCreationDate().toLocaleString());
};

orp.plugins.DetailWithAttributionView.prototype.createRowForAttribute = function (item, attribute, htmlTableElement, cssClass) {
  var tableRow = orp.view.View.appendNewElement(htmlTableElement, "tr");
  var cssLine = orp.view.SectionView.cssClass.LABEL + " " + orp.view.SectionView.cssClass.PLAIN;
  var listOfEntries = item.getEntriesForAttribute(attribute);
  var i;

  var columnOneCell = orp.view.View.appendNewElement(tableRow, "td", cssLine, null, attribute.getDisplayName());
  var columnTwoCell = orp.view.View.appendNewElement(tableRow, "td", cssClass, null);
  for (i in listOfEntries) {
    var entry = listOfEntries[i];
    orp.view.View.appendNewTextNode(columnTwoCell, entry.getDisplayString());
    orp.view.View.appendNewElement(columnTwoCell, "br");
  }
  var columnThreeCell = orp.view.View.appendNewElement(tableRow, "td", cssClass, null);
  for (i in listOfEntries) {
    var entry = listOfEntries[i];
    orp.view.View.appendNewTextNode(columnThreeCell, entry.getUserstamp().getDisplayString());
    orp.view.View.appendNewElement(columnThreeCell, "br");
  }
  var columnFourCell = orp.view.View.appendNewElement(tableRow, "td", cssClass, null);
  for (i in listOfEntries) {
    var entry = listOfEntries[i];
    orp.view.View.appendNewTextNode(columnFourCell, entry.getCreationDate().toLocaleString());
    orp.view.View.appendNewElement(columnFourCell, "br");
  }
};

// End of file

