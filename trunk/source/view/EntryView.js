/*****************************************************************************
 EntryView.js
 
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
/*global Item, Entry  */
/*global SuggestionBox  */
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// EntryView public class constants
// -------------------------------------------------------------------
EntryView.CSS_CLASS_SELECTED         = "ItemValueSelected";
EntryView.CSS_CLASS_PROVISIONAL      = "provisional";

EntryView.CSS_CLASS_TEXT_VALUE       = "TextValue";
EntryView.CSS_CLASS_NUMBER_VALUE     = "NumberValue";
EntryView.CSS_CLASS_DATE_VALUE       = "DateValue";
EntryView.CSS_CLASS_CHECKMARK_VALUE  = "CheckmarkValue";
EntryView.CSS_CLASS_URL_VALUE        = "UrlValue";
EntryView.CSS_CLASS_ITEM_VALUE       = "ItemValue";
EntryView.CSS_CLASS_CONNECTION_VALUE = "ConnectionValue";

EntryView.CSS_CLASS_NEGATIVE_NUMBER  = "NegativeNumber";


// -------------------------------------------------------------------
// EntryView private class variables
// -------------------------------------------------------------------
EntryView._ourHashTableOfTypesKeyedByClassName = null;


/**
 * An instance of EntryView can be placed in any parent container View
 * to display and (if in edit mode) edit multi-lines of text
 *
 * @scope    public instance constructor
 * @extends  View
 * @param    superview    The view that this view is nested in. 
 * @param    htmlElement      The HTMLElement to display the HTML in. 
 * @param    item         The Item to be displayed and edited by this view. 
 * @param    attribute    The attribute of the item to be displayed.
 * @param    entry    The entry that this EntryView displays. 
 * @param    isMultiLine     a boolean indicating if text view is single line or multi-line
 */
EntryView.prototype = new View();  // makes EntryView be a subclass of View
function EntryView(superview, htmlElement, item, attribute, entry, isMultiLine) {
  Util.assert((!entry) || entry instanceof Entry);
  Util.assert(item instanceof Item);
  Util.assert(attribute instanceof Item); // PENDING need to check that attribute is an attribute
  
  View.call(this, superview, htmlElement, "EntryView");

  this._item = item;
  this._attribute = attribute;
  this._entry = entry;
  
  this._editField = null;
  this._textNode = null;
  this._textSpan = null;
  
  this._isMultiLine = isMultiLine;
  this._isEditing = false;
  this._proxyOnKeyFunction = null;
  this._alwaysUseEditField = null;
  
  this._isProvisional = item.isProvisional();
  if (this._isProvisional) {
    this._provisionalText = attribute.getDisplayString();
  }
  else if (entry && entry.getValue(this._item) instanceof Item) {
    this._valueIsItem = true;
  }
}


/**
 *
 */
EntryView.prototype._setupSuggestionBox = function() {
  var listOfSuggestions = this._suggestions || this.getWorld().getSuggestedItemsForAttribute(this._attribute);
  if (listOfSuggestions && listOfSuggestions.length > 0) {
    var suggestionBox = new SuggestionBox(this._editField, listOfSuggestions);
    this._suggestionBox = suggestionBox;
    if (this._editField && this._autoWiden) {
      var maxLength = 4;
      for (var i=0; i < listOfSuggestions.length;++i) {
        var aSuggestion = listOfSuggestions[i];
        if (aSuggestion.getDisplayString().length > maxLength) {maxLength = aSuggestion.getDisplayString().length;}
      }
      this._editField.size = maxLength;
    }
  }
};


/**
 *
 */
EntryView.prototype.alwaysUseEditField = function() {
  this._alwaysUseEditField = true;
  if (this._myHasEverBeenDisplayedFlag) {
    this.startEditing(true);
  }
};


/**
 *
 */
EntryView.prototype.setAutoWiden = function(autoWiden) {
  this._autoWiden = autoWiden;
};


/**
 *
 */
