/*****************************************************************************
 detail_layout.js
 
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
//   util.js
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Register this layout type in the SectionView registry
// -------------------------------------------------------------------
SectionView.ourHashTableOfLayoutClassesKeyedByLayoutName[SectionView.LAYOUT_DETAIL] = DetailLayout;


// -------------------------------------------------------------------
// new DetailLayout()
//   public instance constructor
// -------------------------------------------------------------------
function DetailLayout(inSuperView) {
  Util.assert((inSuperView instanceof SectionView) || (inSuperView instanceof ItemView));
  
  this.mySuperView = inSuperView;
  this.myDivElement = null;
}


// -------------------------------------------------------------------
// detailLayout.getLayoutName()
//   public instance method
// -------------------------------------------------------------------
DetailLayout.prototype.getLayoutName = function () {
  return SectionView.LAYOUT_DETAIL;
};

  
// -------------------------------------------------------------------
// detailLayout.setDivElement()
//   public instance method
// -------------------------------------------------------------------
DetailLayout.prototype.setDivElement = function (inDivElement) {
  Util.assert(inDivElement instanceof HTMLDivElement);
  
  this.myDivElement = inDivElement;
  this.display();
};


// -------------------------------------------------------------------
// detailLayout.display()
//   public method
// -------------------------------------------------------------------
DetailLayout.prototype.display = function () {
  var listOfStrings = [];

  // for each content item, add its HTML representation to the output
  var listOfContentItems = this.mySuperView.getListOfContentItems();
  for (var contentItemKey in listOfContentItems) {
    var contentItem = listOfContentItems[contentItemKey];
    listOfStrings.push(this.getXhtmlTableForItem(contentItem));
    listOfStrings.push("<p>&nbsp;</p>");
  }

  // take all the HTML and put it together
  var finalString = listOfStrings.join("");
  this.myDivElement.innerHTML = finalString;
};


// -------------------------------------------------------------------
// detailLayout.getXhtmlTableForItem()
//   public instance method
// -------------------------------------------------------------------
DetailLayout.prototype.getXhtmlTableForItem = function (inItem) {
  Util.assert(inItem instanceof Item);
  
  var listOfStrings = [];
  var stevedore = this.mySuperView.getStevedore();
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
