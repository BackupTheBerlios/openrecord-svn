/*****************************************************************************
 bar_chart_layout.js
 
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
//   repository.js
//   section_view.js
//   page_view.js
//   util.js
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Register this layout type in the SectionView registry
// -------------------------------------------------------------------
SectionView.ourHashTableOfLayoutClassesKeyedByLayoutName[SectionView.LAYOUT_BAR_CHART] = BarChartLayout;


/**
 * A BarChartLayout displays a set of content items for a SectionView. 
 *
 * @scope    public instance constructor
 * @param    inSectionView    The SectionView that serves as the superview for this view. 
 * @syntax   var barChart = new BarChartLayout()
 */
function BarChartLayout(inSectionView) {
  Util.assert(inSectionView instanceof SectionView);
  this.mySectionView = inSectionView;
  this._myDivElement = null;
}


/**
 * Returns the registered name of this type of layout.
 *
 * @scope    public instance method
 * @return   A string.
 */
BarChartLayout.prototype.getLayoutName = function () {
  return SectionView.LAYOUT_BAR_CHART;
};


/**
 * Tells the BarChartLayout what HTMLDivElement to display the bar chart in.
 *
 * @scope    public instance method
 * @param    inDivElement    The HTMLDivElement to display the bar chart in. 
 */
BarChartLayout.prototype.setDivElement = function (inDivElement) {
  Util.assert(inDivElement instanceof HTMLDivElement);
  this._myDivElement = inDivElement;
  this.display();
};


/**
 * Re-creates all the HTML for the BarChartLayout, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    public instance method
 */
BarChartLayout.prototype.display = function () {
  var listOfStrings = [];

  var contentItem = null;
  var attributeUuid = null;
  var hashTableOfNumericValueIncidenceKeyedByAttributeUuid = {};
  
  // for each attribute, count the number of items where that attribute has a numeric value
  var listOfContentItems = this.mySectionView.getListOfContentItems();
  for (var iKey in listOfContentItems) {
    contentItem = listOfContentItems[iKey];
    var listOfAttributesForItem = contentItem.getListOfAttributeUuids();
    for (var attributeKey in listOfAttributesForItem) {
      attributeUuid = listOfAttributesForItem[attributeKey];
      var valueList = contentItem.getValueListFromAttribute(attributeUuid);
      if (valueList) {
        var value = valueList[0];
        if (Util.isNumber(value)) {
          var count = hashTableOfNumericValueIncidenceKeyedByAttributeUuid[attributeUuid];
          if (!count) {
            count = 0;
          }
          count += 1;
          hashTableOfNumericValueIncidenceKeyedByAttributeUuid[attributeUuid] = count;
        }
      }
    }
  }
  
  // find the attribute for which most of the items have a numeric value 
  var maxIncidence = 0;
  var selectedAttribute = null;
  for (attributeUuid in hashTableOfNumericValueIncidenceKeyedByAttributeUuid) {
    var incidence = hashTableOfNumericValueIncidenceKeyedByAttributeUuid[attributeUuid];
    if (incidence > maxIncidence) {
      selectedAttribute = this.mySectionView.getStevedore().getItemFromUuid(attributeUuid);
      maxIncidence = incidence;
    }
  }

  // find the maximum value for the selected attribute
  if (selectedAttribute) {
    var maxValue = 0;
    for (var jkey in listOfContentItems) {
      contentItem = listOfContentItems[jkey];
      var nextValueList = contentItem.getValueListFromAttribute(selectedAttribute);
      var nextValue = nextValueList[0];
      if (Util.isNumber(nextValue)) {
        maxValue = Math.max(maxValue, nextValue);
      }     
    }
  }

  // add the table header row(s)
  listOfStrings.push("<table class=\"" + SectionView.ELEMENT_CLASS_SIMPLE_TABLE + "\">");
  listOfStrings.push("<tr>");
  var attributeCalledName = this.mySectionView.getStevedore().getItemFromUuid(Stevedore.UUID_FOR_ATTRIBUTE_NAME);
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
      var listOfValues = contentItem.getValueListFromAttribute(selectedAttribute);
      var firstValue = listOfValues[0];
      if (Util.isNumber(firstValue)) {
        numericValue = firstValue;
      }
    }
    // listOfStrings.push("<td class=\"" + SectionView.ELEMENT_CLASS_PLAIN + "\">" + displayValue + "</td>");
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
  this._myDivElement.innerHTML = finalString;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------


