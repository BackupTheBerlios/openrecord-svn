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
// Dependencies, expressed in the syntax that JSLint understands:
// 
/*global window, document, alert, HTMLDivElement */
/*global Item, World, Util */
/*global View, PageView, ItemView, NavbarView, LoginView */
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// RootView public class constants
// -------------------------------------------------------------------
RootView.CSS_CLASS_PAGE_EDIT_BUTTON = "page_edit_button";
RootView.CSS_CLASS_EDIT_MODE = "editmode";
RootView.CSS_CLASS_VIEW_MODE = "viewmode";
RootView.CSS_CLASS_EDIT_TOOL = "edit_tool";

RootView.ELEMENT_ID_DEBUG_TEXTAREA = "debug_textarea";

RootView.URL_PAGE_PREFIX = "page";
RootView.URL_ITEM_PREFIX = "item";
RootView.URL_HASH_PAGE_PREFIX = "#" + RootView.URL_PAGE_PREFIX;
RootView.URL_HASH_ITEM_PREFIX = "#" + RootView.URL_ITEM_PREFIX;

RootView.UUID_FOR_CATEGORY_PAGE    = "00020000-ce7f-11d9-8cd5-0011113ae5d6";
RootView.UUID_FOR_CATEGORY_SECTION = "00020100-ce7f-11d9-8cd5-0011113ae5d6";


// -------------------------------------------------------------------
// RootView class properties
// -------------------------------------------------------------------
RootView._ourSingleInstance = null;


/**
 * The OpenRecord app uses a single instance of RootView, which serves as the
 * outer-most view in the browser, and contains the current PageView as well
 * as some standard chrome (like the Edit button).
 *
 * @scope    public instance constructor
 * @syntax   var rootView = new RootView()
 */
