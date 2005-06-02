/*****************************************************************************
 PageView.js
 
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
//   Util.js
//   SectionView.js
//   TextView.js
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// PageView public class constants
// -------------------------------------------------------------------
PageView.ELEMENT_ID_SECTION_DIV_PREFIX = "section_view_";
PageView.ELEMENT_ID_SECTION_DIV_MIDFIX = "_in_page_";
PageView.ELEMENT_ID_SUMMARY_VIEW_DIV_PREFIX = "_summary_view_for_page_";

//PageView.UUID_FOR_ATTRIBUTE_SECTION = 108;
PageView.UUID_FOR_ATTRIBUTE_SECTION = "00000300-ce7f-11d9-8cd5-0011113ae5d6";


/**
 * The RootView uses an instance of a PageView to display a Page in the
 * browser window.
 *
 * @scope    public instance constructor
 * @extends  View
 * @param    inRootView    The RootView that this PageView is nested in. 
 * @param    inHTMLElement The HTMLElement to display the HTML in. 
 * @param    inPage        The page item to be displayed by this view. 
 */
PageView.prototype = new View();  // makes PageView be a subclass of View
function PageView(inRootView, inHTMLElement, inPage) {
  Util.assert(inRootView instanceof RootView);
  Util.assert(inHTMLElement instanceof HTMLElement);
  Util.assert(inPage instanceof Item);

  // instance properties
  this.setSuperview(inRootView);
  this.setHTMLElement(inHTMLElement);
  this.myPage = inPage;
  
  this._myPageSummaryView = null;
  this._myHeaderText = null;
  this.myListOfSectionViews = [];
}


/**
 * Returns a string that gives the name of the page.
 *
 * @scope    public instance method
 * @return   A string that gives the name of the page.
 */
PageView.prototype.getPageTitle = function () {
  var attributeCalledShortName = this.getWorld().getAttributeCalledShortName();
  var pageTitle = this.myPage.getSingleStringValueFromAttribute(attributeCalledShortName);
  if (!pageTitle) {
    pageTitle = this.myPage.getDisplayName();
  }
  return pageTitle;
};

  
/**
 * Updates the HTML elements in this view to reflect any changes in 
 * the data, and tells the sub-views to refresh themselves too.
 *
 * @scope    public instance method
 */
PageView.prototype.refresh = function () {
  if (!this._myHasEverBeenDisplayedFlag) {
    this.doInitialDisplay();
  } else {
    this._myHeaderText.refresh();
    this._myPageSummaryView.refresh();
    for (var key in this.myListOfSectionViews) {
      var sectionView = this.myListOfSectionViews[key];      
      sectionView.refresh();
    }
  }
};


/**
 * Re-creates all the HTML for the PageView, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    public instance method
 */
PageView.prototype.doInitialDisplay = function () {
  Util.assert(this.getHTMLElement() instanceof HTMLElement);
  
  var attributeCalledName = this.getWorld().getAttributeCalledName();
  var attributeCalledSummary = this.getWorld().getAttributeCalledSummary();

  var pageDivElement = this.getHTMLElement();
  
  var headerElement = View.createAndAppendElement(pageDivElement, "h1");
  this._myHeaderText = new TextView(this, headerElement, this.myPage, attributeCalledName,
    this.myPage.getSingleEntryFromAttribute(attributeCalledName), SectionView.ELEMENT_CLASS_TEXT_VIEW, true);

  var summaryViewDiv = View.createAndAppendElement(pageDivElement, "div");
  this._myPageSummaryView = new TextView(this, summaryViewDiv, this.myPage, attributeCalledSummary,
    this.myPage.getSingleEntryFromAttribute(attributeCalledSummary), SectionView.ELEMENT_CLASS_TEXT_VIEW, true);

  // add <div> elements for each of the sections on the page
  // and create a new SectionView for each section
  var attributeCalledSection = this.getWorld().getItemFromUuid(PageView.UUID_FOR_ATTRIBUTE_SECTION);
  var listOfEntriesForSections = this.myPage.getEntriesForAttribute(attributeCalledSection);
  var sectionNumber = 0;
  for (var key in listOfEntriesForSections) {
    var entryForSection = listOfEntriesForSections[key];
    var section = entryForSection.getValue();
    var sectionViewDiv = View.createAndAppendElement(pageDivElement, "div");
    var sectionView = new SectionView(this, sectionViewDiv, section, sectionNumber);
    sectionNumber += 1;
    this.myListOfSectionViews.push(sectionView);
  }
  this._myHasEverBeenDisplayedFlag = true;
  this.refresh();
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
