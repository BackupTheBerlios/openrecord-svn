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
// Dependencies, expressed in the syntax that JSLint understands:
// 
/*global Util  */
/*global Item  */
/*global SectionView  */
/*global PluginView  */
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Register this plugin in the SectionView registry
// -------------------------------------------------------------------
DetailPlugin.UUID_FOR_PLUGIN_VIEW_DETAIL = "00040303-ce7f-11d9-8cd5-0011113ae5d6";
SectionView.registerPlugin(DetailPlugin);


/**
 * A DetailPlugin display one or more content items. 
 *
 * @scope    public instance constructor
 * @extends  View
 * @param    inSuperView    The superview for this view. 
 * @param    inHTMLElement    The HTMLElement to display this view in. 
 * @syntax   var detailPlugin = new DetailPlugin()
 */
DetailPlugin.prototype = new PluginView();  // makes DetailPlugin be a subclass of View
function DetailPlugin(inSuperView, inHTMLElement, inQuery, inLayout) {
  PluginView.call(this, inSuperView, inHTMLElement, inQuery, inLayout);
}


// -------------------------------------------------------------------
// Public class methods
// -------------------------------------------------------------------

/**
 * Returns the UUID of the item that represents this class of plugin.
 *
 * @scope    public class method
 * @return   The UUID of the item that represents this class of plugin
 */
DetailPlugin.getPluginItemUuid = function () {
  return DetailPlugin.UUID_FOR_PLUGIN_VIEW_DETAIL;
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
DetailPlugin.prototype.getClass = function () {
  return DetailPlugin;
};


/**
 * Re-creates all the HTML for the DetailPlugin, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    public instance method
 */
DetailPlugin.prototype.refresh = function () {
  var listOfStrings = [];

  // for each content item, add its HTML representation to the output
  var listOfContentItems = this.fetchItems();
  for (var contentItemKey in listOfContentItems) {
    var contentItem = listOfContentItems[contentItemKey];
    listOfStrings.push(this.getXhtmlTableForItem(contentItem));
    listOfStrings.push("<p>&nbsp;</p>");
  }

  // take all the HTML and put it together
  var finalString = listOfStrings.join("");
  this.getHTMLElement().innerHTML = finalString;
};


/**
 * Given an item to be display, returns a string with XHTML to display
 * the item.
 *
 * @scope    public instance method
 * @param    inItem    An item to be displayed. 
 * @return   A string containing the XHTML to display the item.
 */
DetailPlugin.prototype.getXhtmlTableForItem = function (inItem) {
  Util.assert(inItem instanceof Item);
  
  var listOfStrings = [];
  var attributeCalledName = this.getWorld().getAttributeCalledName();
  
  listOfStrings.push("<table class=\"" + SectionView.CSS_CLASS_SIMPLE_TABLE + "\">");
  listOfStrings.push("<tr>");
  listOfStrings.push("<td class=\"" + SectionView.CSS_CLASS_LABEL + " " + SectionView.CSS_CLASS_TITLE + "\">" + attributeCalledName.getDisplayName() + "</td>");
  listOfStrings.push("<td class=\"" + SectionView.CSS_CLASS_TITLE + "\">" + inItem.getDisplayName() + "</td>");
  listOfStrings.push("</tr>");
  var listOfAttributes = inItem.getAttributes();
  for (var key in listOfAttributes) { 
    var attribute = listOfAttributes[key];
    if (attribute != attributeCalledName) {
      listOfStrings.push("<tr>");
      listOfStrings.push("<td class=\"" + SectionView.CSS_CLASS_LABEL + "\">" + attribute.getDisplayName() + "</td>");
      var listOfEntries = inItem.getEntriesForAttribute(attribute); 
      listOfStrings.push("<td class=\"" + SectionView.CSS_CLASS_PLAIN + "\">");
      for (var j = 0; j < listOfEntries.length; ++j) {
        listOfStrings.push(listOfEntries[j].getDisplayString() + "<br/>");
      }
      listOfStrings.push("</td>");
      listOfStrings.push("</tr>");
    }
  }
  listOfStrings.push("</table>");

  // return all the new content
  var finalString = listOfStrings.join("");
  return finalString;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
