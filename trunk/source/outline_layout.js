/*****************************************************************************
 outline_layout.js
 
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
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Register this layout type in the SectionView registry
// -------------------------------------------------------------------
SectionView.ourHashTableOfLayoutClassesKeyedByLayoutName[SectionView.LAYOUT_OUTLINE] = OutlineLayout;


// -------------------------------------------------------------------
// new OutlineLayout()
//   public instance constructor
// -------------------------------------------------------------------
function OutlineLayout(inSectionView) {
  Util.assert(inSectionView instanceof SectionView);

  this.mySectionView = inSectionView;
  this.myDivElement = null;
}


// -------------------------------------------------------------------
// outlineLayout.getLayoutName()
//   public instance method
// -------------------------------------------------------------------
OutlineLayout.prototype.getLayoutName = function () {
  return SectionView.LAYOUT_OUTLINE;
};

  
// -------------------------------------------------------------------
// outlineLayout.setDivElement()
//   public instance method
// -------------------------------------------------------------------
OutlineLayout.prototype.setDivElement = function (inDivElement) {
  Util.assert(inDivElement instanceof HTMLDivElement);

  this.myDivElement = inDivElement;
  this.display();
};


// -------------------------------------------------------------------
// outlineLayout.display()
//   public method
// -------------------------------------------------------------------
OutlineLayout.prototype.display = function () {
  var listOfStrings = [];

  var listOfContentItems = this.mySectionView.getListOfContentItems();
  listOfStrings.push("<ul>");
  // for each content item, add its HTML representation to the output
  for (var contentItemKey in listOfContentItems) {
    var contentItem = listOfContentItems[contentItemKey];
    listOfStrings.push("<li>");
    listOfStrings.push(contentItem.getDisplayName("{no name}"));
    // FIX_ME: Why do I have to provide an onclick handler to get these links to work?
    listOfStrings.push(" " + "<a class=\"" + SectionView.ELEMENT_CLASS_MORE_LINK + "\" href=\"" + CompleteView.URL_HASH_ITEM_PREFIX + contentItem.getUuid() + "\" onclick=\"CompleteView.clickOnLocalLink(event)\">(more &#8658;)</a>" + "");
    listOfStrings.push("</li>");
  }
  listOfStrings.push("</ul>");

  // take all the HTML and put it together
  var finalString = listOfStrings.join("");
  this.myDivElement.innerHTML = finalString;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
