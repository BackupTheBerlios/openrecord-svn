/*****************************************************************************
 RootView.js
 
******************************************************************************
 Written in 2005 by 
    Brian Douglas Skinner <brian.skinner@gumption.org>
    Chih-Chao Lam <chao@cs.stanford.edu>
  
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
dojo.provide("orp.view.RootView");
dojo.require("orp.view.View");
dojo.require("orp.view.PageView");
dojo.require("orp.view.LoginView");
dojo.require("orp.view.NavbarView");
dojo.require("orp.view.ItemView");
dojo.require("orp.model.World");
dojo.require("orp.lang.Lang");

// -------------------------------------------------------------------
// Dependencies, expressed in the syntax that JSLint understands:
// 
/*global window, document, alert, HTMLDivElement */
/*global Item, World, Util */
/*global View, PageView, ItemView, NavbarView, LoginView */
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------
/**
 * The OpenRecord app uses a single instance of RootView, which serves as the
 * outer-most view in the browser, and contains the current PageView as well
 * as some standard chrome (like the Edit button).
 *
 * @scope    public instance constructor
 * @syntax   var rootView = new orp.view.RootView()
 */
orp.view.RootView = function(world) {
  window.onerror = orp.util.handleError;
  // window.onunload = window.doOnunloadActions;
  // window.onfocus = window.doOnfocusActions;
  // window.onblur = window.doOnblurActions;
  // window.onresize = window.doOnresizeActions;  
  orp.util.setTargetsForExternalLinks();
  
  orp.view.RootView._ourSingleInstance = this;
   
  orp.lang.assert(world instanceof orp.model.World);

  // instance properties
  this._world = world;
  this._editMode = false;
  this._showToolsMode = false;
  this._numberOfCallsToDebug = 0;
  this._debugTextarea = null;
  
  this._hashTableOfItemViewsKeyedByUuid = {};
  this._hashTableOfPageViewsKeyedByUuid = {};
  this._currentContentView = null;
  this._homePage = null;
  this._currentPage = null;
  this._selections = [];
  
  this._currentlyInDisplayMethod = false;
  
  document.addEventListener("keypress", this._onKeyPress.orpBindAsEventListener(this),false);
  
  // window.document.body.innerHTML = "";
  // var rootDiv = orp.view.View.appendNewElement(window.document.body, "div");
  var rootDiv = document.getElementById('OpenRecord');
  if (!rootDiv) {
    alert('Sorry, I could not find my <div id="OpenRecord"> element');
    return;
  }
  orp.view.View.removeChildrenOfElement(rootDiv);
  
  var anchorSpan = orp.view.View.appendNewElement(rootDiv, "span");
 
  var headerP = orp.view.View.appendNewElement(rootDiv, "p", "header");
  var logoSpan = orp.view.View.appendNewElement(headerP, "span", "logo");
  logoSpan.innerHTML = '<a href="http://openrecord.org"><span class="logostart">open</span><span class="logomiddle">record</span><span class="logoend">.org</span></a>';
  this._loginViewSpanElement = orp.view.View.appendNewElement(headerP, "span");
  orp.view.View.appendNewElement(headerP, "br");
  this._navbarDivElement = orp.view.View.appendNewElement(rootDiv, "div");
  var contentAreaDiv = orp.view.View.appendNewElement(rootDiv, "div", "content_area");
  this._contentViewDivElement = orp.view.View.appendNewElement(contentAreaDiv, "div");
  this._debugDivElement = orp.view.View.appendNewElement(rootDiv, "div", "debug");

  var footerP = orp.view.View.appendNewElement(rootDiv, "p", "footer");
  var copyrightSpan = orp.view.View.appendNewElement(footerP, "span", "copyright");
  copyrightSpan.innerHTML = 'You can copy freely from this site &mdash; ' +
    'copyright rights relinquished under the Creative Commons ' +
    '<a rel="license external" href="http://creativecommons.org/licenses/publicdomain/">Public Domain Dedication</a>.';

  this._statusBlurbSpanElement = orp.view.View.appendNewElement(footerP, "span", "fileformat");
  orp.view.View.appendNewElement(footerP, "br");
  
  this._anchorSpan = anchorSpan;
  this._rootDiv = rootDiv;
  
  orp.util.setErrorReportCallback(orp.view.RootView.displayTextInDebugTextarea);
  this.setCurrentContentViewFromUrl();
};


