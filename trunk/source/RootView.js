/*****************************************************************************
 RootView.js
 
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
//   PageView.js
//   Stevedore.js
//   Util.js
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// RootView public class constants
// -------------------------------------------------------------------
RootView.ELEMENT_CLASS_PAGE_EDIT_BUTTON = "page_edit_button";

RootView.ELEMENT_ID_EDIT_BUTTON = "edit_button";
RootView.ELEMENT_ID_DEBUG_TEXTAREA = "debug_textarea";

RootView.URL_PAGE_PREFIX = "page";
RootView.URL_ITEM_PREFIX = "item";
RootView.URL_HASH_PAGE_PREFIX = "#" + RootView.URL_PAGE_PREFIX;
RootView.URL_HASH_ITEM_PREFIX = "#" + RootView.URL_ITEM_PREFIX;

RootView.ELEMENT_CLASS_EDIT_MODE = "editmode";
RootView.ELEMENT_CLASS_VIEW_MODE = "viewmode";


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
function RootView(inStevedore) {
  RootView.ourSingleInstance = this;
   
  Util.assert(inStevedore instanceof Stevedore);

  // instance properties
  this._myStevedore = inStevedore;
  this.myEditButtonId = RootView.ELEMENT_ID_EDIT_BUTTON;
  this.myEditMode = false;
  this.myNumberOfCallsToDebug = 0;
  this.myDebugTextarea = null;
  
  this._myHashTableOfItemViewsKeyedByUuid = {};
  this._myHashTableOfPageViewsKeyedByUuid = {};
  this._myCurrentContentView = null;
  
  this.myHashTableOfPagesKeyedByUuid = {};
  var categoryPage = this._myStevedore.getItemFromUuid(Stevedore.UUID_FOR_CATEGORY_PAGE);
  var listOfPages = this._myStevedore.getListOfItemsInCategory(categoryPage);
  for (var key in listOfPages) {
    var page = listOfPages[key];
    this.myHashTableOfPagesKeyedByUuid[page.getUuid()] = page; 
  }

  window.document.body.innerHTML = "";
  var rootDiv = View.createAndAppendElement(window.document.body, "div");
 
  for (var uuid in this.myHashTableOfPagesKeyedByUuid) {
    var aPage = this.myHashTableOfPagesKeyedByUuid[uuid];
    var anchor = View.createAndAppendElement(rootDiv, "a");
    anchor.setAttribute("name", RootView.URL_PAGE_PREFIX + aPage.getUuid());
  }
  
  var headerP = View.createAndAppendElement(rootDiv, "p", "header");
  var logoSpan = View.createAndAppendElement(headerP, "span", "logo");
  logoSpan.innerHTML = '<a href="http://openrecord.org"><span class="logostart">open</span><span class="logomiddle">record</span><span class="logoend">.org</span></a>';
  var mainControlSpan = View.createAndAppendElement(headerP, "span", null, "main_control_span");
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
// Public instance methods
// -------------------------------------------------------------------

/**
 * Returns the Stevedore instance that this RootView is using.
 *
 * @scope    public instance method
 * @return   A Stevedore object. 
 */