function RootView(world) {
  window.onerror = Util.handleError;
  // window.onunload = window.doOnunloadActions;
  // window.onfocus = window.doOnfocusActions;
  // window.onblur = window.doOnblurActions;
  // window.onresize = window.doOnresizeActions;  
  Util.setTargetsForExternalLinks();
  
  RootView._ourSingleInstance = this;
   
  Util.assert(world instanceof World);

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
  this._selections = [];
  document.addEventListener("keypress",this._onKeyPress.bindAsEventListener(this),false);
  
  // window.document.body.innerHTML = "";
  // var rootDiv = View.appendNewElement(window.document.body, "div");
  var rootDiv = document.getElementById('OpenRecord');
  if (!rootDiv) {
    alert('Sorry, I could not find my <div id="OpenRecord"> element');
    return;
  }
  View.removeChildrenOfElement(rootDiv);
  
  var anchorSpan = View.appendNewElement(rootDiv, "span");
 
  var headerP = View.appendNewElement(rootDiv, "p", "header");
  var logoSpan = View.appendNewElement(headerP, "span", "logo");
  logoSpan.innerHTML = '<a href="http://openrecord.org"><span class="logostart">open</span><span class="logomiddle">record</span><span class="logoend">.org</span></a>';
  this._loginViewSpanElement = View.appendNewElement(headerP, "span");
  View.appendNewElement(headerP, "br");
  this._navbarDivElement = View.appendNewElement(rootDiv, "div");
  var contentAreaDiv = View.appendNewElement(rootDiv, "div", "content_area");
  this._contentViewDivElement = View.appendNewElement(contentAreaDiv, "div");
  this._debugDivElement = View.appendNewElement(rootDiv, "div", "debug");

  var footerP = View.appendNewElement(rootDiv, "p", "footer");
  var copyrightSpan = View.appendNewElement(footerP, "span", "copyright");
  copyrightSpan.innerHTML = 'You can copy freely from this site &mdash; ' +
    'copyright rights relinquished under the Creative Commons ' +
    '<a rel="license external" href="http://creativecommons.org/licenses/publicdomain/">Public Domain Dedication</a>.';

  this._statusBlurbSpanElement = View.appendNewElement(footerP, "span", "fileformat");
  View.appendNewElement(footerP, "br");
  
  this._anchorSpan = anchorSpan;
  this._rootDiv = rootDiv;
  
  Util.setErrorReportCallback(RootView.displayTextInDebugTextarea);
  this.setCurrentContentViewFromUrl();
}


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
RootView.getRootView = function() {
  return RootView._ourSingleInstance;
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
RootView.prototype.getWorld = function() {
  return this._world;
};


/**
 * Returns the page item to be used as the home page.
 *
 * @scope    public instance method
 * @return   A page item.
 */
RootView.prototype.getHomePage = function() {
  if (!this._homePage) {
    var categoryCalledPage = this.getWorld().getItemFromUuid(RootView.UUID_FOR_CATEGORY_PAGE);
    var listOfPages = this.getWorld().getItemsInCategory(categoryCalledPage);
    if (listOfPages && listOfPages.length > 0) {
      this._homePage = listOfPages[0];
    } else {
      Util.assert(false);
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
RootView.prototype.getRootView = function() {
  return this;
};


/**
 * Returns true if we are in Edit Mode.
 *
 * @scope    public instance method
 * @return   A boolean value. True if we are in Edit Mode.
 */
RootView.prototype.isInEditMode = function() {
  return this._editMode;
};

    
/**
 * Switches the UI into and out of edit mode.
 *
 * @scope    public instance method
 * @param    editModeFlag    A boolean. True to switch into edit mode, false to switch out.
 */
RootView.prototype.setEditMode = function(editModeFlag) {
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
RootView.prototype.isInShowToolsMode = function() {
  return this._showToolsMode;
};

    
/**
 * Switches the UI between showing edit tools and hiding edit tools.
 *
 * @scope    public instance method
 * @param    showToolsFlag    A boolean. True to show edit tools, false to hide edit tools.
 */
RootView.prototype.setShowToolsMode = function(showToolsFlag) {
  if (showToolsFlag != this._showToolsMode) {
    this._showToolsMode = !this._showToolsMode;
    this._rootDiv.className = (this.isInShowToolsMode()) ? RootView.CSS_CLASS_EDIT_MODE : RootView.CSS_CLASS_VIEW_MODE;
  }
};


/**
 * Given an item, returns a relative URL that can be used to redirect the 
 * browser to a page that displays that time.
 *
 * @scope    public instance method
 * @param    item    Any item.
 */
RootView.prototype.getUrlForItem = function(item) {
  Util.assert(item instanceof Item);
  var categoryCalledPage = this.getWorld().getItemFromUuid(RootView.UUID_FOR_CATEGORY_PAGE);
  var prefix;
  if (item.isInCategory(categoryCalledPage)) {
    prefix = RootView.URL_HASH_PAGE_PREFIX;
  } else {
    prefix = RootView.URL_HASH_ITEM_PREFIX;
  }
  var url = prefix + item._getUuid();
  return url;
};


/**
 * Gets the browser URL from window.location, finds or creates a corresponding
 * PageView or ItemView, and sets the current content view to the newly selected
 * PageView or ItemView.
 *
 * @scope    public instance method
 */
RootView.prototype.setCurrentContentViewFromUrl = function() {
  var contentViewToSwitchTo = null;
  
  if (window.location) {
    if (window.location.hash) {
      var originalHash = window.location.hash;
      var uuidText = null;
      var pageFromUuid = null;
      var itemFromUuid = null;
      var divElement = null;
      var isUrlForPage = (originalHash.indexOf(RootView.URL_HASH_PAGE_PREFIX) != -1);
      var isUrlForItem = (originalHash.indexOf(RootView.URL_HASH_ITEM_PREFIX) != -1);
      if (isUrlForItem) {
        uuidText = originalHash.replace(RootView.URL_HASH_ITEM_PREFIX, "");
        contentViewToSwitchTo = this._hashTableOfItemViewsKeyedByUuid[uuidText];
        if (!contentViewToSwitchTo) {
          itemFromUuid = this._world.getItemFromUuid(uuidText);
          if (itemFromUuid) {
            divElement = View.appendNewElement(this._contentViewDivElement, "div");
            contentViewToSwitchTo = new ItemView(this, divElement, itemFromUuid);
            this._hashTableOfItemViewsKeyedByUuid[uuidText] = contentViewToSwitchTo;
          }
        }
      } else {
        if (isUrlForPage) {
          uuidText = originalHash.replace(RootView.URL_HASH_PAGE_PREFIX, "");
          contentViewToSwitchTo = this._hashTableOfPageViewsKeyedByUuid[uuidText];
          if (!contentViewToSwitchTo) {
            pageFromUuid = this.getWorld().getItemFromUuid(uuidText);
            if (pageFromUuid) {
              divElement = View.appendNewElement(this._contentViewDivElement, "div");
              contentViewToSwitchTo = new PageView(this, divElement, pageFromUuid);
              this._hashTableOfPageViewsKeyedByUuid[uuidText] = contentViewToSwitchTo;
            }
          }
        } 
      }
    } 
  }
  
  if (!contentViewToSwitchTo) {
    var page = this.getHomePage();
    contentViewToSwitchTo = this._hashTableOfPageViewsKeyedByUuid[page._getUuid()];
    if (!contentViewToSwitchTo) {
      divElement = window.document.createElement("div"); 
      this._contentViewDivElement.appendChild(divElement);
      contentViewToSwitchTo = new PageView(this, divElement, page);
      this._hashTableOfPageViewsKeyedByUuid[page._getUuid()] = contentViewToSwitchTo;
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
RootView.prototype.display = function() {
  Util.assert(this._currentContentView instanceof Object);

  document.title = this._currentContentView.getPageTitle() + " - openrecord.org";
  this._rootDiv.className = (this.isInShowToolsMode()) ? RootView.CSS_CLASS_EDIT_MODE : RootView.CSS_CLASS_VIEW_MODE;
  this._displayLoginSpan();
  this._displayNavbar();
  this._displayDebugArea();
  this._currentContentView.includeOnScreen(true);
  window.focus();
};


/**
 * Creates a new page.  Creates an new item representing a page, gives the
 * item an initial name and short name, puts one section in the page, and
 * sets up an initial query for the section.
 *
 * @scope    public instance method
 * @return   The newly created page item.
 */
RootView.prototype.newPage = function() {
  var repository = this.getWorld();
  repository.beginTransaction();
  var newPage = repository.newItem("New Page");
  var attributeCalledSummary = repository.getAttributeCalledSummary();
  var categoryCalledPage = repository.getItemFromUuid(RootView.UUID_FOR_CATEGORY_PAGE);
  newPage.assignToCategory(categoryCalledPage);
  newPage.addEntryForAttribute(attributeCalledSummary, "This is a new page.");

  PageView.newSection(repository, newPage);

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
RootView.prototype._displayLoginSpan = function() {
  if (!this._loginView) {
    this._loginView = new LoginView(this, this._loginViewSpanElement);
    this._loginView.refresh();
  }
};


/**
 * Re-creates the HTML for the Navbar, and hands the HTML to the browser 
 * to be re-drawn.
 *
 * @scope    private instance method
 */
RootView.prototype._displayNavbar = function() {
  if (!this._navbarView) {
    this._navbarView = new NavbarView(this, this._navbarDivElement, this._anchorSpan);
  }
  this._navbarView.refresh();
};


/**
 * Re-creates the HTML for the Debug area, and hands the HTML to the browser 
 * to be re-drawn.
 *
 * @scope    private instance method
 */
RootView.prototype._displayDebugArea = function() {
  Util.assert(this._debugDivElement instanceof HTMLDivElement);

  var listOfStrings = [];
  listOfStrings.push("<textarea readonly id=\"" + RootView.ELEMENT_ID_DEBUG_TEXTAREA + "\" rows=\"20\" cols=\"100\" wrap=\"virtual\"></textarea>");
  var finalString = listOfStrings.join("");
  this._debugDivElement.innerHTML = finalString;
  this._debugTextarea = document.getElementById(RootView.ELEMENT_ID_DEBUG_TEXTAREA);
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
RootView.displayStatusBlurb = function(text) {
  RootView._ourSingleInstance.displayStatusBlurb(text);
};


/**
 * Displays a text string in the status blurb span.
 *
 * @scope    public instance method
 * @param    text    A text string to be displayed. 
 */
RootView.prototype.displayStatusBlurb = function(text) {
  this._statusBlurbSpanElement.innerHTML = text;
};


/**
 * Displays a text string in the debug textarea.
 *
 * @scope    public class method
 * @param    text    A text string to be displayed. 
 */
RootView.displayTextInDebugTextarea = function(text) {
  RootView._ourSingleInstance.displayTextInDebugTextarea(text);
};


/**
 * Displays a text string in the debug textarea.
 *
 * @scope    public instance method
 * @param    text    A text string to be displayed. 
 */
RootView.prototype.displayTextInDebugTextarea = function(text) {
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
RootView.prototype.displayObjectInDebugTextarea = function(object) {
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
RootView.prototype.setSelection = function(aView) {
  // unselect current selection
  for (var i in this._selections) {
    this._selections[i].unSelect();
  }
  if (aView) {
    Util.assert(aView instanceof View);
    this._selections = [aView];
  }
  else {this._selections = [];}
};

/**
 * Adds the selection with the given selectable object (current View) 
 * @scope    public instance method
 * @param    aView    A selectable object
 */
RootView.prototype.addToSelection = function(aView) {
  Util.assert(aView instanceof View);
  Util.addObjectToSet(aView,this._selections);
};

/**
 * Removes the given selectable object (current View) from selection
 * @scope    public instance method
 * @param    aView    A selectable object
 */
RootView.prototype.removeFromSelection = function(aView) {
  Util.assert(aView instanceof View);
  Util.assert(Util.removeObjectFromSet(aView,this._selections));
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
RootView.clickOnLocalLink = function(eventObject) {
  eventObject = eventObject || window.event;
  
  var startTiming = new Date();
  
  // Cursor styles available:
  // "wait", "auto", "default", "crosshair", "help"
  // "n-resize", "s-resize", "e-resize", "w-resize"
  // "ne-resize", "se-resize", "nw-resize", "sw-resize"
  // window.document.body.style.cursor = "wait";

  var htmlAnchorElement = Util.getTargetFromEvent(eventObject);
  
  window.location = htmlAnchorElement.href;
  RootView._ourSingleInstance.setCurrentContentViewFromUrl();

  // window.document.body.style.cursor = "default";
  
  var stopTiming = new Date();
  var delayInMilliseconds = stopTiming.getTime() - startTiming.getTime();
  RootView._ourSingleInstance.displayStatusBlurb("Page load: " + delayInMilliseconds + " milliseconds");
};

RootView.prototype._onKeyPress = function(anEvent) {
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
