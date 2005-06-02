/*****************************************************************************
 TextView.js
 
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
//   repository.js
//   util.js
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// TextView public class constants
// -------------------------------------------------------------------
TextView.ELEMENT_CLASS_TEXT_BLOCK = "text_block"; 
TextView.PROVISIONAL_COLOR = '#999999';


/**
 * An instance of TextView can be placed in any parent container View
 * to display and (if in edit mode) edit multi-lines of text
 *
 * @scope    public instance constructor
 * @extends  View
 * @param    theSuperview    The view that this view is nested in. 
 * @param    theItem         The Item to be displayed and edited by this view. 
 * @param    theAttribute    The attribute of the item to be displayed.
 * @param    theElement      The HTMLElement to display the HTML in. 
 * @param    theClassType    A string that gives a class name to assign to the HTML element. 
 * @param    isMultiLine     a boolean indicating if text view is single line or multi-line
 */
TextView.prototype = new View();  // makes TextView be a subclass of View
function TextView(theSuperview, inElement, inItem, inAttribute, inEntry, inClassName, isMultiLine) {
  Util.assert((!inEntry) || inEntry instanceof Entry);
  Util.assert(inItem instanceof Item);
  Util.assert(inAttribute instanceof Item);
  //Util.assert(theAttribute instanceof Attribute); PENDING need to check that attribute is an attribute
  
  this.setSuperview(theSuperview);
  this.setHTMLElement(inElement);
  inElement.style.width = inElement.style.height = "100%"; // make this element expand to fill parent element where possible
  this._item = inItem;
  this._attribute = inAttribute;
  this._entry = inEntry;
  this._editField = null;
  this._className = inClassName;
  this._isMultiLine = isMultiLine;
  this._isEditing = false;
  this._proxyOnKeyFunction = null;
  
  this._isProvisional = inItem.isProvisional();
  if (this._isProvisional) {
    this._provisionalText = inAttribute.getDisplayName();
  }
}


/**
 *
 */
TextView.prototype._setupSuggestionBox = function() {
  if (this._suggestions) {
    var suggestionBox = new AttributeSuggestionBox(this._editField, this._suggestions);
    this._suggestionBox = suggestionBox;
  }
};


/**
 *
 */
TextView.prototype.setSuggestions = function(suggestionList) {
  this._suggestions = suggestionList;
};


/**
 * Updates the HTML elements in this view to reflect any changes in 
 * the item's attribute values.
 *
 * @scope    public instance method
 */
TextView.prototype.refresh = function() {
  if (!this._myHasEverBeenDisplayedFlag) {
    this._buildView();
  } else {
  // if (weHaveBeenNotifiedOfChangesTo(this._item)) {
  //   var newText = getNewValueFrom(this._item);
  //   this._textNode.data = newText;
  // }
  }
};


/**
 * Re-creates all the HTML for the TextView, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    private instance method
 */
TextView.prototype._buildView = function() {
  var htmlElement = this.getHTMLElement();
  htmlElement.innerHTML = '';
  
  var textString = this._getText();
  
  if (this._isProvisional) {
    this._oldColor = htmlElement.style.color;
    htmlElement.style.color = TextView.PROVISIONAL_COLOR;
  }
  this._textNode = document.createTextNode(textString);
  htmlElement.appendChild(this._textNode);

  htmlElement.onclick =  this.onClick.bindAsEventListener(this);
    
  this._myHasEverBeenDisplayedFlag = true;
};


/**
 * Switch to edit text field for editing.
 *
 * @scope    public instance method
 */
