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
TextView.CSS_CLASS_VALUE_IS_ITEM = "textViewItem";
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
  inElement.style.width =
  inElement.style.height = "100%"; // make this element expand to fill parent element where possible
  this._item = inItem;
  this._attribute = inAttribute;
  this._entry = inEntry;
  this._editField = null;
  this._className = inClassName;
  this._isMultiLine = isMultiLine;
  this._isEditing = false;
  this._proxyOnKeyFunction = null;
  this._alwaysUseEditField = null;
  
  this._isProvisional = inItem.isProvisional();
  if (this._isProvisional) {
    this._provisionalText = inAttribute.getDisplayString();
  }
  else if (inEntry && inEntry.getValue(this._item) instanceof Item) {
    this._valueIsItem = true;
  }
}


/**
 *
 */
TextView.prototype._setupSuggestionBox = function() {
  if (this._suggestions) {
    var suggestionBox = new AttributeSuggestionBox(this._editField, this._suggestions);
    this._suggestionBox = suggestionBox;
    if (this._editField && this._autoWiden) {
      var maxLength = 4;
      for (var i=0; i < this._suggestions.length;++i) {
        var aSuggestion = this._suggestions[i];
        if (aSuggestion.getDisplayString().length > maxLength) {maxLength = aSuggestion.getDisplayString().length;}
      }
      this._editField.size = maxLength;
    }
  }
};

/**
 *
 */
TextView.prototype.alwaysUseEditField = function() {
  this._alwaysUseEditField = true;
  if (this._myHasEverBeenDisplayedFlag) {
    this.startEditing(true);
  }
};

/**
 *
 */
TextView.prototype.setAutoWiden = function(inAutoWiden) {
  this._autoWiden = inAutoWiden;
};

/**
 *
 */
TextView.prototype.setExpectedTypeEntries = function(expectedTypeEntries) {
  Util.assert(Util.isArray(expectedTypeEntries));
  for(var i=0;i < expectedTypeEntries.length; ++i) {
    Util.assert(expectedTypeEntries[i] instanceof Entry);
  }
  this._expectedTypeEntries = expectedTypeEntries;
};


/**
 *
 */
