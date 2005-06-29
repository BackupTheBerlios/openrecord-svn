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
// Dependencies:
//   PageView.js
//   World.js
//   Util.js
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// RootView public class constants
// -------------------------------------------------------------------
RootView.CSS_CLASS_PAGE_EDIT_BUTTON = "page_edit_button";
RootView.CSS_CLASS_EDIT_MODE = "editmode";
RootView.CSS_CLASS_VIEW_MODE = "viewmode";
RootView.CSS_CLASS_EDIT_MODE_ONLY_CONTROL = "edit_mode_only_control";
RootView.CSS_CLASS_CONTROL_SPAN = "control_span";

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
RootView.ourSingleInstance = null;


/**
 * The OpenRecord app uses a single instance of RootView, which serves as the
 * outer-most view in the browser, and contains the current PageView as well
 * as some standard chrome (like the Edit button).
 *
 * @scope    public instance constructor
 * @syntax   var rootView = new RootView()
 */
function RootView(inWorld) {
  window.onerror = Util.handleError;
  // window.onunload = window.doOnunloadActions;
  // window.onfocus = window.doOnfocusActions;
  // window.onblur = window.doOnblurActions;
  // window.onresize = window.doOnresizeActions;  
  Util.setTargetsForExternalLinks();
  
  RootView.ourSingleInstance = this;
   
  Util.assert(inWorld instanceof World);

  // instance properties
  this._myWorld = inWorld;
  this.myEditMode = false;
  this.myNumberOfCallsToDebug = 0;
  this.myDebugTextarea = null;
  
  this._myHashTableOfItemViewsKeyedByUuid = {};
  this._myHashTableOfPageViewsKeyedByUuid = {};
  this._myCurrentContentView = null;
  this._homePage = null;
  
  this.myHashTableOfPagesKeyedByUuid = {};
  var categoryCalledPage = this._myWorld.getItemFromUuid(RootView.UUID_FOR_CATEGORY_PAGE);
  var listOfPages = this._myWorld.getItemsInCategory(categoryCalledPage);
  if (listOfPages && listOfPages.length > 0) {
    this._homePage = listOfPages[0];
  }
  for (var key in listOfPages) {
    var page = listOfPages[key];
    this.myHashTableOfPagesKeyedByUuid[page._getUuid()] = page; 
  }

  window.document.body.innerHTML = "";
  var rootDiv = View.createAndAppendElement(window.document.body, "div");
 
  for (var uuid in this.myHashTableOfPagesKeyedByUuid) {
    var aPage = this.myHashTableOfPagesKeyedByUuid[uuid];
    var anchor = View.createAndAppendElement(rootDiv, "a");
    anchor.setAttribute("name", RootView.URL_PAGE_PREFIX + aPage._getUuid());
  }
  
  var headerP = View.createAndAppendElement(rootDiv, "p", "header");
  var logoSpan = View.createAndAppendElement(headerP, "span", "logo");
  logoSpan.innerHTML = '<a href="http://openrecord.org"><span class="logostart">open</span><span class="logomiddle">record</span><span class="logoend">.org</span></a>';
  var mainControlSpan = View.createAndAppendElement(headerP, "span", null, "main_control_span");
  mainControlSpan.className = RootView.CSS_CLASS_CONTROL_SPAN;
  View.createAndAppendElement(headerP, "br");
  var navbarDiv = View.createAndAppendElement(rootDiv, "div", "navbar");
  var contentAreaDiv = View.createAndAppendElement(rootDiv, "div", "content_area");
  var contentViewDiv = View.createAndAppendElement(contentAreaDiv, "div");
  var debugDiv = View.createAndAppendElement(rootDiv, "div", "debug");

  var footerP = View.createAndAppendElement(rootDiv, "p", "footer");
  var copyrightSpan = View.createAndAppendElement(footerP, "span", "copyright");
  copyrightSpan.innerHTML = 'You can copy freely from this site &mdash; ' +
    'copyright rights relinquished under the Creative Commons ' +
    '<a rel="license external" href="http://creativecommons.org/licenses/publicdomain/">Public Domain Dedication</a>.';

  var statusBlurbSpan = View.createAndAppendElement(footerP, "span", "fileformat");
  View.createAndAppendElement(footerP, "br");
  
  this.myMainControlSpanElement = mainControlSpan;
  this.myNavbarDivElement = navbarDiv;
  this._myContentViewDivElement = contentViewDiv;
  this.myDebugDivElement = debugDiv;
  this.myStatusBlurbSpanElement = statusBlurbSpan;
  this._myRootDiv = rootDiv;
  
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
RootView.getRootView = function (inText) {
  return RootView.ourSingleInstance;
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
RootView.prototype.getWorld = function () {
  return this._myWorld;
};


/**
 * Returns the page item to be used as the home page.
 *
 * @scope    public instance method
 * @return   A page item.
 */
RootView.prototype.getHomePage = function () {
  return this._homePage;
};


/**
 * Overrides the View method and returns this view.
 *
 * @scope    public instance method
 * @return   This view.
 */
RootView.prototype.getRootView = function () {
  return this;
};


/**
 * Returns true if we are in Edit Mode.
 *
 * @scope    public instance method
 * @return   A boolean value. True if we are in Edit Mode.
 */
RootView.prototype.isInEditMode = function () {
  return this.myEditMode;
};

    
/**
 * Switches the UI into and out of edit mode.
 *
 * @scope    public instance method
 * @param    inEditModeFlag    A boolean. True to switch into edit mode, false to switch out.
 */
RootView.prototype.setEditMode = function (inEditModeFlag) {
  if (inEditModeFlag != this.myEditMode) {
    var world = this.getWorld();
    if (this.myEditMode) {
      // world.endTransaction();
      // window.document.body.style.cursor = "auto";
    } else {
      // world.beginTransaction();
      // window.document.body.style.cursor = "crosshair";
    }
    this.myEditMode = !this.myEditMode;
    this.display();
    // this.displayTextInDebugTextarea(this.myEditMode);
    // if (!this.myEditMode && window.location && (window.location.protocol == "file:")) {
    //  RootView.displayTextInDebugTextarea(world._getJsonStringRepresentingAllItems());
    // }
  }
};


/**
 * Given an item, returns a relative URL that can be used to redirect the 
 * browser to a page that displays that time.
 *
 * @scope    public instance method
 * @param    item    Any item.
 */
RootView.prototype.getUrlForItem = function (item) {
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
RootView.prototype.setCurrentContentViewFromUrl = function () {
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
        contentViewToSwitchTo = this._myHashTableOfItemViewsKeyedByUuid[uuidText];
        if (!contentViewToSwitchTo) {
          itemFromUuid = this._myWorld.getItemFromUuid(uuidText);
          if (itemFromUuid) {
            divElement = window.document.createElement("div"); 
            this._myContentViewDivElement.appendChild(divElement);
            contentViewToSwitchTo = new ItemView(this, divElement, itemFromUuid);
            this._myHashTableOfItemViewsKeyedByUuid[uuidText] = contentViewToSwitchTo;
          }
        }
      } else {
        if (isUrlForPage) {
          uuidText = originalHash.replace(RootView.URL_HASH_PAGE_PREFIX, "");
          contentViewToSwitchTo = this._myHashTableOfPageViewsKeyedByUuid[uuidText];
          if (!contentViewToSwitchTo) {
            pageFromUuid = this.myHashTableOfPagesKeyedByUuid[uuidText];
            if (pageFromUuid) {
              divElement = window.document.createElement("div"); 
              this._myContentViewDivElement.appendChild(divElement);
              contentViewToSwitchTo = new PageView(this, divElement, pageFromUuid);
              this._myHashTableOfPageViewsKeyedByUuid[uuidText] = contentViewToSwitchTo;
            }
          }
        } 
      }
    } 
  }
  
  if (!contentViewToSwitchTo) {
    var page = this.getHomePage();
    contentViewToSwitchTo = this._myHashTableOfPageViewsKeyedByUuid[page._getUuid()];
    if (!contentViewToSwitchTo) {
      divElement = window.document.createElement("div"); 
      this._myContentViewDivElement.appendChild(divElement);
      contentViewToSwitchTo = new PageView(this, divElement, page);
      this._myHashTableOfPageViewsKeyedByUuid[page._getUuid()] = contentViewToSwitchTo;
    }
  }
  if (this._myCurrentContentView) {
    this._myCurrentContentView.includeOnScreen(false);
  }
  this._myCurrentContentView = contentViewToSwitchTo;
  this.display();
};

  
/**
 * Re-creates all the HTML for the RootView, including the chrome and 
 * the current PageView, and hands the HTML to the browser to be re-drawn.
 *
 * @scope    public instance method
 */