// -------------------------------------------------------------------
// Public constants
// -------------------------------------------------------------------
orp.view.RootView.cssClass = {
  PAGE_EDIT_BUTTON:  "page_edit_button",
  EDIT_MODE:         "editmode",
  VIEW_MODE:         "viewmode",
  EDIT_TOOL:         "edit_tool" };

orp.view.RootView.UUID = {
  CATEGORY_PAGE:    "00020000-ce7f-11d9-8cd5-0011113ae5d6",
  CATEGORY_SECTION: "00020100-ce7f-11d9-8cd5-0011113ae5d6" };

orp.view.RootView.elementId = {
  DEBUG_TEXTAREA: "debug_textarea" };

orp.view.RootView.URL_PAGE_PREFIX = "page";
orp.view.RootView.URL_ITEM_PREFIX = "item";
orp.view.RootView.URL_HASH_PAGE_PREFIX = "#" + orp.view.RootView.URL_PAGE_PREFIX;
orp.view.RootView.URL_HASH_ITEM_PREFIX = "#" + orp.view.RootView.URL_ITEM_PREFIX;


// -------------------------------------------------------------------
// Private class properties
// -------------------------------------------------------------------
orp.view.RootView._ourSingleInstance = null;


// -------------------------------------------------------------------
// Public class methods
// -------------------------------------------------------------------

/**
 * Returns the singleton RootView instance.
 *
 * @deprecated INSTEAD USE THE INSTANCE METHOD getRootView() AVAILABLE ON ALL View INSTANCES.
 * @scope    public class method
 * @return   The singleton instance of RootView. 
 */
orp.view.RootView.getRootView = function() {
  return orp.view.RootView._ourSingleInstance;
};


// -------------------------------------------------------------------
// Public instance methods
// -------------------------------------------------------------------

/**
 * Returns the World instance that this RootView is using.
 *
 * @scope    public instance method
 * @return   A World object. 
 */
orp.view.RootView.prototype.getWorld = function() {
  return this._world;
};


/**
 * Returns the page item to be used as the home page.
 *
 * @scope    public instance method
 * @return   A page item.
 */
orp.view.RootView.prototype.getHomePage = function() {
  if (!this._homePage) {
    var categoryCalledPage = this.getWorld().getItemFromUuid(orp.view.RootView.UUID.CATEGORY_PAGE);
    var listOfPages = this.getWorld().getItemsInCategory(categoryCalledPage);
    if (listOfPages && listOfPages.length > 0) {
      this._homePage = listOfPages[0];
    } else {
      // We may get here if the document does not yet have any pages.
    }
  }
  return this._homePage;
};


/**
 * Overrides the View method and returns this view.
 *
 * @scope    public instance method
 * @return   This view.
 */
orp.view.RootView.prototype.getRootView = function() {
  return this;
};


/**
 * Returns true if we are in Edit Mode.
 *
 * @scope    public instance method
 * @return   A boolean value. True if we are in Edit Mode.
 */
orp.view.RootView.prototype.isInEditMode = function() {
  return this._editMode;
};

    
/**
 * Switches the UI into and out of edit mode.
 *
 * @scope    public instance method
 * @param    editModeFlag    A boolean. True to switch into edit mode, false to switch out.
 */
orp.view.RootView.prototype.setEditMode = function(editModeFlag) {
  if (editModeFlag != this._editMode) {
    var world = this.getWorld();
    if (this._editMode) {
      // world.endTransaction();
      // window.document.body.style.cursor = "auto";
    } else {
      // world.beginTransaction();
      // window.document.body.style.cursor = "crosshair";
    }
    this._editMode = !this._editMode;
    this.display();
    // this.displayTextInDebugTextarea(this._editMode);
    // if (!this._editMode && window.location && (window.location.protocol == "file:")) {
    //  RootView.displayTextInDebugTextarea(world._getJsonStringRepresentingAllItems());
    // }
  }
};


/**
 * Returns true if we are in Show Tools Mode.
 *
 * @scope    public instance method
 * @return   A boolean value. True if we are in Show Tools Mode.
 */
orp.view.RootView.prototype.isInShowToolsMode = function() {
  return this._showToolsMode;
};

    
/**
 * Switches the UI between showing edit tools and hiding edit tools.
 *
 * @scope    public instance method
 * @param    showToolsFlag    A boolean. True to show edit tools, false to hide edit tools.
 */
