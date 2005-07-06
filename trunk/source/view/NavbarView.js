/*****************************************************************************
 NavbarView.js

******************************************************************************
 Written in 2005 by 
    Brian Douglas Skinner <brian.skinner@gumption.org>
    Mignon Belongie

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
/*global window */
/*global RootView */
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// NavbarView public class constants
// -------------------------------------------------------------------
NavbarView.CSS_CLASS_MENU      = "menu";
NavbarView.CSS_CLASS_MENU_ITEM = "menu_item";


/**
 * The RootView uses an instance of a NavbarView to display a navigation
 * bar, with links to pages.
 *
 * @scope    public instance constructor
 * @extends  View
 * @param    superview    The view that serves as the superview for this view. 
 * @param    htmlElement    The HTMLElement to display the HTML in. 
 */
NavbarView.prototype = new View();  // makes NavbarView be a subclass of View
function NavbarView(superview, htmlElement, htmlElementForAnchors) {
  View.call(this, superview, htmlElement, "NavbarView");
  this._htmlElementForAnchors = htmlElementForAnchors;
}


/**
 * Re-creates all the HTML for the view, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    public instance method
 */
NavbarView.prototype.refresh = function() {
  if (!this.hasEverBeenDisplayed()) {
    this._rebuildView();
    this._myHasEverBeenDisplayedFlag = true;
  }
};


// -------------------------------------------------------------------
// Private instance methods
// -------------------------------------------------------------------

/**
 * Re-creates the HTML for the view, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    private instance method
 */
NavbarView.prototype._rebuildView = function() {
  var categoryCalledPage = this.getWorld().getItemFromUuid(RootView.UUID_FOR_CATEGORY_PAGE);
  categoryCalledPage.addObserver(this);
  var listOfPages = this.getWorld().getItemsInCategory(categoryCalledPage);
  var key;
  var page;

  View.removeChildrenOfElement(this._htmlElementForAnchors);
  for (key in listOfPages) {
    page = listOfPages[key];
    var anchorName = RootView.URL_PAGE_PREFIX + page._getUuid();
    View.appendNewElement(this._htmlElementForAnchors, "a", null, {name: anchorName});
    // anchor.setAttribute("name", RootView.URL_PAGE_PREFIX + page._getUuid());
  }
  
  var divElement = this.getHtmlElement();
  View.removeChildrenOfElement(divElement); 
  var ulElement = View.appendNewElement(divElement, "ul", NavbarView.CSS_CLASS_MENU);
  var rootView = this.getRootView();
  for (key in listOfPages) {
    page = listOfPages[key];
    page.addObserver(this);
    var liElement = View.appendNewElement(ulElement, "li", NavbarView.CSS_CLASS_MENU_ITEM);
    var menuUrl = rootView.getUrlForItem(page);
    var menuText = page.getDisplayString();
    var anchorElement = View.appendNewElement(liElement, "a", null, {href: menuUrl}, menuText);
    // anchorElement.setAttribute("href", menuUrl);
    // View.appendNewTextNode(anchorElement, menuText);
    anchorElement.onclick = RootView.clickOnLocalLink.bindAsEventListener();
  }
  
  var newPageButton = View.appendNewElement(divElement, "input", RootView.CSS_CLASS_EDIT_TOOL);
  newPageButton.type = "button";
  newPageButton.value = "New Page";
  newPageButton.onclick = this._clickOnNewPageButton.bindAsEventListener(this);
};


// -------------------------------------------------------------------
// Event handler methods
// -------------------------------------------------------------------

/**
 * Called when the user clicks on the "New Page" button.
 *
 * @scope    private instance method
 */
NavbarView.prototype._clickOnNewPageButton = function(eventObject) {
  var rootView = this.getRootView();
  var newPage = rootView.newPage();
  window.location = rootView.getUrlForItem(newPage);
  rootView.setCurrentContentViewFromUrl();
};


// -------------------------------------------------------------------
// Observer methods
// -------------------------------------------------------------------

/**
 * Called after there's been some change to one of the pages displayed
 * in the Navbar.
 *
 * @scope    public instance method
 */
NavbarView.prototype.observedItemHasChanged = function(item, listOfRecordsForItem) {
  // alert("Navbar observed: " + item.getDisplayString());
  this._rebuildView();
};

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