EntryView.prototype.setExpectedTypeEntries = function(expectedTypeEntries) {
  Util.assert(Util.isArray(expectedTypeEntries));
  for (var key in expectedTypeEntries) {
    Util.assert(expectedTypeEntries[key] instanceof Entry);
  }
  this._expectedTypeEntries = expectedTypeEntries;
};


/**
 *
 */
EntryView.prototype.setSuggestions = function(listOfSuggestions) {
  if (listOfSuggestions) {Util.assert(Util.isArray(listOfSuggestions));}
  this._suggestions = listOfSuggestions;
};


/**
 * Updates the HTML elements in this view to reflect any changes in 
 * the item's attribute values.
 *
 * @scope    public instance method
*/
EntryView.prototype.refresh = function() {
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
 *
 */
EntryView.prototype._isLozenge = function() {
  return this._valueIsItem && !this._alwaysUseEditField;
};


/**
 * Re-creates all the HTML for the EntryView, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    private instance method
 */
EntryView.prototype._buildView = function() {
  var htmlElement = this.getHtmlElement();
  View.removeChildrenOfElement(htmlElement);
  
  var textString = this._getText();
  var className = (this._isProvisional ? EntryView.CSS_CLASS_PROVISIONAL : '');
  this._textSpan = View.appendNewElement(htmlElement, "span", className, null);
  this._textNode = View.appendNewTextNode(this._textSpan, textString);
  // if (this._isProvisional) {
  //   this._textSpan.className = EntryView.CSS_CLASS_PROVISIONAL;
  // }
  // else if (!this._alwaysUseEditField) {
  //   this._setClassName();
  // }
  if (!this._isProvisional && !this._alwaysUseEditField) {
    this._setClassName();
  }
  
  htmlElement.onclick = this.onClick.bindAsEventListener(this);
  if (this._alwaysUseEditField) {
    this.startEditing(true);
  }
    
  this._myHasEverBeenDisplayedFlag = true;
};


/**
 *
 */
EntryView.prototype._setClassName = function() {
  if (this._entry) {
    var dataType = this._entry.getType();
    var className = this._getClassNameFromType(dataType);
    this._textSpan.className = className;
    
    var typeNumber = this.getWorld().getItemFromUuid(World.UUID_FOR_TYPE_NUMBER);
    var itemType  = this.getWorld().getItemFromUuid(World.UUID_FOR_TYPE_ITEM);
    var connectionType  = this.getWorld().getItemFromUuid(World.UUID_FOR_TYPE_CONNECTION);
    if (dataType == typeNumber) {
      if (this._entry.getValue() < 0) {
        Util.css_addClass(this._textSpan,EntryView.CSS_CLASS_NEGATIVE_NUMBER);
      }
    }
    else if (this.isInEditMode() && (dataType == itemType || dataType == connectionType)) {
      this._textSpan.setAttribute("id",this._entry._getUuid()); //pending, why is _getUuid a private method?
      new Draggable(this._textSpan, {revert:true});
    }
  }
};


/**
 *
EntryView.prototype._canStartEditing = function() {
  return (!this._isEditing  && !(this._valueIsItem && !this._alwaysUseEditField));
}; */

EntryView.prototype.unSelect = function() {
  Util.assert(this._isLozenge());
  Util.css_removeClass(this._textSpan, EntryView.CSS_CLASS_SELECTED);
};

/** Select this Entry
 *
 */
EntryView.prototype.selectView = function(eventObject) {
  var rootView = this.getRootView();
  if (this._isLozenge()) {
    var addToSelection = (eventObject) && (eventObject.shiftKey || eventObject.ctrlKey || eventObject.metaKey);
    if (addToSelection) {
      rootView.addToSelection(this);
    }
    else {
      rootView.setSelection(this);
    }
    Util.css_addClass(this._textSpan, EntryView.CSS_CLASS_SELECTED); // must set this after setting rootView selection
  }
  else {
    rootView.setSelection(null);
    this.startEditing();
  }
};

/**
 * Switch to edit text field for editing.
 *
 * @scope    public instance method
 */
EntryView.prototype.startEditing = function(dontSelect,initialStr) {
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
      var listener = this; 
      editField.onblur = this.onBlur.bindAsEventListener(this);
      editField.onkeypress = this.onKeyPress.bindAsEventListener(this);
      editField.onkeyup = this.onKeyUp.bindAsEventListener(this);
      editField.onfocus = this.onFocus.bindAsEventListener(this);
      editField.value = this._isProvisional ? '' : (initialStr) ? initialStr : this._textNode.data;
      if (this.getSuperview().getEntryWidth) {
        var recommendedWidth = this.getSuperview().getEntryWidth();
        if (recommendedWidth > 0) {
          editField.style.width = recommendedWidth + 'px';
        }
      }
    }
    
    if (this._isMultiLine) {
      editField.style.height = (this.getHtmlElement().offsetHeight) + "px";
    }  
    
    this._setupSuggestionBox();
    this.getHtmlElement().replaceChild(editField, this._textSpan);
    if (!dontSelect) {editField.select();}
    if (initialStr) {editField.focus();}
    this._isEditing = true;
  }
};


