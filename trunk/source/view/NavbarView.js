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
dojo.require("dojo.dnd.*");

// -------------------------------------------------------------------
// Dependencies, expressed in the syntax that JSLint understands:
// 
/*global window */
/*global RootView */
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

orp.view.NavbarView.prototype._handleDrop = function(elementThatWasDragged) {
  // First figure out which page was dragged (indexOfDraggedPage) 
  // and where it landed (newIndex).
  var world = this.getWorld();
  var draggedUuid = elementThatWasDragged.dragObject.domNode.getAttribute('uuid');
  var draggedPage = world.getItemFromUuid(draggedUuid);
  var indexOfDraggedPage = orp.util.getArrayIndex(this._listOfPages, draggedPage);
  var ulElement = dojo.byId(orp.view.NavbarView.elementId.MENU);
  var liCells = ulElement.getElementsByTagName("li");

  var newIndex = -1;
  for (i = 0; i < liCells.length; ++i) {
    if (liCells[i].getAttribute('uuid') == draggedUuid) {
      newIndex = i;
      break;
    }
  }
  orp.lang.assert(newIndex >= 0);

  if (indexOfDraggedPage == newIndex) {
    return;
  }

  var draggedUp = indexOfDraggedPage > newIndex;
  var pageAbove = (newIndex === 0) ?
    null : this._listOfPages[draggedUp? newIndex - 1 : newIndex];
  var pageBelow = (newIndex == liCells.length - 1) ?
    null : this._listOfPages[draggedUp? newIndex : newIndex + 1];
  draggedPage.reorderBetween(pageAbove, pageBelow);
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
  this._listOfPages = this.getWorld().getItemsInCategory(categoryCalledPage);
  var key;
  var page;

  orp.view.View.removeChildrenOfElement(this._htmlElementForAnchors);
  for (key in this._listOfPages) {
    page = this._listOfPages[key];
    var anchorName = orp.view.RootView.URL_PAGE_PREFIX + page.getUuidString();
    orp.view.View.appendNewElement(this._htmlElementForAnchors, "a", null, {name: anchorName});
  }
  
  var divElement = this.getHtmlElement();
  orp.view.View.removeChildrenOfElement(divElement);
  var ulElement = orp.view.View.appendNewElement(divElement, "ul", orp.view.NavbarView.cssClass.MENU, {id: orp.view.NavbarView.elementId.MENU});
  var rootView = this.getRootView();
  for (key in this._listOfPages) {
    page = this._listOfPages[key];
    page.addObserver(this);
    var menuUrl = rootView.getUrlForItem(page);
    var menuText = page.getDisplayString();
    var liElement = orp.view.View.appendNewElement(ulElement, "li", orp.view.NavbarView.cssClass.MENU_ITEM, 
                                                   {uuid: page.getUuidString()});
    if (page == this.getRootView().getCurrentPage()) {orp.util.css_addClass(liElement, orp.view.NavbarView.cssClass.SELECTED);}
    var anchorElement = orp.view.View.appendNewElement(liElement, "a", null, {href: menuUrl}, menuText);

    dojo.event.connect(anchorElement, "onclick", orp.view.RootView.clickOnLocalLink);
    if (this.isInEditMode()) {
      new dojo.dnd.HtmlDragSource(liElement, "pageCell");
    }
  }
  this._builtForEditMode = this.isInEditMode();
  if (this._builtForEditMode) {
    var dropTarget = new dojo.dnd.HtmlDropTarget(ulElement, ["pageCell"]);
    dojo.event.connect(dropTarget, "onDrop", this, "_handleDrop");
  }
  
  var newPageButton = orp.view.View.appendNewElement(divElement, "input", orp.view.RootView.cssClass.EDIT_TOOL);
  newPageButton.type = "button";
  newPageButton.value = "New Page";
  dojo.event.connect(newPageButton, "onclick", this, "_clickOnNewPageButton");

  var FIXME_OCT_19_2005_EXPERIMENT = false;
  if (FIXME_OCT_19_2005_EXPERIMENT) {
    var getTrunkButton = orp.view.View.appendNewElement(divElement, "input");
    getTrunkButton.type = "button";
    getTrunkButton.value = "getBaseScriptUri()";
    dojo.event.connect(getTrunkButton, "onclick", this, "getBaseScriptUri");
  }

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

var FIXME_OCT_19_2005_EXPERIMENT = false;
if (FIXME_OCT_19_2005_EXPERIMENT) {
  orp.view.NavbarView.prototype.getBaseScriptUri = function(event) {
    alert(window.location.pathname + "\n" + dojo.hostenv.getBaseScriptUri());
  };
}

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
