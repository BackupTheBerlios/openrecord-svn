/*****************************************************************************
 page_view.js
 
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
//   util.js
//   section_view.js
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// PageView public class constants
// -------------------------------------------------------------------
PageView.ELEMENT_ID_SECTION_DIV_PREFIX = "section_view_";
PageView.ELEMENT_ID_SECTION_DIV_MIDFIX = "_in_page_";
PageView.ELEMENT_ID_SUMMARY_VIEW_DIV_PREFIX = "_summary_view_for_page_";

PageView.ELEMENT_CLASS_EDIT_MODE = "editmode";
PageView.ELEMENT_CLASS_VIEW_MODE = "viewmode";


/**
 * The RootView uses an instance of a PageView to display a Page in the
 * browser window.
 *
 * @scope    public instance constructor
 * @extends  View
 * @param    inRootView    The RootView that this PageView is nested in. 
 * @param    inDivElement    The HTMLDivElement to display the HTML in. 
 * @param    inPage    The page item to be displayed by this view. 
 */
PageView.prototype = new View();  // makes PageView be a subclass of View
function PageView(inRootView, inDivElement, inPage) {
  Util.assert(inRootView instanceof RootView);
  Util.assert(inDivElement instanceof HTMLDivElement);
  Util.assert(inPage instanceof Item);

  // instance properties
  this.setSuperview(inRootView);
  this.setDivElement(inDivElement);
  this.myPage = inPage;
  this._myHasEverBeenDisplayedFlag = false;
  
  this._myPageSummaryView = null;
  this.myListOfSectionViews = [];
  
}


/**
 * Returns a string that gives the name of the page.
 *
 * @scope    public instance method
 * @return   A string that gives the name of the page.
 */
PageView.prototype.getPageTitle = function () {
  return this.myPage.getShortName();
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
    this.getDivElement().className = (this.isInEditMode()) ? PageView.ELEMENT_CLASS_EDIT_MODE : PageView.ELEMENT_CLASS_VIEW_MODE;
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
  Util.assert(this.getDivElement() instanceof HTMLDivElement);
  
  var pageDivElement = this.getDivElement();
  pageDivElement.className = (this.isInEditMode()) ? PageView.ELEMENT_CLASS_EDIT_MODE : PageView.ELEMENT_CLASS_VIEW_MODE;
  
  var headerElement = window.document.createElement("h1"); 
  headerElement.innerHTML = this.myPage.getDisplayName();
  pageDivElement.appendChild(headerElement);

  var summaryViewDivElement = window.document.createElement("div"); 
  pageDivElement.appendChild(summaryViewDivElement);
  this._myPageSummaryView = new MultiLineTextView(this, summaryViewDivElement, this.myPage, Stevedore.UUID_FOR_ATTRIBUTE_SUMMARY, SectionView.ELEMENT_CLASS_TEXT_VIEW);

  // add <div> elements for each of the sections on the page
  // and create a new SectionView for each section
  var listOfSections = this.myPage.getValueListFromAttribute(Stevedore.UUID_FOR_ATTRIBUTE_SECTION);
  var sectionNumber = 0;
  for (var key in listOfSections) {
    var section = listOfSections[key];
    var sectionViewDivElement = window.document.createElement("div");
    pageDivElement.appendChild(sectionViewDivElement);
    var sectionView = new SectionView(this, sectionViewDivElement, section, sectionNumber);
    sectionNumber += 1;
    this.myListOfSectionViews.push(sectionView);
  }
  this._myHasEverBeenDisplayedFlag = true;
  this.refresh();
    
/*  
  var listOfStrings = [];
  var hashTableOfSectionViewsKeyedByDivId = {};

  // add an <h1> heading with the name of the page
  listOfStrings.push("<h1>" + this.myPage.getDisplayName() + "</h1>");

  var summaryViewDivId = PageView.ELEMENT_ID_SUMMARY_VIEW_DIV_PREFIX + this.myPage.getUuid();
  listOfStrings.push("<div id=\"" + summaryViewDivId + "\"></div>");
  
  // add <div> elements for each of the sections on the page
  for (var jKey in this.myListOfSectionViews) {
    var sectionView = this.myListOfSectionViews[jKey];
    var sectionViewDivId = PageView.ELEMENT_ID_SECTION_DIV_PREFIX + sectionView.mySectionNumber + PageView.ELEMENT_ID_SECTION_DIV_MIDFIX + this.myPage.getUuid();
    hashTableOfSectionViewsKeyedByDivId[sectionViewDivId] = sectionView;
    listOfStrings.push("<div id=\"" + sectionViewDivId + "\"></div>");
  }

  // write out all the new content 
  var finalString = listOfStrings.join("");
  var divElement = this.getDivElement();
  divElement.className = (this.isInEditMode()) ? PageView.ELEMENT_CLASS_EDIT_MODE : PageView.ELEMENT_CLASS_VIEW_MODE;
  divElement.innerHTML = finalString;
  this.includeOnScreen(true);

  // set up the summary text view
  var summaryElement = document.getElementById(summaryViewDivId);
  new MultiLineTextView(this, this.myPage, Stevedore.UUID_FOR_ATTRIBUTE_SUMMARY, summaryElement, SectionView.ELEMENT_CLASS_TEXT_VIEW);

  // let each of the sectionViews add their own content
  for (var divId in hashTableOfSectionViewsKeyedByDivId) {
    var aSectionView = hashTableOfSectionViewsKeyedByDivId[divId];
    var sectionDivElement = document.getElementById(divId);
    aSectionView.setDivElement(sectionDivElement);
  }
*/  
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
