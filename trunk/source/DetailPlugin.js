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
// Dependencies:
//   Stevedore.js
//   SectionView.js
//   Util.js
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Register this plugin in the SectionView registry
// -------------------------------------------------------------------
SectionView.ourHashTableOfPluginClassesKeyedByPluginName[SectionView.PLUGIN_DETAIL] = DetailPlugin;


/**
 * A DetailPlugin display one or more content items. 
 *
 * @scope    public instance constructor
 * @extends  View
 * @param    inSuperView    The superview for this view. 
 * @param    inDivElement    The HTMLDivElement to display this view in. 
 * @syntax   var detailPlugin = new DetailPlugin()
 */
DetailPlugin.prototype = new View();  // makes DetailPlugin be a subclass of View
function DetailPlugin(inSuperView, inDivElement) {
  this.setSuperview(inSuperView);
  this.setDivElement(inDivElement);  
}


/**
 * Returns the registered name of this plugin.
 *
 * @scope    public instance method
 * @return   A string.
 */
DetailPlugin.prototype.getPluginName = function () {
  return SectionView.PLUGIN_DETAIL;
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
  // PENDING: how do we know our superview responds to getListOfContentItems()? 
  var listOfContentItems = this.getSuperview().getListOfContentItems();
  for (var contentItemKey in listOfContentItems) {
    var contentItem = listOfContentItems[contentItemKey];
    listOfStrings.push(this.getXhtmlTableForItem(contentItem));
    listOfStrings.push("<p>&nbsp;</p>");
  }

  // take all the HTML and put it together
  var finalString = listOfStrings.join("");
  this.getDivElement().innerHTML = finalString;
};


/**
 * Does final clean-up.
 *
 * @scope    public instance method
 */
DetailPlugin.prototype.endOfLife = function () {
  this.getDivElement().innerHTML = "";
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
  var stevedore = this.getStevedore();
  var attributeCalledName = stevedore.getItemFromUuid(Stevedore.UUID_FOR_ATTRIBUTE_NAME);
  
  listOfStrings.push("<table class=\"" + SectionView.ELEMENT_CLASS_SIMPLE_TABLE + "\">");
  listOfStrings.push("<tr>");
  listOfStrings.push("<td class=\"" + SectionView.ELEMENT_CLASS_LABEL + " " + SectionView.ELEMENT_CLASS_TITLE + "\">" + attributeCalledName.getDisplayName() + "</td>");
  listOfStrings.push("<td class=\"" + SectionView.ELEMENT_CLASS_TITLE + "\">" + inItem.getDisplayName() + "</td>");
  listOfStrings.push("</tr>");
  var listOfAttributeUuids = inItem.getListOfAttributeUuids();
  for (var key in listOfAttributeUuids) { 
    var attributeUuid = listOfAttributeUuids[key];
    if (attributeUuid != attributeCalledName.getUuid()) {
      listOfStrings.push("<tr>");
      var attribute = stevedore.getItemFromUuid(attributeUuid);
      listOfStrings.push("<td class=\"" + SectionView.ELEMENT_CLASS_LABEL + "\">" + attribute.getDisplayName() + "</td>");
      var valueList = inItem.getValueListFromAttribute(attributeUuid); 
      listOfStrings.push("<td class=\"" + SectionView.ELEMENT_CLASS_PLAIN + "\">");
      for (var j = 0; j < valueList.length; ++j) {
        listOfStrings.push(SectionView.getStringForValue(valueList[j]) + "<br/>");
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