orp.view.RootView.prototype.setShowToolsMode = function(showToolsFlag) {
  if (showToolsFlag != this._showToolsMode) {
    this._showToolsMode = !this._showToolsMode;
    this._rootDiv.className = (this.isInShowToolsMode()) ? orp.view.RootView.cssClass.EDIT_MODE : orp.view.RootView.cssClass.VIEW_MODE;
  }
};


/**
 * Returns the current page that Rootview is displaying. Null, if it's an item view
 *
 * @scope    public instance method
 */
orp.view.RootView.prototype.getCurrentPage = function() {
  return this._currentPage;
};

/**
 * Set the Root View's currentPage instance variable and
 * notify other views that the current page that Rootview is displaying has changed. 
 *
 * @scope    public instance method
 */
orp.view.RootView.prototype.setCurrentPage = function(newPage) {
  this._currentPage = newPage;
  if (this._navbarView) {this._navbarView._rebuildView();}
};

/**
 * Given an item, returns a relative URL that can be used to redirect the 
 * browser to a page that displays that time.
 *
 * @scope    public instance method
 * @param    item    Any item.
 */
orp.view.RootView.prototype.getUrlForItem = function(item) {
  orp.lang.assert(item instanceof orp.model.Item);
  var categoryCalledPage = this.getWorld().getItemFromUuid(orp.view.RootView.UUID.CATEGORY_PAGE);
  var prefix;
  if (item.isInCategory(categoryCalledPage)) {
    prefix = orp.view.RootView.URL_HASH_PAGE_PREFIX;
  } else {
    prefix = orp.view.RootView.URL_HASH_ITEM_PREFIX;
  }
  var url = prefix + item.getUuidString();
  return url;
};


/**
 * Gets the browser URL from window.location, finds or creates a corresponding
 * PageView or ItemView, and sets the current content view to the newly selected
 * PageView or ItemView.
 *
 * @scope    public instance method
 */
orp.view.RootView.prototype.setCurrentContentViewFromUrl = function() {
  var contentViewToSwitchTo = null;
  
  if (window.location) {
    if (window.location.hash) {
      var originalHash = window.location.hash;
      var uuidText = null;
      var pageFromUuid = null;
      var itemFromUuid = null;
      var divElement = null;
      var isUrlForPage = (originalHash.indexOf(orp.view.RootView.URL_HASH_PAGE_PREFIX) != -1);
      var isUrlForItem = (originalHash.indexOf(orp.view.RootView.URL_HASH_ITEM_PREFIX) != -1);
      if (isUrlForItem) {
        this.setCurrentPage(null);
        uuidText = originalHash.replace(orp.view.RootView.URL_HASH_ITEM_PREFIX, "");
        contentViewToSwitchTo = this._hashTableOfItemViewsKeyedByUuid[uuidText];
        if (!contentViewToSwitchTo) {
          itemFromUuid = this._world.getItemFromUuid(uuidText);
          if (itemFromUuid) {
            divElement = orp.view.View.appendNewElement(this._contentViewDivElement, "div");
            contentViewToSwitchTo = new orp.view.ItemView(this, divElement, itemFromUuid);
            this._hashTableOfItemViewsKeyedByUuid[uuidText] = contentViewToSwitchTo;
          }
        }
      } else {
        if (isUrlForPage) {
          uuidText = originalHash.replace(orp.view.RootView.URL_HASH_PAGE_PREFIX, "");
          pageFromUuid = this.getWorld().getItemFromUuid(uuidText);
          this.setCurrentPage(pageFromUuid); // if pageFromUuid is null, then just set currentPage to null
          contentViewToSwitchTo = this._hashTableOfPageViewsKeyedByUuid[uuidText];
          if (!contentViewToSwitchTo) {
            if (pageFromUuid) {
              divElement = orp.view.View.appendNewElement(this._contentViewDivElement, "div");
              contentViewToSwitchTo = new orp.view.PageView(this, divElement, pageFromUuid);
              this._hashTableOfPageViewsKeyedByUuid[uuidText] = contentViewToSwitchTo;
            }
          }
        } 
      }
    } 
  }
  
  if (!contentViewToSwitchTo) {
    var page = this.getHomePage();
    if (page) {
      contentViewToSwitchTo = this._hashTableOfPageViewsKeyedByUuid[page.getUuid()];
      if (!contentViewToSwitchTo) {
        divElement = window.document.createElement("div"); 
        this._contentViewDivElement.appendChild(divElement);
        contentViewToSwitchTo = new orp.view.PageView(this, divElement, page);
        this._hashTableOfPageViewsKeyedByUuid[page.getUuid()] = contentViewToSwitchTo;
      }
    }
  }
  if (this._currentContentView) {
    this._currentContentView.includeOnScreen(false);
  }
  this._currentContentView = contentViewToSwitchTo;
  this.display();
};

  
/**
 * Re-creates all the HTML for the RootView, including the chrome and 
 * the current PageView, and hands the HTML to the browser to be re-drawn.
 *
 * @scope    public instance method
 */
