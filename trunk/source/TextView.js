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
function TextView(theSuperview, theElement, theItem, theAttribute, theClassType, isMultiLine) {
  Util.assert(theItem instanceof Item);
  //Util.assert(theAttribute instanceof Attribute); PENDING need to check that attribute is an attribute
  
  this.setSuperview(theSuperview);
  this.setHTMLElement(theElement);
  this._item = theItem;
  this._attribute = theAttribute;
  this._editField = null;
  this._classType = theClassType;
  this._isMultiLine = isMultiLine;
  this._isEditing = false;
  this._proxyOnKeyFunction = null;
  
  this._isProvisional = this._item.isProvisional();
  if (this._isProvisional) {this._provisionalText = this._attribute.getDisplayName();}
  
}


TextView.prototype._setupSuggestionBox = function() {
  if (this._suggestions) {
    var suggestionBox = new AttributeSuggestionBox(this._editField, this._suggestions);
    this._suggestionBox = suggestionBox;
  }
};

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
  //   this.textNode.data = newText;
  // }
  }
};


/**
 * Re-creates all the HTML for the TextView, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    public instance method
 */
TextView.prototype._buildView = function() {
  var htmlElement = this.getHTMLElement();
  htmlElement.innerHTML = '';
  
  var textString = this._isProvisional ? this._provisionalText :
    this._item.getSingleStringValueFromAttribute(this._attribute);
  // PENDING: need to deal with multi valued attrs
  // for (var i in textList) {
  //   textString = textList[i] + "\n" + textString;
  // };
  
  if (this._isProvisional) {
    this._oldColor = htmlElement.style.color;
    htmlElement.style.color = TextView.PROVISIONAL_COLOR;
  }
  this.textNode = document.createTextNode(textString);
  htmlElement.appendChild(this.textNode);

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
      editField.className = this._classType;
      var listener = this; 
      editField.onblur = this.onBlur.bindAsEventListener(this);
      editField.onkeypress = this.onKeyPress.bindAsEventListener(this);
      editField.onkeyup = this.onKeyUp.bindAsEventListener(this);
      editField.onfocus = this.onFocus.bindAsEventListener(this);
      editField.defaultValue = this._isProvisional ? '' : this.textNode.data;
    }
    editField.style.width = this.getHTMLElement().offsetWidth + "px";    
    editField.style.height = (this.getHTMLElement().offsetHeight) + "px";
    
    this._setupSuggestionBox();
    this.getHTMLElement().replaceChild(editField, this.textNode);
    editField.select();
    //editField.focus();
    this._isEditing = true;
  }
};


// -------------------------------------------------------------------
// Event handler methods
// -------------------------------------------------------------------

/**
 * Called when the user clicks on the text.
 *
 * Handles the mouse click event on text view. Called by listener.
 *
 * @scope    public instance method
 * @param    inEventObject    An event object. 
 */
TextView.prototype.onClick = function(inEventObject) {
  if (this.isInEditMode()) {
    this.startEditing();
  }
};

TextView.prototype.onFocus = function(inEventObject) {
  if (this._suggestionBox) {this._suggestionBox._focusOnInputField(inEventObject);}
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
 * Called when it's time to stop editing and save the changes.
 *
 * @scope    public instance method
 */
TextView.prototype.stopEditing = function() {
  if (this._isEditing) {
    var newText = this._editField.value;
    var stillProvisional = this._isProvisional && newText === '';
    var htmlElement = this.getHTMLElement();
    
    this._isEditing = false;
  
    if (this._suggestionBox) {this._suggestionBox._blurOnInputField();}
    if (stillProvisional) {
      newText = this._provisionalText;
    }
    this.textNode.data = newText;
    this._suggestionBox = null;
    this.getHTMLElement().replaceChild(this.textNode, this._editField);
    
    // we need this block to be after all display related code, because this may trigger an observer call
    if (!stillProvisional) {
      // write out new entry for attribute
      // PENDING: need to properly handle multi-valued attributes
      var listOfEntries = this._item.getEntriesForAttribute(this._attribute);
      if (listOfEntries && listOfEntries[0]) {
        var oldEntry = listOfEntries[0];
        this._item.replaceEntry(oldEntry, newText);
      } else {
        if (newText) {
          this._item.addEntryForAttribute(this._attribute, newText);
        }
      }
    }
  }
};


/**
 * Sets a function to be used when onkeypress is called to the TextView
 *
 * @scope    public instance method
 * @param    inEventObject    An event object. 
 */
TextView.prototype.setKeyPressFunction = function(keyPressFunction) {
  this._keyPressFunction = keyPressFunction;
};

TextView.prototype.onKeyUp = function(inEventObject) {
  if (this._suggestionBox) {this._suggestionBox._keyPressOnInputField(inEventObject);}
};

/**
 * Called when the user types in editField
 *
 * @scope    public instance method
 * @param    inEventObject    An event object. 
 */
TextView.prototype.onKeyPress = function(inEventObject) {
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

TextView.prototype.noLongerProvisional = function() {
  if (this._isProvisional) {
    this._isProvisional = false;
    this.getHTMLElement().style.color = this._oldColor;
    this._buildView();
  }
};

// -------------------------------------------------------------------
// Suggestion box methods
// -------------------------------------------------------------------
function AttributeSuggestionBox(inHTMLInputField, inListOfEntries) {
  this._myInputField = inHTMLInputField;
  this._myListOfEntries = inListOfEntries.sort(AttributeSuggestionBox.compareEntryDisplayNames);

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

AttributeSuggestionBox.compareEntryDisplayNames = function (inEntryOne, inEntryTwo) {
  var displayNameOne = inEntryOne.getDisplayString();
  var displayNameTwo = inEntryTwo.getDisplayString();
  if (displayNameOne == displayNameTwo) {
    return 0;
  } else {
    return (displayNameOne > displayNameTwo) ?  1 : -1;
  }
};

AttributeSuggestionBox.prototype._focusOnInputField = function (inEventObject) {
  //this._myInputField.value = "";
  this._redisplayAttributeSuggestionBox();
};


AttributeSuggestionBox.prototype._keyPressOnInputField = function (inEventObject) {
  this._redisplayAttributeSuggestionBox();
};


AttributeSuggestionBox.prototype._blurOnInputField = function () {
  // make the suggestion box disappear
  this._myAttributeSuggestionBoxDivElement.style.display = "none";
};


AttributeSuggestionBox.prototype._clickOnSelection = function (inEventObject, inString) {
  this._myInputField.value = inString;
};


AttributeSuggestionBox.prototype._redisplayAttributeSuggestionBox = function () {
  var partialInputString = this._myInputField.value;
  var listOfMatchingStrings = [];
  var key;

  for (key in this._myListOfEntries) {
    var entry = this._myListOfEntries[key];
    var lowerCaseEntryString = entry.getDisplayString().toLowerCase();
    var lowerCaseInputString = partialInputString.toLowerCase();
    var numberOfCharactersToCompare = lowerCaseInputString.length;
    var shortEntryString = lowerCaseEntryString.substring(0, numberOfCharactersToCompare);
    if (shortEntryString == lowerCaseInputString) {
      // we have a match!
      listOfMatchingStrings.push(entry.getDisplayString());
    }
  }

  if (listOfMatchingStrings.length === 0) {
    // make the suggestion box disappear
    this._myAttributeSuggestionBoxDivElement.style.display = "none";
  } else {
    this._myAttributeSuggestionBoxDivElement.innerHTML = "";
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