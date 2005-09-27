/*****************************************************************************
 LoginView.js

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
dojo.provide("orp.view.LoginView");
dojo.provide("orp.view.UserSuggestionBox");
dojo.require("orp.view.View");
dojo.require("dojo.event.*");

// -------------------------------------------------------------------
// Dependencies, expressed in the syntax that JSLint understands:
// 
/*global document  */
/*global Util  */
/*global Cookie  */
/*global UserSuggestionBox  */
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------

/**
 * The RootView uses an instance of a LoginView to display a login prompt,
 * as well as controls for creating a new user account.
 *
 * @scope    public instance constructor
 * @extends  View
 * @param    superview    The view that this LoginView is nested in. 
 * @param    htmlElement    The HTMLElement to display the HTML in. 
 */
orp.view.LoginView = function(superview, htmlElement) {
  orp.view.View.call(this, superview, htmlElement, "LoginView");

  // -------------------------------------------------------------------
  // Public constants
  // -------------------------------------------------------------------
  orp.view.LoginView.COOKIE_NAME = "useruuid";
 
  // instance properties
  this._isCreatingNewAccount = false;
  var tenYearCookieExpiration = 10*365*24;   // PENDING: hardcode expiration to 10yrs
  this._cookie = new Cookie(document, orp.view.LoginView.COOKIE_NAME, tenYearCookieExpiration);
  this._cookie.load();
};

dj_inherits(orp.view.LoginView, orp.view.View);  // makes LoginView be a subclass of View


// -------------------------------------------------------------------
// Public instance methods
// -------------------------------------------------------------------

/**
 * Re-creates all the HTML for the LoginView, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    public instance method
 */
orp.view.LoginView.prototype.refresh = function() {
  if (!this._myHasEverBeenDisplayedFlag) {
    this._rebuildView();
  }
};


// -------------------------------------------------------------------
// Private instance methods
// -------------------------------------------------------------------

/**
 * Re-creates the HTML for the chrome area containing the controls,
 * and hands the HTML to the browser to be re-drawn.
 *
 * @scope    private instance method
 */
