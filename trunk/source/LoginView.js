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
// Dependencies, expressed in the syntax that JSLint understands:
// 
/*global document  */
/*global Util  */
/*global Cookie  */
/*global SuggestionBox  */
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// LoginView public class constants
// -------------------------------------------------------------------
LoginView.COOKIE_NAME = "useruuid";


/**
 * The RootView uses an instance of a LoginView to display a login prompt,
 * as well as controls for creating a new user account.
 *
 * @scope    public instance constructor
 * @extends  View
 * @param    inSuperView    The view that this LoginView is nested in. 
 * @param    inHTMLElement    The HTMLElement to display the HTML in. 
 */
LoginView.prototype = new View();  // makes LoginView be a subclass of View
function LoginView(inSuperView, inHTMLElement) {
  // instance properties
  this.setSuperview(inSuperView);
  this.setHTMLElement(inHTMLElement);
  this._isCreatingNewAccount = false;
  var tenYearCookieExpiration = 10*365*24;   // PENDING: hardcode expiration to 10yrs
  this._cookie = new Cookie(document, LoginView.COOKIE_NAME, tenYearCookieExpiration);
  this._cookie.load();
}


// -------------------------------------------------------------------
// Public instance methods
// -------------------------------------------------------------------

/**
 * Re-creates all the HTML for the LoginView, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    public instance method
 */
