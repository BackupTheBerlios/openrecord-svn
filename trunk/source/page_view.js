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
PageView.ELEMENT_ID_SUMMARY_VIEW_DIV = "summary_view";

PageView.ELEMENT_CLASS_EDIT_MODE = "editmode";
PageView.ELEMENT_CLASS_VIEW_MODE = "viewmode";


// -------------------------------------------------------------------
// PageView class properties
// -------------------------------------------------------------------
// none


/**
 * The CompleteView uses an instance of a PageView to display a Page in the
 * browser window.
 *
 * @scope    public instance constructor
 * @param    inPage    The page item to be displayed by this view. 
 * @param    inDivElement    The HTMLDivElement to display the HTML in. 
 * @param    inCompleteView    The CompleteView that this PageView is nested in. 
 */
function PageView(inPage, inDivElement, inCompleteView) {
  Util.assert(inPage instanceof Item);
  Util.assert(inDivElement instanceof HTMLDivElement);
  Util.assert(inCompleteView instanceof CompleteView);

  // instance properties
  this.myPage = inPage;
  this.myDivElement = inDivElement;
  this.myCompleteView = inCompleteView;
  
  this.myListOfSectionViews = [];
  
  var listOfSections = this.myPage.getValueListFromAttribute(Stevedore.UUID_FOR_ATTRIBUTE_SECTION);
  var sectionNumber = 0;
  for (var key in listOfSections) {
    var section = listOfSections[key];
    var sectionView = new SectionView(this, section, sectionNumber);
    sectionNumber += 1;
    this.myListOfSectionViews.push(sectionView);
  }
}


/**
 * Returns true if we are in Edit Mode.
 *
 * @scope    public instance method
 * @return   A boolean value. True if we are in Edit Mode.
 */
PageView.prototype.isInEditMode = function () {
  return this.myCompleteView.isInEditMode();
};

  
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
 * Hides the PageView by setting the div element's display style to "none".
 *
 * @scope    public instance method
 */
PageView.prototype.hide = function () {
  Util.assert(this.myDivElement instanceof HTMLDivElement);
  this.myDivElement.style.display = "none";
};


/**
 * Re-creates all the HTML for the PageView, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    public instance method
 */
PageView.prototype.display = function () {
  Util.assert(this.myDivElement instanceof HTMLDivElement);
  
  var listOfStrings = [];
  var hashTableOfSectionViewsKeyedByDivId = {};
  
  // add an <h1> heading with the name of the page
  listOfStrings.push("<h1 id=\"" + CompleteView.URL_PAGE_PREFIX + this.myPage.getUuid() + "\">" + this.myPage.getDisplayName() + "</h1>");
  
  listOfStrings.push("<div id=\"" + PageView.ELEMENT_ID_SUMMARY_VIEW_DIV + "\"></div>");
  
  // add <div> elements for each of the sections on the page
  for (var jKey in this.myListOfSectionViews) {
    var sectionView = this.myListOfSectionViews[jKey];
    var sectionViewDivId = PageView.ELEMENT_ID_SECTION_DIV_PREFIX + sectionView.mySectionNumber + PageView.ELEMENT_ID_SECTION_DIV_MIDFIX + this.myPage.getUuid();
    hashTableOfSectionViewsKeyedByDivId[sectionViewDivId] = sectionView;
    listOfStrings.push("<div id=\"" + sectionViewDivId + "\"></div>");
  }

  // write out all the new content 
  var finalString = listOfStrings.join("");
  this.myDivElement.className = (this.isInEditMode()) ? PageView.ELEMENT_CLASS_EDIT_MODE : PageView.ELEMENT_CLASS_VIEW_MODE;
  this.myDivElement.innerHTML = finalString;
  this.myDivElement.style.display = "block";

  // set up the summary text view
  var summaryElement = document.getElementById(PageView.ELEMENT_ID_SUMMARY_VIEW_DIV);
  new MultiLineTextView(this.myPage, Stevedore.UUID_FOR_ATTRIBUTE_SUMMARY, summaryElement,"text_view");

  // let each of the sectionViews add their own content
  for (var divId in hashTableOfSectionViewsKeyedByDivId) {
    var aSectionView = hashTableOfSectionViewsKeyedByDivId[divId];
    var sectionDivElement = document.getElementById(divId);
    aSectionView.setDivElement(sectionDivElement);
  }
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