orp.view.RootView.prototype.display = function() {
  if (!this._currentlyInDisplayMethod) {
    this._currentlyInDisplayMethod = true;
    this._rootDiv.className = (this.isInShowToolsMode()) ? orp.view.RootView.cssClass.EDIT_MODE : orp.view.RootView.cssClass.VIEW_MODE;
    this._displayLoginSpan();
    this._displayNavbar();
    this._displayDebugArea();
    if (this._currentContentView) {
      orp.lang.assert(this._currentContentView instanceof Object);
      document.title = this._currentContentView.getPageTitle() + " - openrecord.org";
      this._currentContentView.includeOnScreen(true);
    }
    window.focus();
    this._currentlyInDisplayMethod = false;
  }
};


/**
 * Creates a new page.  Creates an new item representing a page, gives the
 * item an initial name and short name, puts one section in the page, and
 * sets up an initial query for the section.
 *
 * @scope    public instance method
 * @return   The newly created page item.
 */
orp.view.RootView.prototype.newPage = function() {
  var hasAtLeastOnePage = this.getHomePage() ? true : false;
  var repository = this.getWorld();
  repository.beginTransaction();
  var newPage = repository.newItem("New Page");
  var attributeCalledSummary = repository.getAttributeCalledSummary();
  var categoryCalledPage = repository.getItemFromUuid(orp.view.RootView.UUID.CATEGORY_PAGE);
  newPage.assignToCategory(categoryCalledPage);
  newPage.addEntry({attribute:attributeCalledSummary, value:"This is a new page."});

  if (hasAtLeastOnePage) {
    orp.view.PageView.newSection(repository, newPage);
  } else {
    // If we get here it means we're creating the very first page in 
    // this repository, so make it a "Welcome page" that just has a title
    // and a summary, without any new sections.
  }

  repository.endTransaction();
  
  return newPage;
};


// -------------------------------------------------------------------
// Private instance methods
// -------------------------------------------------------------------

/**
 * Creates the HTML for the LoginView, and hands the HTML to the browser 
 * to be drawn.
 *
 * @scope    private instance method
 */
orp.view.RootView.prototype._displayLoginSpan = function() {
  if (!this._loginView) {
    this._loginView = new orp.view.LoginView(this, this._loginViewSpanElement);
    this._loginView.refresh();
  }
};


/**
 * Re-creates the HTML for the Navbar, and hands the HTML to the browser 
 * to be re-drawn.
 *
 * @scope    private instance method
 */
orp.view.RootView.prototype._displayNavbar = function() {
  if (!this._navbarView) {
    this._navbarView = new orp.view.NavbarView(this, this._navbarDivElement, this._anchorSpan);
  }
  this._navbarView.refresh();
};


/**
 * Re-creates the HTML for the Debug area, and hands the HTML to the browser 
 * to be re-drawn.
 *
 * @scope    private instance method
 */
orp.view.RootView.prototype._displayDebugArea = function() {
  orp.lang.assert(this._debugDivElement instanceof HTMLDivElement);

  var listOfStrings = [];
  listOfStrings.push("<textarea readonly id=\"" + orp.view.RootView.elementId.DEBUG_TEXTAREA + "\" rows=\"20\" cols=\"100\" wrap=\"virtual\"></textarea>");
  var finalString = listOfStrings.join("");
  this._debugDivElement.innerHTML = finalString;
  this._debugTextarea = document.getElementById(orp.view.RootView.elementId.DEBUG_TEXTAREA);
};


// -------------------------------------------------------------------
// Debug error display methods
// -------------------------------------------------------------------

/**
 * Displays a text string in the status blurb span.
 *
 * @scope    public class method
 * @param    text    A text string to be displayed. 
 */
orp.view.RootView.displayStatusBlurb = function(text) {
  orp.view.RootView._ourSingleInstance.displayStatusBlurb(text);
};


/**
 * Displays a text string in the status blurb span.
 *
 * @scope    public instance method
 * @param    text    A text string to be displayed. 
 */