orp.view.LoginView.prototype._rebuildView = function() {
  var mySpan = this.getHtmlElement();
  
  orp.view.View.removeChildrenOfElement(mySpan);
  
  var currentUser = this.getWorld().getCurrentUser();
  if (!currentUser) {
    // alert("displayControlSpan: !currentUser");
    var userUuid = this._cookie.userUuid;
    var password = this._cookie.password;
    // alert("displayControlSpan: userUuid = " + userUuid);
    if (userUuid) {
      var userToLoginAs = this.getWorld().getItemFromUuid(userUuid);
      if (userToLoginAs) { 
        this.getWorld().login(userToLoginAs, password);
        currentUser = this.getWorld().getCurrentUser();
      }
      if (!currentUser) {
        this._cookie.userUuid = null;
        this._cookie.store();
      }
    }
  }
  var editMode = currentUser ? true : false;
  this.getRootView().setEditMode(editMode);
  
  this.errorNode = orp.view.View.appendNewElement(mySpan,"span",null,{id:"login_view_error"});
  this.errorNode.style.display = 'None';
  this.errorNode.style.color = '#EE0000';
  if (this._isCreatingNewAccount) {
    // The user wants to create a new account.
    // Create a line that looks like this:
    //   Enter new name and password:  _username_  _password_  [Create New Account]
    
    orp.view.View.appendNewTextNode(mySpan,"Enter new name and password:");
    this.usernameInput = orp.view.View.appendNewElement(mySpan, "input", null, {size:20, value:"Albert Einstein"});
    orp.view.View.appendNewTextNode(mySpan," ");
    this.passwordInput = orp.view.View.appendNewElement(mySpan, "input", null, {size:10, type:"password", value:"randomdots"});
    // this.passwordInput.onkeypress = this._createAccountPasswordKeyPress.orpBindAsEventListener(this);
    dojo.event.connect(this.passwordInput, "onkeypress", this, "_createAccountPasswordKeyPress");
    orp.view.View.appendNewTextNode(mySpan, " ");
    var newAccountButton = orp.view.View.appendNewElement(mySpan ,"input", null, {value:"Create New Account", type:"button"});
    // newAccountButton.onclick = this._clickOnNewAcctButton.orpBindAsEventListener(this);
    dojo.event.connect(newAccountButton, "onclick", this, "_clickOnNewAcctButton");
    this.usernameInput.select();
  } else if (currentUser) { 
    // The user is already logged in.
    // Create a line that looks like this:
    //   Hello Jane Doe.  _Sign out_  [Edit]
    
    orp.view.View.appendNewTextNode(mySpan, "Hello " + currentUser.getDisplayString() + ". ");
    var signOutLink = orp.view.View.appendNewElement(mySpan, "a", null, null, "Sign out");
    // signOutLink.onclick = this._clickOnSignoutLink.orpBindAsEventListener(this);
    dojo.event.connect(signOutLink, "onclick", this, "_clickOnSignoutLink");
    orp.view.View.appendNewTextNode(mySpan, " ");
    var showToolsButton = orp.view.View.appendNewElement(mySpan, "input", null, {type:"button", value:
      (this.getRootView().isInShowToolsMode()) ? "Hide Tools" : "Show Tools"});
    // showToolsButton.onclick = this._clickOnShowToolsButton.orpBindAsEventListener(this);
    dojo.event.connect(showToolsButton, "onclick", this, "_clickOnShowToolsButton");
  }
  else {
    // The user has not yet signed in.
    // Create a line that looks like this:
    //   _Create Account_  or sign in:  _username_  _password_  [Sign in]
    
    var createAccountLink = orp.view.View.appendNewElement(mySpan, "a", null, null, "Create Account");
    // createAccountLink.onclick = this._clickOnCreateAccountLink.orpBindAsEventListener(this);
    dojo.event.connect(createAccountLink, "onclick", this, "_clickOnCreateAccountLink");
    orp.view.View.appendNewTextNode(mySpan, " or sign in: ");
    this.usernameInput = orp.view.View.appendNewElement(mySpan, "input", null, {size:20,value:"Albert Einstein"});
    mySpan.appendChild(document.createTextNode(" "));
    this.passwordInput = orp.view.View.appendNewElement(mySpan, "input", null, {size:10,type:"password",value:"randomdots"});
    // this.passwordInput.onkeypress = this._signinPasswordKeyPress.orpBindAsEventListener(this);
    // this.passwordInput.onfocus = this._signinPasswordFocus.orpBindAsEventListener(this);
    dojo.event.connect(this.passwordInput, "onkeypress", this, "_signinPasswordKeyPress");
    dojo.event.connect(this.passwordInput, "onfocus", this, "_signinPasswordFocus");
    this._myUsernameSuggestionBox = new orp.view.UserSuggestionBox(this.usernameInput, this.getWorld().getUsers(), this.passwordInput);
    mySpan.appendChild(document.createTextNode(" "));
    var signInButton = orp.view.View.appendNewElement(mySpan, "input", null, {value:"Sign in",type:"button"});
    // signInButton.onclick = this._clickOnSignInButton.orpBindAsEventListener(this);
    dojo.event.connect(signInButton, "onclick", this, "_clickOnSignInButton");
  }
  
};


// -------------------------------------------------------------------
// Event handler methods
// -------------------------------------------------------------------

/**
 * Called when sign out button is clicked.
 *
 * @scope    private instance method
 */
orp.view.LoginView.prototype._clickOnSignoutLink = function(eventObject) {
  if (this.isInEditMode()) {
    this.getRootView().setEditMode(false);
  }
  this._cookie.userUuid = null;
  this._cookie.store();
  this.getWorld().logout();
  this._rebuildView();
  this.getRootView().setShowToolsMode(false);
  this.getRootView().setEditMode(false);
};


/**
 * Called when sign in password input field gets focus.
 *
 * @scope    private instance method
 */
orp.view.LoginView.prototype._signinPasswordFocus = function(eventObject) {
  this.passwordInput.value = "";
};


/**
 * Called when sign in password input field is typed with keystroke.
 *
 * @scope    private instance method
 */
orp.view.LoginView.prototype._signinPasswordKeyPress = function(eventObject) {
  // see if <return> is pressed, if so, similate clicking on sign in button
  if (eventObject.keyCode == orp.util.ASCII.RETURN) {
    this._clickOnSignInButton(eventObject);
  }
};


/**
 * Called when create account password input field is typed with keystroke.
 *
 * @scope    private instance method
 */
orp.view.LoginView.prototype._createAccountPasswordKeyPress = function(eventObject) {
  // see if <return> is pressed, if so, similate clicking on sign in button
  if (eventObject.keyCode == orp.util.ASCII.RETURN) {
    this._clickOnNewAcctButton(eventObject);
  }
};


/**
 * Called when the user clicks on the "Create Account" link.
 *
 * @scope    private instance method
 */
orp.view.LoginView.prototype._clickOnCreateAccountLink = function(eventObject) {
  this._isCreatingNewAccount = true;
  this._rebuildView();
};