RootView.prototype.display = function () {
  Util.assert(this._myCurrentContentView instanceof Object);

  document.title = this._myCurrentContentView.getPageTitle() + " - openrecord.org";
  this._myRootDiv.className = (this.isInEditMode()) ? RootView.CSS_CLASS_EDIT_MODE : RootView.CSS_CLASS_VIEW_MODE;
  this._displayLoginSpan();
  this._displayNavbar();
  this._displayDebugArea();
  this._myCurrentContentView.includeOnScreen(true);
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
RootView.prototype.newPage = function () {
  var repository = this.getWorld();
  repository.beginTransaction();
  var newPage = repository.newItem("New Page");
  var attributeCalledSummary = repository.getAttributeCalledSummary();
  var categoryCalledPage = repository.getItemFromUuid(RootView.UUID_FOR_CATEGORY_PAGE);
  newPage.assignToCategory(categoryCalledPage);
  newPage.addEntryForAttribute(attributeCalledSummary, "This is a new page.");

  PageView.newSection(repository, newPage);

  repository.endTransaction();
  
  this.myHashTableOfPagesKeyedByUuid[newPage._getUuid()] = newPage;
  
  return newPage;
};


/**
 * Returns a list of the page items in the repository.
 *
 * @scope    public instance method
 * @return   A list of items that represent pages.
 */
RootView.prototype.getPages = function () {
  return this.myHashTableOfPagesKeyedByUuid;
};

    

// -------------------------------------------------------------------
// Private instance methods
// -------------------------------------------------------------------
RootView.prototype._displayLoginSpan = function() {
  if (!this.loginView) {
    this.loginView = new LoginView(this,this.myMainControlSpanElement);
    this.loginView.refresh();
  }
};


/**
 * Re-creates the HTML for the Navbar, and hands the HTML to the browser 
 * to be re-drawn.
 *
 * @scope    public instance method
 */
RootView.prototype._displayNavbar = function () {
  if (!this.navbarView) {
    this.navbarView = new NavbarView(this, this.myNavbarDivElement);
  }
  this.navbarView.refresh();
};


/**
 * Re-creates the HTML for the Debug area, and hands the HTML to the browser 
 * to be re-drawn.
 *
 * @scope    public instance method
 */
RootView.prototype._displayDebugArea = function () {
  Util.assert(this.myDebugDivElement instanceof HTMLDivElement);

  var listOfStrings = [];
  listOfStrings.push("<textarea readonly id=\"" + RootView.ELEMENT_ID_DEBUG_TEXTAREA + "\" rows=\"20\" cols=\"100\" wrap=\"virtual\"></textarea>");
  var finalString = listOfStrings.join("");
  this.myDebugDivElement.innerHTML = finalString;
  this.myDebugTextarea = document.getElementById(RootView.ELEMENT_ID_DEBUG_TEXTAREA);
};


// -------------------------------------------------------------------
// Debug error display methods
// -------------------------------------------------------------------

/**
 * Displays a text string in the status blurb span.
 *
 * @scope    public class method
 * @param    inText    A text string to be displayed. 
 */
RootView.displayStatusBlurb = function (inText) {
  RootView.ourSingleInstance.displayStatusBlurb(inText);
};


/**
 * Displays a text string in the status blurb span.
 *
 * @scope    public instance method
 * @param    inText    A text string to be displayed. 
 */
RootView.prototype.displayStatusBlurb = function (inText) {
  this.myStatusBlurbSpanElement.innerHTML = inText;
};


/**
 * Displays a text string in the debug textarea.
 *
 * @scope    public class method
 * @param    inText    A text string to be displayed. 
 */
RootView.displayTextInDebugTextarea = function (inText) {
  RootView.ourSingleInstance.displayTextInDebugTextarea(inText);
};


/**
 * Displays a text string in the debug textarea.
 *
 * @scope    public instance method
 * @param    inText    A text string to be displayed. 
 */
RootView.prototype.displayTextInDebugTextarea = function (inText) {
  this.myNumberOfCallsToDebug += 1;
  if (this.myNumberOfCallsToDebug > 20) {
    return;
  }
  if (this.myDebugTextarea) {
    this.myDebugTextarea.value += inText + "\n\n============================\n\n";
    this.myDebugTextarea.style.visibility = "visible";
    this.myDebugTextarea.style.display = "block";
    this.myDebugTextarea.scrollIntoView();
  }
  else {alert(inText);}
};


/**
 * Given a JavaScript object, gets all the values of all the object's properties,
 * and displays them in the debug textarea.
 *
 * @scope    public instance method
 * @param    inObject    Any sort of object. 
 */
RootView.prototype.displayObjectInDebugTextarea = function (inObject) {
  var outputText = "";
  for (var property in inObject) {
    outputText += property + " == " + inObject[property] + "\n";
  }
  this.displayTextInDebugTextarea(outputText);
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
RootView.clickOnLocalLink = function (inEventObject) {
  var eventObject = inEventObject || window.event;
  
  var startTiming = new Date();
  
  // Cursor styles available:
  // "wait", "auto", "default", "crosshair", "help"
  // "n-resize", "s-resize", "e-resize", "w-resize"
  // "ne-resize", "se-resize", "nw-resize", "sw-resize"
  // window.document.body.style.cursor = "wait";

  var htmlAnchorElement = Util.getTargetFromEvent(eventObject);
  
  window.location = htmlAnchorElement.href;
  RootView.ourSingleInstance.setCurrentContentViewFromUrl();

  // window.document.body.style.cursor = "default";
  
  var stopTiming = new Date();
  var delayInMilliseconds = stopTiming.getTime() - startTiming.getTime();
  RootView.ourSingleInstance.displayStatusBlurb("Page load: " + delayInMilliseconds + " milliseconds");
};

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