TextView.prototype.startEditing = function() {
  if (!this._isEditing) {
    var editField = this._editField;
    if (!editField) {
      if (this._isMultiLine) {
        editField = this._editField = document.createElement("textarea");
      }
      else {
        editField = document.createElement("input");
        editField.type = 'text';
      }
      this._editField = editField;
      editField.className = this._className;
      var listener = this; 
      editField.onblur = this.onBlur.bindAsEventListener(this);
      editField.onkeypress = this.onKeyPress.bindAsEventListener(this);
      editField.onkeyup = this.onKeyUp.bindAsEventListener(this);
      editField.onfocus = this.onFocus.bindAsEventListener(this);
      editField.defaultValue = this._isProvisional ? '' : this._textNode.data;
    }
    //editField.style.width = this.getHTMLElement().offsetWidth + "px";    
    //editField.style.height = (this.getHTMLElement().offsetHeight) + "px";
    
    this._setupSuggestionBox();
    this.getHTMLElement().replaceChild(editField, this._textNode);
    editField.select();
    //editField.focus();
    this._isEditing = true;
  }
};


/**
 * Called when it's time to stop editing and save the changes.
 *
 * @scope    public instance method
 */
TextView.prototype.stopEditing = function() {
  if (this._isEditing) {
    var newValue;
    if (this._suggestionBox) {
      newValue = this._suggestionBox.getSelectedItem();
    }
    if (!newValue) {
      newValue = this._editField.value;
    }
    var newText = this._editField.value;
    var stillProvisional = this._isProvisional && !newValue;
    var htmlElement = this.getHTMLElement();

    this._isEditing = false;

    if (this._suggestionBox) {
      this._suggestionBox._blurOnInputField();
    }
    if (stillProvisional) {
      newValue = this._provisionalText;
    }
    var newValueDisplayString = "";
    if (Util.isString(newValue)) {
      newValueDisplayString = newValue;
    }
    if (newValue instanceof Item) {
      newValueDisplayString = newValue.getDisplayName();
    }
    this._textNode.data = newValueDisplayString;
    this._suggestionBox = null;
    this.getHTMLElement().replaceChild(this._textNode, this._editField);

    // we need this _writeValue() to be after all display related code, because this may trigger an observer call
    if (!stillProvisional) { this._writeValue(newValue); }
  }
};


/**
 * Writes edited value back into item entry of repository.
 *
 * @scope    private instance method
 * @param    value    The new value to be saved. 
 */
TextView.prototype._writeValue = function(value) {
  if (this._entry) {
    var oldValue = this._entry.getValue();
    if (oldValue != value) {
      this._entry = this._item.replaceEntry(this._entry, value);
    }
  } else if (value) {
    this._entry = this._item.addEntryForAttribute(this._attribute, value);
  }
};


/**
 * Returns text string for TextView to be displaying and editing
 *
 * @scope    private instance method
 */
TextView.prototype._getText = function() {
  if (this._isProvisional) {return this._provisionalText;}
  if (this._entry) {return this._entry.getDisplayString();}
  return '';
};


/**
 * Restores the original text before this editing session
 *
 * @scope    private instance method
 */
TextView.prototype._restoreText = function() {
  Util.assert(this._isEditing);
  var oldText = (this._entry) ?  this._entry.getDisplayString() : '';
  this._editField.value = oldText;
  this._editField.select();
};


// -------------------------------------------------------------------
// Event handler methods
// -------------------------------------------------------------------

/**
 * Sets a function to be used when onclick is called to the TextView
 *
 * @scope    public instance method
 * @param    inEventObject    An event object. 
 */
TextView.prototype.setClickFunction = function(inClickFunction) {
  Util.assert(inClickFunction instanceof Function);
  this._clickFunction = inClickFunction;
};


/**
 * Called when the user clicks on the text.
 *
 * Handles the mouse click event on text view. Called by listener.
 *
 * @scope    public instance method
 * @param    inEventObject    An event object. 
 */
TextView.prototype.onClick = function(inEventObject) {
  if (this._clickFunction && this._clickFunction(inEventObject, this)) {
    return true;
  }
  if (this.isInEditMode()) {
    this.startEditing();
  }
};


/**
 *
 */
TextView.prototype.onFocus = function(inEventObject) {
  if (this._suggestionBox) {
    this._suggestionBox._focusOnInputField(inEventObject);
  }
};


/**
 * Called when focus leaves the text view.
 *
 * Handles loss of focus for text view. Called by listener. Switches back 
 * to static text from editable text.
 *
 * @scope    public instance method
 * @param    inEventObject    An event object. 
 */
