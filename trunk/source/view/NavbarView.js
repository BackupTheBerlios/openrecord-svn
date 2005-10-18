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
// Provides and Requires
// -------------------------------------------------------------------
dojo.provide("orp.view.NavbarView");
dojo.require("orp.view.View");
dojo.require("orp.view.RootView");
dojo.require("orp.lang.Lang");
dojo.require("dojo.event.*");

// -------------------------------------------------------------------
// Dependencies, expressed in the syntax that JSLint understands:
// 
/*global window */
/*global RootView */
/*global Sortable */
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------

/**
 * The RootView uses an instance of a NavbarView to display a navigation
 * bar, with links to pages.
 *
 * @scope    public instance constructor
 * @extends  View
 * @param    superview    The view that serves as the superview for this view. 
 * @param    htmlElement    The HTMLElement to display the HTML in. 
 */
orp.view.NavbarView = function(superview, htmlElement, htmlElementForAnchors) {
  orp.view.View.call(this, superview, htmlElement, "NavbarView");
  this._htmlElementForAnchors = htmlElementForAnchors;
  this._liElementBeingTouched = null;
  this._builtForEditMode = false;
};

dojo.inherits(orp.view.NavbarView, orp.view.View);  // makes NavbarView be a subclass of View


// -------------------------------------------------------------------
// Public constants
// -------------------------------------------------------------------
orp.view.NavbarView.cssClass = {
  MENU:      "menu",
  MENU_ITEM: "menu_item",
  SELECTED:  "selected" };

// Caution: 
// In order for us to use the "Sortable" feature in the script.aculo.us 
// dragdrop.js library, this "MainMenu" Id must *not* have an underscore 
// in it.
orp.view.NavbarView.elementId = {
  MENU:      "MainMenu" };
  

// -------------------------------------------------------------------
// Public methods
// -------------------------------------------------------------------

/**
 * Re-creates all the HTML for the view, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    public instance method
 */