/**
 * Called when it's time to stop editing and save the changes.
 *
 * @scope    public instance method
 */
EntryView.prototype.stopEditing = function() {
  if (this._isEditing) {
    var newValue;
    if (this._suggestionBox) {
      newValue = this._suggestionBox.getSelectedItem();
    }
    if (!newValue) {
      newValue = this._editField.value;
    }
    var stillProvisional = this._isProvisional && !newValue;
    var htmlElement = this.getHtmlElement();


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
      this.getHtmlElement().replaceChild(this._textSpan, this._editField);
    }

    // we need this _writeValue() to be after all display related code, because this may trigger an observer call
    if (!stillProvisional) { 
      this._writeValue(newValue); 
    }
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
EntryView.prototype._transformToExpectedType = function(value) {
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
      for (var i=0; i<listOfExpectedTypeEntries.length; ++i) {
        var aType = listOfExpectedTypeEntries[i].getValue();
        switch (aType) {
          case typeCalledText:
            return value;
          case typeCalledNumber:
            var floatVal = parseFloat(value);
            if (!isNaN(floatVal)) {return floatVal;}
            break;
          case typeCalledDate:
            var dateVal = Date.parse(value);
            if (!isNaN(dateVal)) {return new Date(value);}
            break;
          default:
            if (aType.isInCategory(categoryCalledCategory)) {
              value = repository.newItem(value);
              value.assignToCategory(aType);
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
EntryView.prototype._writeValue = function(value) {
  if (value === 0 || value) {
    this.getWorld().beginTransaction();
    value = this._transformToExpectedType(value);

    var oldValue = null;
    if (this._entry) {oldValue = this._entry.getValue(this._item);}
    if (oldValue != value) {
      var attributeCalledInverseAttribute = this.getWorld().getAttributeCalledInverseAttribute();
      var listOfInverseAttributeEntries = this._attribute.getEntriesForAttribute(attributeCalledInverseAttribute);
      if (listOfInverseAttributeEntries.length > 0) {
        // alert(this._attribute.getDisplayString());
        // alert(listOfInverseAttributeEntries[0].getDisplayString());
        var inverseAttr = listOfInverseAttributeEntries[0].getValue(this._attribute);
        this._entry = this._item.replaceEntryWithConnection(this._entry, this._attribute, value, inverseAttr);
      }
      else {
        this._entry = this._item.replaceEntryWithEntryForAttribute(this._entry, this._attribute, value);
      }
      var superview = this.getSuperview();
      if (this._isProvisional && superview._provisionalItemJustBecomeReal) {
        superview._provisionalItemJustBecomeReal(this._item);
      }
      if (value instanceof Item) {
        this._valueIsItem = true;
      }
      this._setClassName();
    }
    this.getWorld().endTransaction();
  }
  this._restoreText(true); // call restore text in case item is transformed (e.g. Dates will be normalized)
};


/**
 * Returns text string for EntryView to be displaying and editing
 *
 * @scope    private instance method
 */
EntryView.prototype._getText = function() {
  if (this._isProvisional) {return this._provisionalText;}
  if (this._entry) {return this._item.getDisplayStringForEntry(this._entry);}
  return '';
};


/**
 * Restores the original text before this editing session
 *
 * @scope    private instance method
 */
EntryView.prototype._restoreText = function(dontSelect) {
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
 * Sets a function to be used when onclick is called to the EntryView
 *
 * @scope    public instance method
 * @param    onClickFunction    A function to call. 
 */
EntryView.prototype.setClickFunction = function(onClickFunction) {
  Util.assert(onClickFunction instanceof Function);
  this._clickFunction = onClickFunction;
};


/**
 * Called when the user clicks on the text.
 *
 * Handles the mouse click event on text view. Called by listener.
 *
 * @scope    public instance method
 * @param    eventObject    An event object. 
 */
EntryView.prototype.onClick = function(eventObject) {
  if (this._clickFunction && this._clickFunction(eventObject, this)) {
    return true;
  }
  if (this.isInEditMode()) {
    this.selectView(eventObject);
    return false;
  }
};


/**
 *
 */
EntryView.prototype.onFocus = function(eventObject) {
  if (this._suggestionBox) {
    this._suggestionBox._focusOnInputField(eventObject);
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
EntryView.prototype.onBlur = function(eventObject) {
  this.stopEditing();
};


/**
 * Sets a function to be used when onkeypress is called to the EntryView
 *
 * @scope    public instance method
 * @param    keyPressFunction    A function. 
 */
EntryView.prototype.setKeyPressFunction = function(keyPressFunction) {
  this._keyPressFunction = keyPressFunction;
};


/**
 *
 */
EntryView.prototype.onKeyUp = function(eventObject) {
  if (this._suggestionBox) {
    this._suggestionBox._keyUpOnInputField(eventObject);
  }
};


/**
 * Called when the user types in editField
 *
 * @scope    public instance method
 * @param    inEventObject    An event object. 
 */
EntryView.prototype.onKeyPress = function(eventObject) {
  if (eventObject.keyCode == Util.ASCII_VALUE_FOR_ESCAPE) {
    this._restoreText();
    return true;
  }
  if (this._suggestionBox && this._suggestionBox._keyPressOnInputField(eventObject)) {
    return true;
  }
  var ignoreKeyPressFunc = this._isEditing && (eventObject.keyCode == Util.ASCII_VALUE_FOR_LEFT_ARROW || 
    eventObject.keyCode == Util.ASCII_VALUE_FOR_RIGHT_ARROW);
  if (!ignoreKeyPressFunc && this._keyPressFunction && this._keyPressFunction(eventObject, this)) {
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
 * This method is called when user types on the keyboard. This view is given a chance
 * to process the keypress event, if it is a user selected view
 * This is different from EntryView.onKeyPress(), which receives key press events directly from the browser
 */
EntryView.prototype.handleKeyEventWhenSelected = function(myEvent) {
  if (myEvent.ctrlKey || myEvent.metaKey) {
    // ignore keyboard shortcuts
    return false;
  }
  if (this._keyPressFunction && this._keyPressFunction(myEvent, this)) {
    return true;
  }
  if (myEvent.keyCode ==  Util.KEYCODE_FOR_BACKSPACE || myEvent.keyCode == Util.KEYCODE_FOR_DELETE ||
      myEvent.keyCode === 0) {
    Util.assert(this._entry !== null);
    this._entry.voteToDelete();
    this._entry = null;
    this._valueIsItem = false;
    this._setClassName();
    this.getRootView().removeFromSelection(this);
    if ((myEvent.keyCode ==  Util.KEYCODE_FOR_BACKSPACE || myEvent.keyCode == Util.KEYCODE_FOR_DELETE) &&
        this.getSuperview().entryRemoved) {
      this.getSuperview().entryRemoved(this);
    }
    else {
      this._buildView();
    }
    if (myEvent.keyCode === 0) {
      this.startEditing(true,Util.getStringFromKeyEvent(myEvent));
      return true;
    }
    return false;
  }
};

/**
 *
 */
EntryView.prototype.noLongerProvisional = function() {
  if (this._isProvisional) {
    this._isProvisional = false;
    this._textSpan.className = "";
    // need to set line below because _writeValue() hasn't returned an entry yet
    this._entry = this._item.getSingleEntryFromAttribute(this._attribute); 
    this._buildView();
  }
};


/**
 * PENDING.
 *
 * @scope    private instance method
 */
EntryView.prototype._buildTypeHashTable = function() {
  var text      = this.getWorld().getItemFromUuid(World.UUID_FOR_TYPE_TEXT);
  var number    = this.getWorld().getItemFromUuid(World.UUID_FOR_TYPE_NUMBER);
  var dateType  = this.getWorld().getItemFromUuid(World.UUID_FOR_TYPE_DATE);
  var checkMark = this.getWorld().getItemFromUuid(World.UUID_FOR_TYPE_CHECK_MARK);
  var url       = this.getWorld().getItemFromUuid(World.UUID_FOR_TYPE_URL);
  var itemType  = this.getWorld().getItemFromUuid(World.UUID_FOR_TYPE_ITEM);
  var connectionType  = this.getWorld().getItemFromUuid(World.UUID_FOR_TYPE_CONNECTION);
  
  EntryView._ourHashTableOfTypesKeyedByClassName = {};
  EntryView._ourHashTableOfTypesKeyedByClassName[EntryView.CSS_CLASS_TEXT_VALUE] = text;
  EntryView._ourHashTableOfTypesKeyedByClassName[EntryView.CSS_CLASS_NUMBER_VALUE] = number;
  EntryView._ourHashTableOfTypesKeyedByClassName[EntryView.CSS_CLASS_DATE_VALUE] = dateType;
  EntryView._ourHashTableOfTypesKeyedByClassName[EntryView.CSS_CLASS_CHECKMARK_VALUE] = checkMark;
  EntryView._ourHashTableOfTypesKeyedByClassName[EntryView.CSS_CLASS_URL_VALUE] = url;
  EntryView._ourHashTableOfTypesKeyedByClassName[EntryView.CSS_CLASS_ITEM_VALUE] = itemType;
  EntryView._ourHashTableOfTypesKeyedByClassName[EntryView.CSS_CLASS_CONNECTION_VALUE] = connectionType;
};


/**
 * Given an item that represents a basic data type, this method returns the 
 * corresponding CSS className for that data type.
 *
 * @scope    private instance method
 * @param    type    An item that represents a basic data type, like Text, Number, or URL. 
 * @return   A string with the CSS className for that type.
 */
EntryView.prototype._getClassNameFromType = function(type) {
  if (!EntryView._ourHashTableOfTypesKeyedByClassName) {
    this._buildTypeHashTable();
  }
  for (var className in EntryView._ourHashTableOfTypesKeyedByClassName) {
    typeItem = EntryView._ourHashTableOfTypesKeyedByClassName[className];
    if (type == typeItem) {
      return className;
    }
  }
  Util.assert(false, "no such type: " + type.getDisplayString());
};


/**
 * Given a string with the CSS className of a basic data type, this method
 * returns the corresponding item that represents the same data type.
 *
 * @scope    private instance method
 * @param    className    A string with the CSS className for a type.
 * @return   An item that represents a basic data type, like Text, Number, or URL. 
 */
EntryView.prototype._getTypeFromTypeClassName = function(className) {
  if (!EntryView._ourHashTableOfTypesKeyedByClassName) {
    this._buildTypeHashTable();
  }
  return EntryView._ourHashTableOfTypesKeyedByClassName[className];
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------