/**
 * Called when the user clicks on the "Create New Account" button.
 *
 * @scope    private instance method
 */
orp.view.LoginView.prototype._clickOnNewAcctButton = function(eventObject) {
  var username = this.usernameInput.value;
  var password = this.passwordInput.value;
  if (password === null) {
    password = "";
  }
  this._createNewUser(username, password);
};


/**
 * Called when the user clicks on the "Sign in" button.
 *
 * @scope    private instance method
 */
orp.view.LoginView.prototype._clickOnSignInButton = function(eventObject) {

  var listOfUsers = this.getWorld().getUsers();
  var userNameEntered = this.usernameInput.value;
  var key;
  var currentUser = null;

  for (key in listOfUsers) {
    if (!currentUser) {
      var user = listOfUsers[key];
      var lowerCaseUserName = user.getDisplayName().toLowerCase();
      var lowerCaseUserNameEntered = userNameEntered.toLowerCase();
      var numberOfCharactersToCompare = lowerCaseUserNameEntered.length;
      var shortUserName = lowerCaseUserName.substring(0, numberOfCharactersToCompare);
      if (shortUserName == lowerCaseUserNameEntered) {
        // we have a match!
        var password = this.passwordInput.value;
        if (password === null) {
          password = "";
        }
        this._loginUser(user, password);
        return;
      }
    }
  }
  this._reportError("Login failed. Unknown user.");
};


/**
 * Called when the user clicks on the "Edit" button.
 *
 * @scope    private instance method
 * @param    eventObject    An event object. 
 */
orp.view.LoginView.prototype._clickOnShowToolsButton = function(eventObject) {
  this.getRootView().setShowToolsMode(!this.getRootView().isInShowToolsMode());
  this._rebuildView();
};


// -------------------------------------------------------------------
// Private helper methods
// -------------------------------------------------------------------

/**
 *
 */
orp.view.LoginView.prototype._loginUser = function(user, password) {
  var loginSuccess = this.getWorld().login(user, password); 
  if (loginSuccess) {
    var userUuidString = user.getUuidString();
    this._cookie.userUuid = userUuidString;
    this._cookie.password = password;
    this._cookie.store();
    this._rebuildView();
  } else {
    this._reportError("Login failed. Wrong password.");
  }
  this.getRootView().setEditMode(loginSuccess);
};


/**
 *
 */
orp.view.LoginView.prototype._reportError = function(errorString) {
  var mySpan = this.getHtmlElement();
  Effect.Shake(mySpan);
  orp.view.View.removeChildrenOfElement(this.errorNode);
  orp.view.View.appendNewTextNode(this.errorNode,errorString + ' ');
  Effect.Appear(this.errorNode, {duration:2.0, transition:Effect.Transitions.wobble});
};


/**
 *
 */
orp.view.LoginView.prototype._createNewUser = function(username, password) {
  function isValidUsername(username) {
    // PENDING: hard coded to validate for alphanumeric usernames of 3 or more characters
    if (!username) {return false;}
    return username.search(/\w{3,}/) >= 0;
  }

  if (isValidUsername(username)) {
    var newUser = this.getWorld().newUser(username, password); 
    this._loginUser(newUser,password);
    this._isCreatingNewAccount = false;
    this._rebuildView();
  } else {
    this._reportError("Invalid username"); //pending better error message
  }
};


// -------------------------------------------------------------------
// Suggestion box methods
// -------------------------------------------------------------------

/**
 * PENDING: 
 * 
 * We wrote this UserSuggestionBox code back before we had the general
 * /view/SuggestionBox.js class.  The SuggestionBox.js class is better,
 * because it allows you to use the arrow keys to scroll through the
 * options.  We shouldn't be trying to maintain this UserSuggestionBox
 * too.  Instead, we should make SuggestionBox.js generic enough that
 * we can just use it instead of UserSuggestionBox.
 */
orp.view.UserSuggestionBox = function(htmlInputField, listOfEntries, nextHtmlField) {
  this._inputField = htmlInputField;
  this._listOfEntries = listOfEntries.sort(orp.view.UserSuggestionBox.compareEntryDisplayNames);
  this._nextField = nextHtmlField;
  
  this._userSuggestionBoxDivElement = document.createElement('div');
  this._userSuggestionBoxDivElement.style.visibility = "hidden";
  this._userSuggestionBoxDivElement.style.zIndex = 11;
  this._userSuggestionBoxDivElement.style.display = "none";
  document.body.appendChild(this._userSuggestionBoxDivElement);
  
  // this._inputField.onkeyup = this._keyPressOnInputField.orpBindAsEventListener(this);
  // this._inputField.onfocus = this._focusOnInputField.orpBindAsEventListener(this);
  // this._inputField.onblur = this._blurOnInputField.orpBindAsEventListener(this);
  dojo.event.connect(this._inputField, "onkeyup", this, "_keyPressOnInputField");
  dojo.event.connect(this._inputField, "onfocus", this, "_focusOnInputField");
  dojo.event.connect(this._inputField, "onblur", this, "_blurOnInputField");
  //this._keyPressOnInputField();
};