orp.view.RootView.prototype.displayStatusBlurb = function(text) {
  this._statusBlurbSpanElement.innerHTML = text;
};


/**
 * Displays a text string in the debug textarea.
 *
 * @scope    public class method
 * @param    text    A text string to be displayed. 
 */
orp.view.RootView.displayTextInDebugTextarea = function(text) {
  orp.view.RootView._ourSingleInstance.displayTextInDebugTextarea(text);
};


/**
 * Displays a text string in the debug textarea.
 *
 * @scope    public instance method
 * @param    text    A text string to be displayed. 
 */
orp.view.RootView.prototype.displayTextInDebugTextarea = function(text) {
  this._numberOfCallsToDebug += 1;
  if (this._numberOfCallsToDebug > 20) {
    return;
  }
  if (this._debugTextarea) {
    this._debugTextarea.value += text + "\n\n============================\n\n";
    this._debugTextarea.style.visibility = "visible";
    this._debugTextarea.style.display = "block";
    this._debugTextarea.scrollIntoView();
  }
  else {
    alert(text);
  }
};


/**
 * Given a JavaScript object, gets all the values of all the object's properties,
 * and displays them in the debug textarea.
 *
 * @scope    public instance method
 * @param    object    Any sort of object. 
 */
orp.view.RootView.prototype.displayObjectInDebugTextarea = function(object) {
  var outputText = "";
  for (var property in object) {
    outputText += property + " == " + object[property] + "\n";
  }
  this.displayTextInDebugTextarea(outputText);
};

/**
 * Sets the selection to the given selectable object (current View) or null
 * Unselects the current selection if any
 * @scope    public instance method
 * @param    aView    A selectable object
 */
orp.view.RootView.prototype.setSelection = function(aView) {
  // unselect current selection
  for (var i in this._selections) {
    this._selections[i].unSelect();
  }
  if (aView) {
    orp.lang.assert(aView instanceof orp.view.View);
    this._selections = [aView];
  }
  else {this._selections = [];}
};

/**
 * Adds the selection with the given selectable object (current View) 
 * @scope    public instance method
 * @param    aView    A selectable object
 */
orp.view.RootView.prototype.addToSelection = function(aView) {
  orp.lang.assert(aView instanceof orp.view.View);
  orp.util.addObjectToSet(aView,this._selections);
};

/**
 * Removes the given selectable object (current View) from selection
 * @scope    public instance method
 * @param    aView    A selectable object
 */
orp.view.RootView.prototype.removeFromSelection = function(aView) {
  orp.lang.assert(aView instanceof orp.view.View);
  orp.lang.assert(orp.util.removeObjectFromSet(aView,this._selections));
};
  
// -------------------------------------------------------------------
// Event handler methods
// -------------------------------------------------------------------

/**
 * Called when the user clicks on a menu item in the navbar, or on any other 
 * auto-generated link that points to other OpenRecord content.
 * 
 * Called from an HTML "li" element or an HTML "a" element on a generated page.
 * There is no need to call this method directly.
 *
 * @scope    public class method
 * @param    inEventObject    An event object. 
 */
orp.view.RootView.clickOnLocalLink = function(eventObject) {
  eventObject = eventObject || window.event;
  
  var startTiming = new Date();
  
  // Cursor styles available:
  // "wait", "auto", "default", "crosshair", "help"
  // "n-resize", "s-resize", "e-resize", "w-resize"
  // "ne-resize", "se-resize", "nw-resize", "sw-resize"
  // window.document.body.style.cursor = "wait";

  var htmlAnchorElement = orp.util.getTargetFromEvent(eventObject);
  
  window.location = htmlAnchorElement.href;
  orp.view.RootView._ourSingleInstance.setCurrentContentViewFromUrl();

  // window.document.body.style.cursor = "default";
  
  var stopTiming = new Date();
  var delayInMilliseconds = stopTiming.getTime() - startTiming.getTime();
  orp.view.RootView._ourSingleInstance.displayStatusBlurb("Page load: " + delayInMilliseconds + " milliseconds");
};

orp.view.RootView.prototype._onKeyPress = function(anEvent) {
  if (!(anEvent.target instanceof HTMLInputElement || anEvent.target instanceof HTMLTextAreaElement)) {
    for (var i in this._selections) {
      var selectObj = this._selections[i];
      if (selectObj.handleKeyEventWhenSelected(anEvent)) {
        anEvent.preventDefault();
        return true;
      }
    }
  }
};

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