TextView.prototype.onBlur = function(inEventObject) {
  this.stopEditing();
};


/**
 * Sets a function to be used when onkeypress is called to the TextView
 *
 * @scope    public instance method
 * @param    keyPressFunction    A function. 
 */
TextView.prototype.setKeyPressFunction = function(keyPressFunction) {
  this._keyPressFunction = keyPressFunction;
};


/**
 *
 */
TextView.prototype.onKeyUp = function(inEventObject) {
  if (this._suggestionBox) {
    this._suggestionBox._keyPressOnInputField(inEventObject);
  }
};


/**
 * Called when the user types in editField
 *
 * @scope    public instance method
 * @param    inEventObject    An event object. 
 */
TextView.prototype.onKeyPress = function(inEventObject) {
  if (inEventObject.keyCode == Util.ASCII_VALUE_FOR_ESCAPE) {
    this._restoreText();
    return true;
  }
  if (this._keyPressFunction && this._keyPressFunction(inEventObject, this)) {
    return true;
  }
  var editField = this._editField;

  // PENDING: 
  // Here are some failed attempts at trying to get the editField to 
  // automatically grow taller as the user types more text into it.
  // The idea was to avoid having the editField ever show its scroll 
  // bar. The user shouldn't feel like they're filling in a form; 
  // they should feel like they're typing a paragraph in a word
  // processor, and the paragraph grows naturally as they type, 
  // with all the paragraphs beneath it getting pushed down the page.
  
  // ATTEMPT #0: 
  // Display diagnostic info...
  // Initially editField.scrollHeight and editField.clientHeight are equal.  
  // As you type scrollHeight grows. editField.rows is always -1.
  /*
  RootView.displayStatusBlurb("editField.scrollHeight: " + editField.scrollHeight + ", " +
    "editField.clientHeight: " + editField.clientHeight + ", " +
    "editField.rows: " + editField.rows);
  */

  // ATTEMPT #1: 
  // causes infinite loop -- adding rows doesn't change editField.clientHeight
  /*
  while (editField.scrollHeight > editField.clientHeight) {
    editField.rows += 1;
  }
  */

  // ATTEMPT #2: 
  // slightly clunky, but better than nothing!
  if (editField.scrollHeight > editField.clientHeight) {
    editField.style.height = editField.scrollHeight + "px";
  }

  // ATTEMPT #3: has no impact
  /*
  if (editField.scrollHeight > editField.clientHeight) {
    editField.clientHeight = editField.scrollHeight;
  }
  */
};


/**
 *
 */
TextView.prototype.noLongerProvisional = function() {
  if (this._isProvisional) {
    this._isProvisional = false;
    this.getHTMLElement().style.color = this._oldColor;
    // need to set line below because _writeValue() hasn't returned an entry yet
    this._entry = this._item.getSingleEntryFromAttribute(this._attribute); 
    this._buildView();
  }
};

// -------------------------------------------------------------------
// Suggestion box methods
// -------------------------------------------------------------------

/**
 *
 */
function AttributeSuggestionBox(inHTMLInputField, listOfItems) {
  this._myInputField = inHTMLInputField;
  this._listOfSuggestedItems = listOfItems.sort(AttributeSuggestionBox._compareItemDisplayNames);
  this._selectedItem = null;
  
  this._myAttributeSuggestionBoxDivElement = document.createElement('div');
  // this._myAttributeSuggestionBoxDivElement.style.visibility = "hidden";
  this._myAttributeSuggestionBoxDivElement.style.zIndex = 11;
  this._myAttributeSuggestionBoxDivElement.style.display = "none";
  document.body.appendChild(this._myAttributeSuggestionBoxDivElement);

 /* this._myInputField.onkeyup = this._keyPressOnInputField.bindAsEventListener(this);
  this._myInputField.onfocus = this._focusOnInputField.bindAsEventListener(this);
  this._myInputField.onblur = this._blurOnInputField.bindAsEventListener(this); */
  //this._keyPressOnInputField();
}


