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
 * A DetailPlugin display one or more content items. 
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
};

dj_inherits(orp.DetailPlugin, orp.view.PluginView);  // makes DetailPlugin be a subclass of PluginView


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
  // for each content item, create a table for it
  var listOfContentItems = this.fetchItems();
  for (var contentItemKey in listOfContentItems) {
    var contentItem = listOfContentItems[contentItemKey];
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
orp.DetailPlugin.prototype.createTableForItem = function (inItem) {
  orp.lang.assert(inItem instanceof orp.model.Item);
  
  var attributeCalledName = this.getWorld().getAttributeCalledName();
  
  var itemTable = orp.view.View.appendNewElement(this.getHtmlElement(),"table", orp.view.SectionView.cssClass.SIMPLE_TABLE);
  var headerRow = orp.view.View.appendNewElement(itemTable,"tr");
  orp.view.View.appendNewElement(headerRow,"td", orp.view.SectionView.cssClass.LABEL + " " + orp.view.SectionView.cssClass.TITLE,null,attributeCalledName.getDisplayName());
  var aCell = orp.view.View.appendNewElement(headerRow,"td", orp.view.SectionView.cssClass.TITLE, null, inItem.getDisplayName());
  var multiEntriesView = new orp.view.MultiEntriesView(this, aCell, inItem, attributeCalledName);
  multiEntriesView.refresh();
  var listOfAttributes = inItem.getAttributes();
  for (var key in listOfAttributes) { 
    var attribute = listOfAttributes[key];
    if (attribute != attributeCalledName) {
      var itemRow = orp.view.View.appendNewElement(itemTable,"tr");
      orp.view.View.appendNewElement(itemRow,"td", orp.view.SectionView.cssClass.LABEL,null,attribute.getDisplayName());
      aCell = orp.view.View.appendNewElement(itemRow,"td", orp.view.SectionView.cssClass.PLAIN);
      multiEntriesView = new orp.view.MultiEntriesView(this, aCell, inItem, attribute);
      multiEntriesView.refresh();
    }
  }
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