RootView.prototype.getStevedore = function () {
  return this._myStevedore;
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
      var uuidNumber = null;
      var pageFromUuid = null;
      var itemFromUuid = null;
      var divElement = null;
      var isUrlForPage = (originalHash.indexOf(RootView.URL_HASH_PAGE_PREFIX) != -1);
      var isUrlForItem = (originalHash.indexOf(RootView.URL_HASH_ITEM_PREFIX) != -1);
      if (isUrlForItem) {
        uuidText = originalHash.replace(RootView.URL_HASH_ITEM_PREFIX, "");
        uuidNumber = parseInt(uuidText);
        contentViewToSwitchTo = this._myHashTableOfItemViewsKeyedByUuid[uuidNumber];
        if (!contentViewToSwitchTo) {
          itemFromUuid = this._myStevedore.getItemFromUuid(uuidNumber);
          if (itemFromUuid) {
            divElement = window.document.createElement("div"); 
            this._myContentViewDivElement.appendChild(divElement);
            contentViewToSwitchTo = new ItemView(this, divElement, itemFromUuid);
            this._myHashTableOfItemViewsKeyedByUuid[uuidNumber] = contentViewToSwitchTo;
          }
        }
      } else {
        if (isUrlForPage) {
          uuidText = originalHash.replace(RootView.URL_HASH_PAGE_PREFIX, "");
          uuidNumber = parseInt(uuidText);
          contentViewToSwitchTo = this._myHashTableOfPageViewsKeyedByUuid[uuidNumber];
          if (!contentViewToSwitchTo) {
            pageFromUuid = this.myHashTableOfPagesKeyedByUuid[uuidNumber];
            if (pageFromUuid) {
              divElement = window.document.createElement("div"); 
              this._myContentViewDivElement.appendChild(divElement);
              contentViewToSwitchTo = new PageView(this, divElement, pageFromUuid);
              this._myHashTableOfPageViewsKeyedByUuid[uuidNumber] = contentViewToSwitchTo;
            }
          }
        } 
      }
    } 
  }
  
  if (!contentViewToSwitchTo) {
    var page = this._myStevedore.getHomePage();
    contentViewToSwitchTo = this._myHashTableOfPageViewsKeyedByUuid[page.getUuid()];
    if (!contentViewToSwitchTo) {
      divElement = window.document.createElement("div"); 
      this._myContentViewDivElement.appendChild(divElement);
      contentViewToSwitchTo = new PageView(this, divElement, page);
      this._myHashTableOfPageViewsKeyedByUuid[page.getUuid()] = contentViewToSwitchTo;
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

  document.title = this._myCurrentContentView.getPageTitle() + " - openagenda.org";
  this._myRootDiv.className = (this.isInEditMode()) ? RootView.ELEMENT_CLASS_EDIT_MODE : RootView.ELEMENT_CLASS_VIEW_MODE;
  this.displayControlSpan();
  this.displayNavbar();
  this.displayDebugArea();
  this._myCurrentContentView.includeOnScreen(true);
  window.focus();
};


/**
 * Re-creates the HTML for the chrome area containing the controls,
 * and hands the HTML to the browser to be re-drawn.
 *
 * @scope    public instance method
 */
RootView.prototype.displayControlSpan = function () {
  Util.assert(this.myMainControlSpanElement instanceof HTMLSpanElement);

  var listOfStrings = [];
  
  var buttonValue = (this.myEditMode) ? "Save" : "Edit";
  listOfStrings.push("<input type=\"button\" class=\"" + RootView.ELEMENT_CLASS_PAGE_EDIT_BUTTON + "\" id=\"" + this.myEditButtonId + "\" name=\"editbutton\" value=\"" + buttonValue + "\"></input>");

  // write out the new control span content 
  var finalString = listOfStrings.join("");
  this.myMainControlSpanElement.innerHTML = finalString;

  // add event handlers for the newly created control span UI elements
  var editButton = document.getElementById(this.myEditButtonId);
  var listener = this;
  Util.addEventListener(editButton, "click",
    function(event) { listener.clickOnEditButton(event);});
};


/**
 * Re-creates the HTML for the Navbar, and hands the HTML to the browser 
 * to be re-drawn.
 *
 * @scope    public instance method
 */
RootView.prototype.displayNavbar = function () {
  Util.assert(this.myNavbarDivElement instanceof HTMLDivElement);

  var listOfStrings = [];

  listOfStrings.push("<ul class=\"menu\">");
  
  for (var uuid in this.myHashTableOfPagesKeyedByUuid) {
    var page = this.myHashTableOfPagesKeyedByUuid[uuid];
    var menuText = page.getShortName();
    var menuUrl = RootView.URL_HASH_PAGE_PREFIX + page.getUuid();
    listOfStrings.push("<li class=\"menu_item\"><a href=\"" + menuUrl + "\" onclick=\"RootView.clickOnLocalLink(event)\">" + menuText + "</a></li>");
  }

  listOfStrings.push("</ul>");
  // listOfStrings.push("<p><a href=\"http://www.opensource.org/\"><img src=\"osi-certified-60x50.png\" width=\"60\" height=\"50\" alt=\"OSI logo\"></img></a></p>");
  
  // write out the new control span content 
  var finalString = listOfStrings.join("");
  this.myNavbarDivElement.innerHTML = finalString;
};


/**
 * Re-creates the HTML for the Debug area, and hands the HTML to the browser 
 * to be re-drawn.
 *
 * @scope    public instance method
 */
RootView.prototype.displayDebugArea = function () {
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
  this.myDebugTextarea.value += inText + "\n\n============================\n\n";
  this.myDebugTextarea.style.visibility = "visible";
  this.myDebugTextarea.style.display = "block";
  this.myDebugTextarea.scrollIntoView();
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
 * auto-generated link that points to other Blue-sky content.
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

  
/**
 * Called when the user clicks on the big "Edit" button.
 * 
 * Called from an HTML "input type='button'" element on the generated page.  
 * There is no need to call this method directly.
 *
 * @scope    public instance method
 * @param    inEventObject    An event object. 
 */
RootView.prototype.clickOnEditButton = function (inEventObject) {
  var stevedore = this.getStevedore();
  if (this.myEditMode) {
    stevedore.endTransaction();
    window.document.body.style.cursor = "auto";
  } else {
    stevedore.beginTransaction();
    window.document.body.style.cursor = "crosshair";
  }
  this.myEditMode = !this.myEditMode;
  this.display();
  // this.displayTextInDebugTextarea(this.myEditMode);
  if (!this.myEditMode && window.location && (window.location.protocol == "file:")) {
    RootView.displayTextInDebugTextarea(stevedore._getJsonStringRepresentingAllItems());
  }
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