/**
 *
 */
AttributeSuggestionBox.prototype.getSelectedItem = function () {
  return this._selectedItem;
};


/**
 *
 */
AttributeSuggestionBox._compareItemDisplayNames = function (itemOne, itemTwo) {
  var displayNameOne = itemOne.getDisplayName();
  var displayNameTwo = itemTwo.getDisplayName();
  if (displayNameOne == displayNameTwo) {
    return 0;
  } else {
    return (displayNameOne > displayNameTwo) ?  1 : -1;
  }
};


/**
 *
 */
AttributeSuggestionBox.prototype._focusOnInputField = function (inEventObject) {
  //this._myInputField.value = "";
  this._redisplayAttributeSuggestionBox();
};


/**
 *
 */
AttributeSuggestionBox.prototype._keyPressOnInputField = function (inEventObject) {
  this._redisplayAttributeSuggestionBox();
};


/**
 *
 */
AttributeSuggestionBox.prototype._blurOnInputField = function () {
  // make the suggestion box disappear
  this._myAttributeSuggestionBoxDivElement.style.display = "none";
};


/**
 *
 */
AttributeSuggestionBox.prototype._clickOnSelection = function (inEventObject, item) {
  this._selectedItem = item;
  this._myInputField.value = item.getDisplayName();  // PENDING: need to pass back the item, not a string
};


/**
 *
 */
AttributeSuggestionBox.prototype._redisplayAttributeSuggestionBox = function () {
  var partialInputString = this._myInputField.value;
  var listOfMatchingItems = [];
  var key;
  var item;

  for (key in this._listOfSuggestedItems) {
    item = this._listOfSuggestedItems[key];
    var lowerCaseEntryString = item.getDisplayName().toLowerCase();
    var lowerCaseInputString = partialInputString.toLowerCase();
    var numberOfCharactersToCompare = lowerCaseInputString.length;
    var shortEntryString = lowerCaseEntryString.substring(0, numberOfCharactersToCompare);
    if (shortEntryString == lowerCaseInputString) {
      // we have a match!
      listOfMatchingItems.push(item);
    }
  }

  if (listOfMatchingItems.length === 0) {
    // make the suggestion box disappear
    this._myAttributeSuggestionBoxDivElement.style.display = "none";
  } else {
    this._myAttributeSuggestionBoxDivElement.innerHTML = "";
    var table = document.createElement('table');
    var rowNumber = 0;
    var columnNumber = 0;
    for (key in listOfMatchingItems) {
      item = listOfMatchingItems[key];
      var textNode = document.createTextNode(item.getDisplayName());
      var row = table.insertRow(rowNumber);
      var cell = row.insertCell(columnNumber);
      cell.appendChild(textNode);
      cell.onmousedown = this._clickOnSelection.bindAsEventListener(this, item);
      rowNumber += 1;
    }
    this._myAttributeSuggestionBoxDivElement.appendChild(table);

    // set-up the suggestion box to open just below the input field it comes from
    var AttributeSuggestionBoxTop = Util.getOffsetTopFromElement(this._myInputField) + this._myInputField.offsetHeight;
    var AttributeSuggestionBoxLeft = Util.getOffsetLeftFromElement(this._myInputField);
    this._myAttributeSuggestionBoxDivElement.style.top = AttributeSuggestionBoxTop + "px"; 
    this._myAttributeSuggestionBoxDivElement.style.left = AttributeSuggestionBoxLeft + "px";
    // alert(this._myInputField.offsetWidth);
    this._myAttributeSuggestionBoxDivElement.style.width = (this._myInputField.offsetWidth - 2)+ "px";

    // this._myAttributeSuggestionBoxDivElement.style.zIndex = 11;
    this._myAttributeSuggestionBoxDivElement.className = "suggestion_box";
    this._myAttributeSuggestionBoxDivElement.style.visibility = "visible";
    this._myAttributeSuggestionBoxDivElement.style.display = "block";
  }
};

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------