orp.view.NavbarView.prototype.refresh = function() {
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
 */
orp.view.NavbarView.prototype._mouseDownOnMenuItem = function(event) {
  // FIXME: 
  // Should we be using "event.target" instead of "event.currentTarget"?
  // Or should we be using orp.util.getTargetFromEvent(event)?
  this._liElementBeingTouched = event.currentTarget;
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
orp.view.NavbarView.prototype._sortOrderUpdate = function(ulElement) {
  orp.lang.assert(this._liElementBeingTouched !== null);
  
  var liElementPrefixString = orp.view.NavbarView.elementId.MENU + '_';
  var menuItemElementId = this._liElementBeingTouched.id;
  var pageUuid = menuItemElementId.replace(liElementPrefixString, '');
  var pageToReorder = this.getWorld().getItemFromUuid(pageUuid);
  
  var listOfPages = this._getNewOrderingForPageList(ulElement);
  
  var arrayIndex = orp.util.getArrayIndex(listOfPages, pageToReorder);
  orp.lang.assert(arrayIndex != -1);
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
orp.view.NavbarView.prototype._getNewOrderingForPageList = function(ulElement) {
  // The string '[]=' is used by the "Sortable" feature in the script.aculo.us 
  // dragdrop.js library within each token in the serialization string.
  var prefixString = orp.view.NavbarView.elementId.MENU + '[]=';
  
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
orp.view.NavbarView.prototype._rebuildView = function() {
  var categoryCalledPage = this.getWorld().getItemFromUuid(orp.view.RootView.UUID.CATEGORY_PAGE);
  categoryCalledPage.addObserver(this);
  var listOfPages = this.getWorld().getItemsInCategory(categoryCalledPage);
  var key;
  var page;

  orp.view.View.removeChildrenOfElement(this._htmlElementForAnchors);
  for (key in listOfPages) {
    page = listOfPages[key];
    var anchorName = orp.view.RootView.URL_PAGE_PREFIX + page.getUuidString();
    orp.view.View.appendNewElement(this._htmlElementForAnchors, "a", null, {name: anchorName});
  }
  
  var divElement = this.getHtmlElement();
  orp.view.View.removeChildrenOfElement(divElement); 
  var ulElement = orp.view.View.appendNewElement(divElement, "ul", orp.view.NavbarView.cssClass.MENU, {id: orp.view.NavbarView.elementId.MENU});
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
    var menuItemId = orp.view.NavbarView.elementId.MENU + '_' + page.getUuidString();
    var liElement = orp.view.View.appendNewElement(ulElement, "li", orp.view.NavbarView.cssClass.MENU_ITEM, {id: menuItemId});
    if (page == this.getRootView().getCurrentPage()) {orp.util.css_addClass(liElement, orp.view.NavbarView.cssClass.SELECTED);}
    var anchorElement = orp.view.View.appendNewElement(liElement, "a", null, {href: menuUrl}, menuText);
    
    dojo.event.connect(anchorElement, "onclick", orp.view.RootView.clickOnLocalLink);
    dojo.event.connect(liElement, "onmousedown", this, "_mouseDownOnMenuItem");
  }
  var listener = this;
  this._builtForEditMode = this.isInEditMode();
  if (this._builtForEditMode) {
    Sortable.create(orp.view.NavbarView.elementId.MENU, {
      onUpdate: function(element){ listener._sortOrderUpdate(element);}
    });
  }
  
  var newPageButton = orp.view.View.appendNewElement(divElement, "input", orp.view.RootView.cssClass.EDIT_TOOL);
  newPageButton.type = "button";
  newPageButton.value = "New Page";
  dojo.event.connect(newPageButton, "onclick", this, "_clickOnNewPageButton");

  var FIXME_OCT_14_2005_EXPERIMENT = false;
  if (FIXME_OCT_14_2005_EXPERIMENT) {
    var stage = this;
    
    var kermitButton = orp.view.View.appendNewElement(divElement, "input");
    kermitButton.type = "button";
    kermitButton.value = "Kermit";
    // dojo.event.connect(kermitButton, "onclick", function(evt){stage.addMuppet("Kermit was added");});
    dojo.event.connect(kermitButton, "onclick", this, "plusMuppet");

    var elmoButton = orp.view.View.appendNewElement(divElement, "input");
    elmoButton.type = "button";
    elmoButton.value = "Elmo";
    // dojo.event.connect(elmoButton, "onclick", function(evt){stage.addMuppet("Elmo was added");});
    dojo.event.connect(elmoButton, "onclick", this, "plusMuppet");

    kermitButton.muppetName = "Kermit the Frog";
    elmoButton.muppetName = "Elmo the Red";
    window.kermitButton = kermitButton;
    window.elmoButton = elmoButton;

    var nobodyButton = orp.view.View.appendNewElement(divElement, "input");
    nobodyButton.type = "button";
    nobodyButton.value = "nobody";
    nobodyButton.orp_name = "nobody :-(";
    dojo.event.kwConnect({
      srcObj:     nobodyButton, 
      srcFunc:    "onclick", 
      targetObj:  stage,
      targetFunc: "addMuppetEvent" });
  }

};

var FIXME_OCT_14_2005_EXPERIMENT = false;
if (FIXME_OCT_14_2005_EXPERIMENT) {
orp.view.NavbarView.prototype.plusMuppet = function(event) {
  alert(event.target.muppetName);
  delete event.target.muppetName;
  dojo.event.disconnect(window.kermitButton, "onclick", this, "plusMuppet");
};

orp.view.NavbarView.prototype.addMuppet = function(muppetName) {
  muppetName = muppetName || "nobody :-(";
  alert(muppetName);
};

orp.view.NavbarView.prototype.addMuppetEvent = function(event, muppetName) {
  
  muppetName = muppetName || "nobody :-(";
  alert(event.target.orp_name);
};
}

// -------------------------------------------------------------------
// Event handler methods
// -------------------------------------------------------------------

/**
 * Called when the user clicks on the "New Page" button.
 *
 * @scope    private instance method
 */
orp.view.NavbarView.prototype._clickOnNewPageButton = function(eventObject) {
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
orp.view.NavbarView.prototype.observedItemHasChanged = function(item, listOfRecordsForItem) {
  // alert("Navbar observed: " + item.getDisplayString());
  this._rebuildView();
};

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