LoginView.prototype.refresh = function () {
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
LoginView.prototype._rebuildView = function () {
  var mySpan = this.getHTMLElement();
  
  View.removeChildrenOfElement(mySpan);
  
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
  
  var welcomeText, welcomeNode;
  if (this._isCreatingNewAccount) {
    // The user wants to create a new account.
    // Create a line that looks like this:
    //   Please enter new name and password:  _username_  _password_  [Create New Account]
    
    welcomeText = "Please enter new name and password:";
    welcomeNode = document.createTextNode(welcomeText);
    this.usernameInput = document.createElement("input");
    this.usernameInput.size = 20;
    this.usernameInput.value = "Albert Einstein";
    
    var passwordInput = document.createElement("input");
    this.passwordInput.size = 10;
    this.passwordInput.type = "password";
    this.passwordInput.value = "randomdots";
    this.passwordInput.onkeypress = this._createAccountPasswordKeyPress.bindAsEventListener(this);

    var newAcctButton = document.createElement("input");
    newAcctButton.value = "Create New Account";
    newAcctButton.type = "button";
    newAcctButton.onclick = this._clickOnNewAcctButton.bindAsEventListener(this);
    mySpan.appendChild(welcomeNode);
    mySpan.appendChild(this.usernameInput);
    mySpan.appendChild(document.createTextNode(" "));
    mySpan.appendChild(this.passwordInput);
    mySpan.appendChild(document.createTextNode(" "));
    mySpan.appendChild(newAcctButton);
    this.usernameInput.select();
  }
  else if (currentUser) { 
    // The user is already logged in.
    // Create a line that looks like this:
    //   Hello Jane Doe.  _Sign out_  [Edit]
    
    welcomeText = "Hello " + currentUser.getDisplayName() + ". ";
    welcomeNode = document.createTextNode(welcomeText);
    mySpan.appendChild(welcomeNode);

    var signoutLink = document.createElement("a");
    signoutLink.appendChild(document.createTextNode("Sign out"));
    signoutLink.onclick = this._clickOnSignoutLink.bindAsEventListener(this);
    mySpan.appendChild(signoutLink);

    mySpan.appendChild(document.createTextNode(" "));

    var editButton = document.createElement("input");
    editButton.type = "button";
    editButton.value = (this.isInEditMode()) ? "Done editing" : "Edit";
    editButton.onclick = this._clickOnEditButton.bindAsEventListener(this);
    mySpan.appendChild(editButton);
  }
  else {
    // The user has not yet signed in.
    // Create a line that looks like this:
    //   _Create Account_  or sign in:  _username_  _password_  [Sign in]
    
    var createAcctLink = document.createElement("a");
    createAcctLink.appendChild(document.createTextNode("Create Account"));

    welcomeText = " or sign in: "; 
    welcomeNode = document.createTextNode(welcomeText);
    this.usernameInput = document.createElement("input");
    this.usernameInput.size = 20;
    this.usernameInput.value = "Albert Einstein";
    
    this.passwordInput = document.createElement("input");
    this.passwordInput.size = 10;
    this.passwordInput.type = "password";
    this.passwordInput.value = "randomdots";
    this.passwordInput.onkeypress = this._signinPasswordKeyPress.bindAsEventListener(this);
    this.passwordInput.onfocus = this._signinPasswordFocus.bindAsEventListener(this);

    this._myUsernameSuggestionBox = new SuggestionBox(this.usernameInput, this.getWorld().getUsers(), this.passwordInput);

    var signinButton = document.createElement("input");
    signinButton.value = "Sign in";
    signinButton.type = "button";
    signinButton.onclick = this._clickOnSignInButton.bindAsEventListener(this);
    createAcctLink.onclick = this._clickOnCreateAccountLink.bindAsEventListener(this,signinButton);
    mySpan.appendChild(createAcctLink);
    mySpan.appendChild(welcomeNode);
    mySpan.appendChild(this.usernameInput);
    mySpan.appendChild(document.createTextNode(" "));
    mySpan.appendChild(this.passwordInput);
    mySpan.appendChild(document.createTextNode(" "));
    mySpan.appendChild(signinButton);
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
LoginView.prototype._clickOnSignoutLink = function(inEventObject) {
  if (this.isInEditMode()) {
    this.getRootView().setEditMode(false);
  }
  this._cookie.userUuid = null;
  this._cookie.store();
  this.getWorld().logout();
  this._rebuildView();
};


/**
 * Called when sign in password input field gets focus.
 *
 * @scope    private instance method
 */
LoginView.prototype._signinPasswordFocus = function(inEventObject) {
  this.passwordInput.value = "";
};


/**
 * Called when sign in password input field is typed with keystroke.
 *
 * @scope    private instance method
 */
LoginView.prototype._signinPasswordKeyPress = function(inEventObject) {
  // see if <return> is pressed, if so, similate clicking on sign in button
  if (inEventObject.keyCode == Util.ASCII_VALUE_FOR_RETURN) {
    this._clickOnSignInButton(inEventObject);
  }
};


/**
 * Called when create account password input field is typed with keystroke.
 *
 * @scope    private instance method
 */
LoginView.prototype._createAccountPasswordKeyPress = function(inEventObject) {
  // see if <return> is pressed, if so, similate clicking on sign in button
  if (inEventObject.keyCode == Util.ASCII_VALUE_FOR_RETURN) {
    this._clickOnNewAcctButton(inEventObject);
  }
};


/**
 * Called when the user clicks on the "Create Account" link.
 *
 * @scope    private instance method
 */
LoginView.prototype._clickOnCreateAccountLink = function(inEventObject) {
  this._isCreatingNewAccount = true;
  this._rebuildView();
};

/**
 * Called when the user clicks on the "Create New Account" button.
 *
 * @scope    private instance method
 */
LoginView.prototype._clickOnNewAcctButton = function(inEventObject) {
  var username = this.usernameInput.value;
  var password = this.passwordInput.value;
  if (password === null) {
    password = "";
  }
  this._createNewUser(username, password);
  this._isCreatingNewAccount = false;
  this._rebuildView();
};


/**
 * Called when the user clicks on the "Sign in" button.
 *
 * @scope    private instance method
 */
LoginView.prototype._clickOnSignInButton = function(inEventObject) {

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
 * @param    inEventObject    An event object. 
 */
LoginView.prototype._clickOnEditButton = function (inEventObject) {
  this.getRootView().setEditMode(!this.isInEditMode());
  this._rebuildView();
};


// -------------------------------------------------------------------
// Private helper methods
// -------------------------------------------------------------------

LoginView.prototype._loginUser = function (user, password) {
  var loginSuccess = this.getWorld().login(user, password); 
  if (loginSuccess) {
    var userUuid = user._getUuid();
    this._cookie.userUuid = userUuid;
    this._cookie.password = password;
    this._cookie.store();
    this._rebuildView();
  } else {
    this._reportError("Login failed. Wrong password.");
  }
};


LoginView.prototype._reportError = function (errorStr) {
  var newErrorNode = document.createTextNode(errorStr);
  var mySpan = this.getHTMLElement();
  if (this.errorNode) {
    mySpan.replaceChild(newErrorNode,this.errorNode);
  } else {
    mySpan.appendChild(newErrorNode); 
  }
  this.errorNode = newErrorNode;
};


LoginView.prototype._createNewUser = function (username, password) {
  function isValidUsername(username) {
    // PENDING: hard coded to validate for alphanumeric usernames of 3 or more characters
    if (!username) {return false;}
    return username.search(/\w{3,}/) >= 0;
  }

  if (isValidUsername(username)) {
    var newUser = this.getWorld().newUser(username, password); 
    this._loginUser(newUser,password);
  } else {
    this._reportError("\n Your username must be 3 or more alphanumeric characters!");
  }
};


// -------------------------------------------------------------------
// Suggestion box methods
// -------------------------------------------------------------------
function SuggestionBox(inHTMLInputField, inListOfEntries, inNextHTMLField) {
  this._myInputField = inHTMLInputField;
  this._myListOfEntries = inListOfEntries.sort(SuggestionBox.compareEntryDisplayNames);
  this._myNextField = inNextHTMLField;
  
  this._mySuggestionBoxDivElement = document.createElement('div');
  // this._mySuggestionBoxDivElement.style.visibility = "hidden";
  this._mySuggestionBoxDivElement.style.zIndex = 11;
  this._mySuggestionBoxDivElement.style.display = "none";
  document.body.appendChild(this._mySuggestionBoxDivElement);
  
  this._myInputField.onkeyup = this._keyPressOnInputField.bindAsEventListener(this);
  this._myInputField.onfocus = this._focusOnInputField.bindAsEventListener(this);
  this._myInputField.onblur = this._blurOnInputField.bindAsEventListener(this);
  this._keyPressOnInputField();
}

SuggestionBox.compareEntryDisplayNames = function (inEntryOne, inEntryTwo) {
  var displayNameOne = inEntryOne.getDisplayName();
  var displayNameTwo = inEntryTwo.getDisplayName();
  if (displayNameOne == displayNameTwo) {
    return 0;
  } else {
    return (displayNameOne > displayNameTwo) ?  1 : -1;
  }
};

SuggestionBox.prototype._focusOnInputField = function (inEventObject) {
  this._myInputField.value = "";
  this._redisplaySuggestionBox();
};


SuggestionBox.prototype._keyPressOnInputField = function (inEventObject) {
  this._redisplaySuggestionBox();
};


SuggestionBox.prototype._blurOnInputField = function (inEventObject) {
  // make the suggestion box disappear
  this._mySuggestionBoxDivElement.style.display = "none";
};


SuggestionBox.prototype._clickOnSelection = function (inEventObject, inString) {
  this._myInputField.value = inString;
  this._myNextField.select();
};


SuggestionBox.prototype._redisplaySuggestionBox = function () {
  var partialInputString = this._myInputField.value;
  var listOfMatchingStrings = [];
  var key;
  
  for (key in this._myListOfEntries) {
    var entry = this._myListOfEntries[key];
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
    this._mySuggestionBoxDivElement.style.display = "none";
  } else {
    View.removeChildrenOfElement(this._mySuggestionBoxDivElement);
    var table = document.createElement('table');
    var rowNumber = 0;
    var columnNumber = 0;
    for (key in listOfMatchingStrings) {
      var string = listOfMatchingStrings[key];
      var textNode = document.createTextNode(string);
      var row = table.insertRow(rowNumber);
      var cell = row.insertCell(columnNumber);
      cell.appendChild(textNode);
      cell.onmousedown = this._clickOnSelection.bindAsEventListener(this, string);
      rowNumber += 1;
    }
    this._mySuggestionBoxDivElement.appendChild(table);
    
    // set-up the suggestion box to open just below the input field it comes from
    var suggestionBoxTop = Util.getOffsetTopFromElement(this._myInputField) + this._myInputField.offsetHeight;
    var suggestionBoxLeft = Util.getOffsetLeftFromElement(this._myInputField);
    this._mySuggestionBoxDivElement.style.top = suggestionBoxTop + "px"; 
    this._mySuggestionBoxDivElement.style.left = suggestionBoxLeft + "px";
    // alert(this._myInputField.offsetWidth);
    this._mySuggestionBoxDivElement.style.width = (this._myInputField.offsetWidth - 2)+ "px";
    
    // this._mySuggestionBoxDivElement.style.zIndex = 11;
    this._mySuggestionBoxDivElement.className = "suggestion_box";
    this._mySuggestionBoxDivElement.style.visibility = "visible";
    this._mySuggestionBoxDivElement.style.display = "block";
  }
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
