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
//   World.js
//   Util.js
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// RootView public class constants
// -------------------------------------------------------------------
RootView.ELEMENT_CLASS_PAGE_EDIT_BUTTON = "page_edit_button";

RootView.ELEMENT_ID_DEBUG_TEXTAREA = "debug_textarea";

RootView.URL_PAGE_PREFIX = "page";
RootView.URL_ITEM_PREFIX = "item";
RootView.URL_HASH_PAGE_PREFIX = "#" + RootView.URL_PAGE_PREFIX;
RootView.URL_HASH_ITEM_PREFIX = "#" + RootView.URL_ITEM_PREFIX;

RootView.ELEMENT_CLASS_EDIT_MODE = "editmode";
RootView.ELEMENT_CLASS_VIEW_MODE = "viewmode";

RootView.COOKIE_NAME = "user";
RootView.CONTROL_SPAN_CLASS = "control_span";

RootView.UUID_FOR_HOME_PAGE = 2000;
RootView.UUID_FOR_CATEGORY_PAGE = 145;
RootView.UUID_FOR_CATEGORY_SECTION = 146;  // PENDING: not used?


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
  RootView.ourSingleInstance = this;
   
  Util.assert(inWorld instanceof World);

  // instance properties
  this._myWorld = inWorld;
  this.myEditMode = false;
  this.myNumberOfCallsToDebug = 0;
  this.myDebugTextarea = null;
  this.myCookie = new Cookie(document,RootView.COOKIE_NAME,10*365*24);
  this.myCookie.load();
  
  this._myHashTableOfItemViewsKeyedByUuid = {};
  this._myHashTableOfPageViewsKeyedByUuid = {};
  this._myCurrentContentView = null;
  
  this.myHashTableOfPagesKeyedByUuid = {};
  var categoryCalledPage = this._myWorld.getItemFromUuid(RootView.UUID_FOR_CATEGORY_PAGE);
  var listOfPages = this._myWorld.getItemsInCategory(categoryCalledPage);
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
  mainControlSpan.className = RootView.CONTROL_SPAN_CLASS;
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
 * Returns the World instance that this RootView is using.
 *
 * @scope    public instance method
 * @return   A World object. 
 */
RootView.prototype.getWorld = function () {
  return this._myWorld;
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
 * Returns the page item to be used as the home page.
 *
 * @scope    public instance method
 * @return   A page item.
 */
RootView.prototype.getHomePage = function () {
  return this.getWorld().getItemFromUuid(RootView.UUID_FOR_HOME_PAGE);
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
          itemFromUuid = this._myWorld.getItemFromUuid(uuidNumber);
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
  var mySpan = this.myMainControlSpanElement;
  Util.assert(mySpan instanceof HTMLSpanElement);
  for (var i = mySpan.childNodes.length-1;i >= 0; --i) {
    mySpan.removeChild(mySpan.childNodes[i]);
  }

  var username = this.myCookie.username;
  var knownUser = username !== null;
  if (!knownUser) {username = "guest. Your username: ";}
  var welcomeNode = document.createTextNode("Hello, " + username);
  mySpan.appendChild(welcomeNode);
  if (knownUser) { 
    welcomeNode.appendData(". ");
    var signoutLink = document.createElement("a");
    signoutLink.appendChild(document.createTextNode("Sign out"));
    signoutLink.onclick = this.clickOnSignoutButton.bindAsEventListener(this);
    mySpan.appendChild(signoutLink);
    var editButton = document.createElement("input");
    editButton.type = "button";
    editButton.value = (this.myEditMode) ? "Save" : "Edit";
    editButton.onclick = this.clickOnEditButton.bindAsEventListener(this);
    mySpan.appendChild(editButton);
  }
  else {
    this.usernameInput = document.createElement("input");
    this.usernameInput.size=10;
    this.usernameInput.onkeypress = this.signinKeyPress.bindAsEventListener(this);
    var signinButton = document.createElement("input");
    signinButton.value = "Sign in";
    signinButton.type = "button";
    signinButton.onclick = this.clickOnSignInButton.bindAsEventListener(this);
    mySpan.appendChild(this.usernameInput);
    mySpan.appendChild(signinButton);
  }
};

RootView.prototype.clickOnSignoutButton = function(inEventObject) {
// called when sign out button is clicked
  if (this.myEditMode) {this.setEditMode(false);}
  this.myCookie.username = null;
  this.myCookie.store();
  this.displayControlSpan();
};

RootView.prototype.signinKeyPress = function(inEventObject) {
// called when sign in input field is typed with keystroke
// see if <return> is pressed, if so, similate clicking on sign in button
  if (inEventObject.keyCode == Util.ASCII_VALUE_FOR_RETURN) {
    this.clickOnSignInButton(inEventObject);
  }
};

RootView.prototype.clickOnSignInButton = function(inEventObject) {
// called when sign in button is clicked
  function isValidUsername(username) {
    // PENDING: hard coded to validate for alphanumeric usernames of 3 or more characters
    if (!username) {return false;}
    return username.search(/\w{3,}/) >= 0;
  }
  
  var newUsername = this.usernameInput.value;
  if (isValidUsername(newUsername)) {
    this.myCookie.username = newUsername;
    this.myCookie.store();
    this.displayControlSpan();
  }
  else {
    var newErrorNode = document.createTextNode("\n Your username must be 3 or more alphanumeric characters!");
    if (this.errorNode) {this.myMainControlSpanElement.replaceChild(newErrorNode,this.errorNode);}
    else {this.myMainControlSpanElement.appendChild(newErrorNode); }
    this.errorNode = newErrorNode;
  }
};

/**
 * Re-creates the HTML for the Navbar, and hands the HTML to the browser 
 * to be re-drawn.
 *
 * @scope    public instance method
 */
RootView.prototype.displayNavbar = function () {
  Util.assert(this.myNavbarDivElement instanceof HTMLDivElement);

  var attributeCalledShortName = this.getWorld().getAttributeCalledShortName();
  var listOfStrings = [];

  listOfStrings.push("<ul class=\"menu\">");
  
  for (var uuid in this.myHashTableOfPagesKeyedByUuid) {
    var page = this.myHashTableOfPagesKeyedByUuid[uuid];
    var menuText = page.getSingleStringValueFromAttribute(attributeCalledShortName);
    var menuUrl = RootView.URL_HASH_PAGE_PREFIX + page._getUuid();
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
  this.setEditMode(!this.myEditMode);
};

RootView.prototype.setEditMode = function (newVal) {
  if (newVal != this.myEditMode) {
    var world = this.getWorld();
    if (this.myEditMode) {
      world.endTransaction();
      window.document.body.style.cursor = "auto";
    } else {
      world.beginTransaction();
      window.document.body.style.cursor = "crosshair";
    }
    this.myEditMode = !this.myEditMode;
    this.display();
    // this.displayTextInDebugTextarea(this.myEditMode);
    // if (!this.myEditMode && window.location && (window.location.protocol == "file:")) {
    //  RootView.displayTextInDebugTextarea(world._getJsonStringRepresentingAllItems());
    // }
  }
};
// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