/**
 *
 */
orp.view.UserSuggestionBox.compareEntryDisplayNames = function(entryOne, entryTwo) {
  var displayNameOne = entryOne.getDisplayName();
  var displayNameTwo = entryTwo.getDisplayName();
  if (displayNameOne == displayNameTwo) {
    return 0;
  } else {
    return (displayNameOne > displayNameTwo) ?  1 : -1;
  }
};


/**
 *
 */
orp.view.UserSuggestionBox.prototype._focusOnInputField = function(eventObject) {
  // PENDING:
  //
  // I think this first line:
  //   this._inputField.value = "";
  // maybe causes an error to appear in the JavaScript Console.
  // The error reads something like this:
  //   Error: [Exception... "'Permission denied to get property XULElement.selectedIndex' 
  //                          when calling method: [nsIAutoCompletePopup::selectedIndex]"  
  //          nsresult: "0x8057001e (NS_ERROR_XPC_JS_THREW_STRING)"  
  this._inputField.value = "";
  this._redisplayUserSuggestionBox();
};


/**
 *
 */
orp.view.UserSuggestionBox.prototype._keyPressOnInputField = function(eventObject) {
  this._redisplayUserSuggestionBox();
};


/**
 *
 */
orp.view.UserSuggestionBox.prototype._blurOnInputField = function(eventObject) {
  // make the suggestion box disappear
  this._userSuggestionBoxDivElement.style.display = "none";
};


/**
 *
 */
orp.view.UserSuggestionBox.prototype._clickOnSelection = function(eventObject, string) {
  this._inputField.value = string;
  this._nextField.select();
};


/**
 *
 */
orp.view.UserSuggestionBox.prototype._redisplayUserSuggestionBox = function() {
  var partialInputString = this._inputField.value;
  var listOfMatchingStrings = [];
  var key;
  
  for (key in this._listOfEntries) {
    var entry = this._listOfEntries[key];
    var lowerCaseEntryString = entry.getDisplayName().toLowerCase();
    var lowerCaseInputString = partialInputString.toLowerCase();
    var numberOfCharactersToCompare = lowerCaseInputString.length;
    var shortEntryString = lowerCaseEntryString.substring(0, numberOfCharactersToCompare);
    if (shortEntryString == lowerCaseInputString) {
      // we have a match!
      listOfMatchingStrings.push(entry.getDisplayName());
    }
  }
  
  if (listOfMatchingStrings.length === 0) {
    // make the suggestion box disappear
    this._userSuggestionBoxDivElement.style.display = "none";
  } else {
    orp.view.View.removeChildrenOfElement(this._userSuggestionBoxDivElement);
    var table = document.createElement('table');
    var rowNumber = 0;
    var columnNumber = 0;
    
    for (key in listOfMatchingStrings) {
      var string = listOfMatchingStrings[key];
      var textNode = document.createTextNode(string);
      var row = table.insertRow(rowNumber);
      var cell = row.insertCell(columnNumber);
      cell.appendChild(textNode);
      cell.onmousedown = this._clickOnSelection.orpBindAsEventListener(this, string);
      rowNumber += 1;
    }
    this._userSuggestionBoxDivElement.appendChild(table);
    
    // set-up the suggestion box to open just below the input field it comes from
    var suggestionBoxTop = orp.util.getOffsetTopFromElement(this._inputField) + this._inputField.offsetHeight;
    var suggestionBoxLeft = orp.util.getOffsetLeftFromElement(this._inputField);
    this._userSuggestionBoxDivElement.style.top = suggestionBoxTop + "px"; 
    this._userSuggestionBoxDivElement.style.left = suggestionBoxLeft + "px";
    // alert(this._inputField.offsetWidth);
    this._userSuggestionBoxDivElement.style.width = (this._inputField.offsetWidth - 2)+ "px";
    
    // this._userSuggestionBoxDivElement.style.zIndex = 11;
    this._userSuggestionBoxDivElement.className = "SuggestionBox";
    this._userSuggestionBoxDivElement.style.visibility = "visible";
    this._userSuggestionBoxDivElement.style.display = "block";
  }
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
