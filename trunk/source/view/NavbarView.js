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
/*global Sortable */
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// NavbarView public class constants
// -------------------------------------------------------------------
NavbarView.CSS_CLASS_MENU      = "menu";
NavbarView.CSS_CLASS_MENU_ITEM = "menu_item";

// Caution: 
// In order for us to use the "Sortable" feature in the script.aculo.us 
// dragdrop.js library, this Id must *not* have an underscore in it.
NavbarView.ELEMENT_ID_MENU     = "MainMenu";  


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
  this._liElementBeingTouched = null;
  this._builtForEditMode = false;
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
  } else {
    if (this._builtForEditMode != this.isInEditMode()) {
      this._rebuildView();
    }
  }
};


// -------------------------------------------------------------------
// Private instance methods
// -------------------------------------------------------------------

/**
 * Called whenever there is a mousedown event on one of the menu item
 * html "li" elements.  All we do here is record which element is 
 * being touched, because we may need that info later on in the 
 * _sortOrderUpdate() method. 
 *
 * @scope    public instance method
 * @param    event    The mousedown event object. 
 * @param    liElement    The HTMLElement for this menu item. 
 */
NavbarView.prototype._mouseDownOnMenuItem = function(event, liElement) {
  this._liElementBeingTouched = liElement;
};


/**
 * Called by the "Sortable" feature in the script.aculo.us dragdrop.js library.
 * This method gets called when the user drags and drops a menu item in the
 * Navbar.  We only get called if the new location of the menu item is 
 * different from the old location.
 *
 * @scope    public instance method
 * @param    ulElement    The "ul" HTMLElement for the menu of menu items. 
 */
NavbarView.prototype._sortOrderUpdate = function(ulElement) {
  Util.assert(this._liElementBeingTouched !== null);
  
  var liElementPrefixString = NavbarView.ELEMENT_ID_MENU + '_';
  var menuItemElementId = this._liElementBeingTouched.id;
  var pageUuid = menuItemElementId.replace(liElementPrefixString, '');
  var pageToReorder = this.getWorld().getItemFromUuid(pageUuid);
  
  var listOfPages = this._getNewOrderingForPageList(ulElement);
  
  var arrayIndex = Util.getArrayIndex(listOfPages, pageToReorder);
  Util.assert(arrayIndex != -1);
  var pageAbove = (arrayIndex === 0) ? null : listOfPages[arrayIndex-1];
  var pageBelow = (arrayIndex > listOfPages.length) ? null : listOfPages[arrayIndex+1];
  pageToReorder.reorderBetween(pageAbove, pageBelow);
};


/**
 * Returns a list of page items, arranged in the new order that resulted
 * from the most recent drag-and-drop re-ordering.
 *
 * @scope    public instance method
 * @param    ulElement    The "ul" HTMLElement for the menu of menu items. 
 * @return   A list of items representing pages.
 */
NavbarView.prototype._getNewOrderingForPageList = function(ulElement) {
  // The string '[]=' is used by the "Sortable" feature in the script.aculo.us 
  // dragdrop.js library within each token in the serialization string.
  var prefixString = NavbarView.ELEMENT_ID_MENU + '[]=';
  
  var serializationString = Sortable.serialize(ulElement);
  var listOfTokens = serializationString.split('&');
  var listOfPages = [];
  for (var i in listOfTokens) {
    var uuidForPage = listOfTokens[i].replace(prefixString, '');
    var page = this.getWorld().getItemFromUuid(uuidForPage);
    listOfPages.push(page);
  }
  return listOfPages;
};


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
  }
  
  var divElement = this.getHtmlElement();
  View.removeChildrenOfElement(divElement); 
  var ulElement = View.appendNewElement(divElement, "ul", NavbarView.CSS_CLASS_MENU, {id: NavbarView.ELEMENT_ID_MENU});
  var rootView = this.getRootView();
  for (key in listOfPages) {
    page = listOfPages[key];
    page.addObserver(this);
    var menuUrl = rootView.getUrlForItem(page);
    var menuText = page.getDisplayString();
    // Caution: 
    // In order for us to use the "Sortable" feature in the script.aculo.us 
    // dragdrop.js library, this menuItemId must have exactly one underscore in
    // it, with the id for the whole menu is to the left of the underscore, and
    // the id for the individual menu item to the right of the underscore.
    var menuItemId = NavbarView.ELEMENT_ID_MENU + '_' + page._getUuid();
    var liElement = View.appendNewElement(ulElement, "li", NavbarView.CSS_CLASS_MENU_ITEM, {id: menuItemId});
    var anchorElement = View.appendNewElement(liElement, "a", null, {href: menuUrl}, menuText);
    Event.observe(anchorElement, "click", RootView.clickOnLocalLink.bindAsEventListener());
    Event.observe(liElement, "mousedown", this._mouseDownOnMenuItem.bindAsEventListener(this, liElement));
  }
  var listener = this;
  this._builtForEditMode = this.isInEditMode();
  if (this._builtForEditMode) {
    Sortable.create(NavbarView.ELEMENT_ID_MENU, {
      onUpdate: function(element){ listener._sortOrderUpdate(element);}
    });
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
