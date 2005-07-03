/*****************************************************************************
 BarChartPlugin.js
 
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
/*global SectionView  */
/*global PluginView  */
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Register this plugin in the SectionView registry
// -------------------------------------------------------------------
BarChartPlugin.UUID_FOR_PLUGIN_VIEW_BAR_CHART = "00040304-ce7f-11d9-8cd5-0011113ae5d6";
SectionView.registerPlugin(BarChartPlugin);


/**
 * A BarChartPlugin displays a set of content items for a SectionView. 
 *
 * @scope    public instance constructor
 * @extends  PluginView
 * @param    superview    The View that serves as the superview for this view. 
 * @param    htmlElement    The HTMLElement to display this view in. 
 * @param    querySpec    The Query Spec item that provides the items for this PluginView to display
 * @param    layoutItem    ???. 
 * @syntax   var barChart = new BarChartPlugin()
 */
BarChartPlugin.prototype = new PluginView();  // makes BarChartPlugin be a subclass of PluginView
function BarChartPlugin(superview, htmlElement, querySpec, layoutItem) {
  PluginView.call(this, superview, htmlElement, querySpec, layoutItem, "BarChartPlugin");
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
BarChartPlugin.getPluginItemUuid = function() {
  return BarChartPlugin.UUID_FOR_PLUGIN_VIEW_BAR_CHART;
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
BarChartPlugin.prototype.getClass = function() {
  return BarChartPlugin;
};


/**
 * Re-creates all the HTML for the BarChartPlugin, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    public instance method
 */
BarChartPlugin.prototype.refresh = function() {
  var listOfStrings = [];

  var contentItem = null;
  var attribute = null;
  var listOfEntries;
  var firstEntry;
  var attributeKey;
  var hashTableOfNumericValueIncidenceKeyedByAttributeKey = {};
  var hashTableOfAttributesKeyedByAttributeKey = {};
  
  // for each attribute, count the number of items where that attribute has a numeric value
  var listOfContentItems = this.fetchItems();
  for (var iKey in listOfContentItems) {
    contentItem = listOfContentItems[iKey];
    var listOfAttributesForItem = contentItem.getAttributes();
    for (attributeKey in listOfAttributesForItem) {
      attribute = listOfAttributesForItem[attributeKey];
      var attributeKeyString = attribute.getUniqueKeyString();
      hashTableOfAttributesKeyedByAttributeKey[attributeKeyString] = attribute;
      listOfEntries = contentItem.getEntriesForAttribute(attribute);
      if (listOfEntries) {
        firstEntry = listOfEntries[0];
        if (firstEntry) {
          var value = firstEntry.getValue(contentItem);
          if (Util.isNumber(value)) {
            var count = hashTableOfNumericValueIncidenceKeyedByAttributeKey[attributeKeyString];
            if (!count) {
              count = 0;
            }
            count += 1;
            hashTableOfNumericValueIncidenceKeyedByAttributeKey[attributeKeyString] = count;
          }
        }
      }
    }
  }
  
  // find the attribute for which most of the items have a numeric value 
  var maxIncidence = 0;
  var selectedAttribute = null;
  for (attributeKey in hashTableOfNumericValueIncidenceKeyedByAttributeKey) {
    var incidence = hashTableOfNumericValueIncidenceKeyedByAttributeKey[attributeKey];
    if (incidence > maxIncidence) {
      selectedAttribute = hashTableOfAttributesKeyedByAttributeKey[attributeKey];
      maxIncidence = incidence;
    }
  }

  // find the maximum value for the selected attribute
  if (selectedAttribute) {
    var maxValue = 0;
    for (var jkey in listOfContentItems) {
      contentItem = listOfContentItems[jkey];
      listOfEntries = contentItem.getEntriesForAttribute(selectedAttribute);
      if (listOfEntries && listOfEntries[0]) {
        var nextEntry = listOfEntries[0];
        var nextValue = nextEntry.getValue();
        if (Util.isNumber(nextValue)) {
          maxValue = Math.max(maxValue, nextValue);
        }     
      }
    }
  }

  // add the table header row(s)
  listOfStrings.push("<table class=\"" + SectionView.CSS_CLASS_SIMPLE_TABLE + "\">");
  listOfStrings.push("<tr>");
  var attributeCalledName = this.getWorld().getAttributeCalledName();
  listOfStrings.push("<th>" + attributeCalledName.getDisplayName() + "</th>");
  if (selectedAttribute) {
    listOfStrings.push("<th>" + selectedAttribute.getDisplayName() + "</th>");
  } else {
    listOfStrings.push("<th>" + "Sorry, there are no attributes with numeric values to chart" + "</th>");
  }
  listOfStrings.push("</tr>");
    
  // add all the table body rows
  for (var kKey in listOfContentItems) {
    contentItem = listOfContentItems[kKey];
    listOfStrings.push("<tr>");
    listOfStrings.push("<td class=\"" + SectionView.CSS_CLASS_PLAIN + "\">" + contentItem.getDisplayName("{no name}") + "</td>");
    var numericValue = 0;
    if (selectedAttribute) {
      listOfEntries = contentItem.getEntriesForAttribute(selectedAttribute);
      if (listOfEntries && listOfEntries[0]) {
        firstEntry = listOfEntries[0];
        var firstValue = firstEntry.getValue();
        if (Util.isNumber(firstValue)) {
          numericValue = firstValue;
        }
      }
    }
    var width = 0;
    if (maxValue > 0) {
      width = (numericValue / maxValue) * 100; // 100 Percent
    }
    listOfStrings.push("<td class=\"bar_chart_frame\"><input disabled type=\"text\" class=\"bar_chart_bar\" value=\"" + numericValue + "\" size=\"1\" style=\"width: " + width + "%;\"></input></td>");
    listOfStrings.push("</tr>");
  }  
  listOfStrings.push("</table>");
    
  // return all the new content   
  var finalString = listOfStrings.join("");
  this.getHtmlElement().innerHTML = finalString;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
