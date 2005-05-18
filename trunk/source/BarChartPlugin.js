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
// Dependencies:
//   World.js
//   SectionView.js
//   PageView.js
//   Util.js
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Register this plugin in the SectionView registry
// -------------------------------------------------------------------
SectionView.ourHashTableOfPluginClassesKeyedByPluginName[SectionView.PLUGIN_BAR_CHART] = BarChartPlugin;


/**
 * A BarChartPlugin displays a set of content items for a SectionView. 
 *
 * @scope    public instance constructor
 * @extends  View
 * @param    inSectionView    The SectionView that serves as the superview for this view. 
 * @param    inHTMLElement    The HTMLElement to display this view in. 
 * @syntax   var barChart = new BarChartPlugin()
 */
BarChartPlugin.prototype = new View();  // makes BarChartPlugin be a subclass of View
function BarChartPlugin(inSectionView, inHTMLElement) {
  this.setSuperview(inSectionView);
  this.setHTMLElement(inHTMLElement);
}


/**
 * Returns the registered name of this plugin.
 *
 * @scope    public instance method
 * @return   A string.
 */
BarChartPlugin.prototype.getPluginName = function () {
  return SectionView.PLUGIN_BAR_CHART;
};


/**
 * Re-creates all the HTML for the BarChartPlugin, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    public instance method
 */
BarChartPlugin.prototype.refresh = function () {
  var listOfStrings = [];

  var contentItem = null;
  var attribute = null;
  var listOfEntries;
  var firstEntry;
  var attributeKey;
  var hashTableOfNumericValueIncidenceKeyedByAttributeKey = {};
  var hashTableOfAttributesKeyedByAttributeKey = {};
  
  // for each attribute, count the number of items where that attribute has a numeric value
  // PENDING: how do we know our superview responds to getListOfContentItems()? 
  var listOfContentItems = this.getSuperview().getListOfContentItems();
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
          var value = firstEntry.getValue();
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
  listOfStrings.push("<table class=\"" + SectionView.ELEMENT_CLASS_SIMPLE_TABLE + "\">");
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
    listOfStrings.push("<td class=\"" + SectionView.ELEMENT_CLASS_PLAIN + "\">" + contentItem.getDisplayName("{no name}") + "</td>");
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
  this.getHTMLElement().innerHTML = finalString;
};


/**
 * Does final clean-up.
 *
 * @scope    public instance method
 */
BarChartPlugin.prototype.endOfLife = function () {
  this.getHTMLElement().innerHTML = "";
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