TextView.prototype.setSuggestions = function(suggestionList) {
  if (suggestionList) {Util.assert(Util.isArray(suggestionList));}
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

TextView.prototype._isLozenge = function() {
  return this._valueIsItem && !this._alwaysUseEditField;
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
  else if (this._isLozenge()) {
    htmlElement.className += " " + TextView.CSS_CLASS_VALUE_IS_ITEM;
  }
  this._textNode = document.createTextNode(textString);
  htmlElement.appendChild(this._textNode);
  htmlElement.onclick =  this.onClick.bindAsEventListener(this);
  if (this._alwaysUseEditField) {
    this.startEditing(true);
  }
    
  this._myHasEverBeenDisplayedFlag = true;
};

TextView.prototype._canStartEditing = function() {
  return (!this._isEditing  && !(this._valueIsItem && !this._alwaysUseEditField));
};

/**
 * Switch to edit text field for editing.
 *
 * @scope    public instance method
 */
TextView.prototype.startEditing = function(dontSelect) {
  var canStartEditing = !(this._isEditing || this._isLozenge());
  if (canStartEditing) {
    var editField = this._editField;
    if (!editField) {
      if (this._isMultiLine) {
        editField = this._editField = document.createElement("textarea");
      }
      else {
        editField = this._editField= document.createElement("input");
        editField.type = 'text';
      }
      editField.className = this._className;
      var listener = this; 
      editField.onblur = this.onBlur.bindAsEventListener(this);
      editField.onkeypress = this.onKeyPress.bindAsEventListener(this);
      editField.onkeyup = this.onKeyUp.bindAsEventListener(this);
      editField.onfocus = this.onFocus.bindAsEventListener(this);
      editField.defaultValue = this._isProvisional ? '' : this._textNode.data;
      editField.size = 5; //editField.defaultValue.length+1;
    }
    
    //editField.style.width = this.getHTMLElement().offsetWidth + "px";  
    if (this._isMultiLine) {editField.style.height = (this.getHTMLElement().offsetHeight) + "px";}  
    
    this._setupSuggestionBox();
    this.getHTMLElement().replaceChild(editField, this._textNode);
    if (!dontSelect) {editField.select();}
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
    var stillProvisional = this._isProvisional && !newValue;
    var htmlElement = this.getHTMLElement();


    if (this._suggestionBox) {
      this._suggestionBox._blurOnInputField();
    }
    if (!this._alwaysUseEditField) {
      this._isEditing = false;
      if (stillProvisional) {
        newValue = this._provisionalText;
      }
      var newValueDisplayString = "";
      if (Util.isString(newValue)) {
        newValueDisplayString = newValue;
      }
      else if (newValue instanceof Item) {
        newValueDisplayString = newValue.getDisplayString();
      }
      this._textNode.data = newValueDisplayString;
      this._suggestionBox = null;
      this.getHTMLElement().replaceChild(this._textNode, this._editField);
    }

    // we need this _writeValue() to be after all display related code, because this may trigger an observer call
    if (!stillProvisional) { this._writeValue(newValue); }
  }
};

/**
 * Given a value, this function uses hints form this item's attribute to transform
 * the value to one more suitable for the model. 
 * 
 * For now, all this function does is check to see if expected type of attribute is a 
 * type of category, and if it does not expect a plain text value then transform plain
 * text to a new item belonging to expected category.
 *
 * @scope    private instance method
 * @param    value    The new value to be saved. 
 */
TextView.prototype._transformToExpectedType = function(value) {
if (value && Util.isString(value)) {
    var repository = this.getWorld();
    var listOfExpectedTypeEntries;
    if (this._expectedTypeEntries) {
      listOfExpectedTypeEntries = this._expectedTypeEntries;
    }
    else {
      var attributeCalledExpectedType = repository.getAttributeCalledExpectedType();
      listOfExpectedTypeEntries = this._attribute.getEntriesForAttribute(attributeCalledExpectedType);
    }
    var categoryCalledCategory = repository.getCategoryCalledCategory();
    var typeCalledText = repository.getTypeCalledText();
    var typeCalledDate = repository.getTypeCalledDate();
    var typeCalledNumber = repository.getTypeCalledNumber();
    if (listOfExpectedTypeEntries) {
      for (i=0; i<listOfExpectedTypeEntries.length; ++i) {
        var aType = listOfExpectedTypeEntries[i].getValue();
        switch (aType) {
          case typeCalledText:
            return value;
          case typeCalledNumber:
            var floatVal = parseFloat(value);
            if (floatVal != NaN) {return floatVal;}
            break;
          case typeCalledDate:
            var dateVal = Date.parse(value);
            if (!isNaN(dateVal)) {return new Date(value);}
            break;
          default:
            if (aType.isInCategory(categoryCalledCategory)) {
              value = repository.newItem(value);
              value.assignToCategory(aType);
              if (this._suggestions) {
                // add new item to suggestion list if list is present
                // PENDING: should this be using an observer instead?
                Util.addObjectToSet(value, this._suggestions);
              }
              return value;
            }
            break;
        }
      }
    }
  }
  return value;
};
/**
 * Writes edited value back into item entry of repository.
 *
 * @scope    private instance method
 * @param    value    The new value to be saved. 
 */
TextView.prototype._writeValue = function(value) {
  if (value === 0 || value) {
    this.getWorld().beginTransaction();
    value = this._transformToExpectedType(value);

    var oldValue = null;
    if (this._entry) {oldValue = this._entry.getValue();}
    if (oldValue != value) {
      var attributeCalledInverseAttribute = this.getWorld().getAttributeCalledInverseAttribute();
      var listOfInverseAttributeEntries = this._attribute.getEntriesForAttribute(attributeCalledInverseAttribute);
      if (listOfInverseAttributeEntries.length > 0) {
        var inverseAttr = listOfInverseAttributeEntries[0].getValue();
        this._entry = this._item.replaceEntryWithConnection(this._entry, this._attribute, value, inverseAttr);
      }
      else {
        this._entry = this._item.replaceEntryWithEntryForAttribute(this._entry, this._attribute, value);
      }
      var superview = this.getSuperview();
      if (superview._provisionalItemJustBecomeReal) {
        superview._provisionalItemJustBecomeReal(this._item);
      }
      if (value instanceof Item) {
        this._valueIsItem = true;
        var htmlElement = this.getHTMLElement();
        if (this._isLozenge() && !htmlElement.className.match(TextView.CSS_CLASS_VALUE_IS_ITEM)) {
          htmlElement.className += " " + TextView.CSS_CLASS_VALUE_IS_ITEM;
        }
      }
    }    
    this.getWorld().endTransaction();
  }
  this._restoreText(true); // call restore text in case item is transformed (e.g. Dates will be normalized)
};


/**
 * Returns text string for TextView to be displaying and editing
 *
 * @scope    private instance method
 */
TextView.prototype._getText = function() {
  if (this._isProvisional) {return this._provisionalText;}
  if (this._entry) {return this._item.getDisplayStringForEntry(this._entry);}
  return '';
};


/**
 * Restores the original text before this editing session
 *
 * @scope    private instance method
 */
TextView.prototype._restoreText = function(dontSelect) {
  var oldText = (this._entry) ?  this._getText() : '';
  if (this._isEditing) {
    this._editField.value = oldText;
  }
  else {
    this._textNode.data = oldText;
  }
  if (!dontSelect) {this._editField.select();}
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
    this._suggestionBox._keyUpOnInputField(inEventObject);
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
  if (this._suggestionBox && this._suggestionBox._keyPressOnInputField(inEventObject)) {
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
  if (this._isMultiLine && (editField.scrollHeight > editField.clientHeight)) {
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
  this._shouldHide = inHTMLInputField.value.length === 0;
  
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
  if (!this._selectedItem) {
    // check if typed item is identical to suggested item
    var editValue = this._myInputField.value;
    for (var i = 0; i < this._listOfSuggestedItems.length; ++i) {
      var item = this._listOfSuggestedItems[i];
      if (editValue.toLowerCase() == item.getDisplayName().toLowerCase()) {return item;}
    }
  }
  return this._selectedItem;
};


/**
 *
 */
AttributeSuggestionBox._compareItemDisplayNames = function (itemOne, itemTwo) {
  var displayNameOne = itemOne.getDisplayString();
  var displayNameTwo = itemTwo.getDisplayString();
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
  var numberOfMatchingItems = this._listOfMatchingItems.length;
  if (numberOfMatchingItems === 0) {return false;}

  var asciiValueOfKey = inEventObject.keyCode;
  var index = -1;
  var doSelectItem = false;
  switch (asciiValueOfKey) {
    case Util.ASCII_VALUE_FOR_DOWN_ARROW:
      if (this._selectedItem) {
        index = (Util.getArrayIndex(this._listOfMatchingItems, this._selectedItem)+1) % numberOfMatchingItems;
      }
      else {
        index = 0;
      }
      break;
    case Util.ASCII_VALUE_FOR_UP_ARROW:
      if (this._selectedItem) {
        index = Util.getArrayIndex(this._listOfMatchingItems, this._selectedItem)-1;
        if (index < 0) {index = numberOfMatchingItems-1;}
      }
      else {
        index = numberOfMatchingItems-1;
      }
      break;
      case Util.ASCII_VALUE_FOR_TAB:
      if (this._myInputField.value.length === 0) {return false;}
      if (!this._selectedItem) {
        this._selectedItem = this._listOfMatchingItems[0];
        doSelectItem = true;
      }
      break;
    case Util.ASCII_VALUE_FOR_RETURN:
      if (this._selectedItem) {doSelectItem = true;}
      break;
    case Util.ASCII_VALUE_FOR_LEFT_ARROW:
    case Util.ASCII_VALUE_FOR_RIGHT_ARROW:
      // if left or right arrow keys, then hide suggestion box
      this._setShouldHide(true);
      return false;
    default:
      // show suggestion box if not already shown, then let editField process keystroke
      this._setShouldHide(false);
      return false;
  }
  if (index != -1) {
    this._setShouldHide(false);
    this._selectedItem = this._listOfMatchingItems[index];
    this._redisplayAttributeSuggestionBox();
    return true;
  }
  if (doSelectItem) {
    this._myInputField.value = this._selectedItem.getDisplayString();
    this._setShouldHide(true);
  }
  return false;
};


/**
 *
 */
AttributeSuggestionBox.prototype._keyUpOnInputField = function (inEventObject) {
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
};


/**
 *
 */
AttributeSuggestionBox.prototype._setShouldHide = function (shouldHide) {
  // make the suggestion box disappear
  this._shouldHide = shouldHide;
  this._selectedItem = null;
  if (shouldHide) {
    this._myAttributeSuggestionBoxDivElement.style.display = "none";
  }
  else {
    this._redisplayAttributeSuggestionBox();
  }
};



/**
 *
 */
AttributeSuggestionBox.prototype._redisplayAttributeSuggestionBox = function () {
  //if (this._shouldHide) {return;} // if SuggestionBox is in hide mode, don't show the box
  
  var partialInputString = this._myInputField.value;
  var listOfMatchingItems = [];
  var key;
  var item;

  for (key in this._listOfSuggestedItems) {
    item = this._listOfSuggestedItems[key];
    var lowerCaseEntryString = item.getDisplayString().toLowerCase();
    var lowerCaseInputString = partialInputString.toLowerCase();
    var numberOfCharactersToCompare = lowerCaseInputString.length;
    var shortEntryString = lowerCaseEntryString.substring(0, numberOfCharactersToCompare);
    if (shortEntryString == lowerCaseInputString) {
      // we have a match!
      listOfMatchingItems.push(item);
    }
  }
  this._listOfMatchingItems = listOfMatchingItems;

  if (this._shouldHide || listOfMatchingItems.length === 0) {
    // make the suggestion box disappear
    this._myAttributeSuggestionBoxDivElement.style.display = "none";
  } else {
    this._myAttributeSuggestionBoxDivElement.innerHTML = "";
    var table = document.createElement('table');
    var rowNumber = 0;
    var columnNumber = 0;
    for (key in listOfMatchingItems) {
      item = listOfMatchingItems[key];
      var textNode = document.createTextNode(item.getDisplayString());
      var row = table.insertRow(rowNumber);
      var cell = row.insertCell(columnNumber);
      row.className = (this._selectedItem == item) ? "selected":"";
      //cell.style.background = (this._selectedItem == item) ? "rgb(0%,70%,100%)":""; //pending need to CSS-ify this
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