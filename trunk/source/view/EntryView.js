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
// Provides and Requires
// -------------------------------------------------------------------
dojo.provide("orp.view.EntryView");
dojo.require("orp.view.View");
dojo.require("orp.view.SuggestionBox");
dojo.require("orp.model.World");
dojo.require("orp.model.Item");
dojo.require("orp.lang.Lang");
dojo.require("dojo.event.*");

// -------------------------------------------------------------------
// Dependencies, expressed in the syntax that JSLint understands:
// 
/*global document  */
/*global Util  */
/*global Item, Entry  */
/*global SuggestionBox  */
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------
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
orp.view.EntryView = function(superview, htmlElement, item, attribute, entry, isMultiLine) {
  // orp.util.assert((!entry) || entry instanceof orp.model.Entry);
  orp.lang.assert(item instanceof orp.model.Item);
  orp.lang.assert(attribute instanceof orp.model.Item); // PENDING need to check that attribute is an attribute
  var FIXME_OCT_7_2005_EXPERIMENT = true;
  if (FIXME_OCT_7_2005_EXPERIMENT) {
    // could be an orp.model.Entry or an orp.model.ProxyEntry
  } else {
    orp.lang.assertTypeForOptionalValue(entry, orp.model.Entry);
  }
  
  orp.view.View.call(this, superview, htmlElement, "EntryView");

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
  this._attributeCanBeLozenge = this._isLozengeAttribute();
  
  this._isProvisional = item.isProvisional();
  if (this._isProvisional) {
    this._provisionalText = attribute.getDisplayString();
  }
  else if (entry && entry.getValue(this._item) instanceof orp.model.Item) {
    this._valueIsItem = true;
  }
};

dojo.inherits(orp.view.EntryView, orp.view.View);  // makes EntryView be a subclass of View


// -------------------------------------------------------------------
// Public constants
// -------------------------------------------------------------------
orp.view.EntryView.cssClass = {
  SELECTED:         "ItemValueSelected",
  PROVISIONAL:      "provisional",

  TEXT_VALUE:       "TextValue",
  NUMBER_VALUE:     "NumberValue",
  DATE_VALUE:       "DateValue",
  CHECKMARK_VALUE:  "CheckmarkValue",
  URL_VALUE:        "UrlValue",
  ITEM_VALUE:       "ItemValue",
  CONNECTION_VALUE: "ConnectionValue",
  
  NEGATIVE_NUMBER:  "NegativeNumber" };

orp.view.EntryView.UUID = {
  ATTRIBUTE_NOT_LOZENGE: "0004010f-ce7f-11d9-8cd5-0011113ae5d6" };

  
// -------------------------------------------------------------------
// Private class variables
// -------------------------------------------------------------------
orp.view.EntryView._ourHashTableOfClassNamesKeyedByTypeUuid = null;

orp.view.EntryView._PENDING_temporaryHackToDecreaseLayoutTime = true;
orp.view.EntryView._PENDING_enableDragging = true;


// -------------------------------------------------------------------
// Private instance methods
// -------------------------------------------------------------------

/**
 *
 */
orp.view.EntryView.prototype._isLozengeAttribute = function() {
  if (!orp.view.EntryView._ourAttributeCalledNotLozenge) {
    orp.view.EntryView._ourAttributeCalledNotLozenge =
      this.getWorld().getItemFromUuid(orp.view.EntryView.UUID.ATTRIBUTE_NOT_LOZENGE);
  }
  var entries = this._attribute.getEntriesForAttribute(orp.view.EntryView._ourAttributeCalledNotLozenge);
  return entries.length === 0; //PENDING need to actually check value of entries
};


/**
 *
 */
orp.view.EntryView.prototype._setupSuggestionBox = function() {
  var listOfSuggestions = this._suggestions || this.getWorld().getSuggestedItemsForAttribute(this._attribute);
  if (listOfSuggestions && listOfSuggestions.length > 0) {
    var suggestionBox = new orp.view.SuggestionBox(this._editField, listOfSuggestions);
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
orp.view.EntryView.prototype.alwaysUseEditField = function() {
  this._alwaysUseEditField = true;
  if (this._myHasEverBeenDisplayedFlag) {
    this.startEditing(true);
  }
};


/**
 *
 */
orp.view.EntryView.prototype.setAutoWiden = function(autoWiden) {
  this._autoWiden = autoWiden;
};


/**
 *
 */
orp.view.EntryView.prototype.setExpectedTypeEntries = function(expectedTypeEntries) {
  // orp.util.assert(orp.util.isArray(expectedTypeEntries));
  orp.lang.assertType(expectedTypeEntries, Array);
  for (var key in expectedTypeEntries) {
    orp.lang.assert(expectedTypeEntries[key] instanceof orp.model.Entry);
  }
  this._expectedTypeEntries = expectedTypeEntries;
};


/**
 *
 */
orp.view.EntryView.prototype.setSuggestions = function(listOfSuggestions) {
  // if (listOfSuggestions) {orp.util.assert(orp.util.isArray(listOfSuggestions));}
  orp.lang.assertTypeForOptionalValue(listOfSuggestions, Array);
  this._suggestions = listOfSuggestions;
};


/**
 * Updates the HTML elements in this view to reflect any changes in 
 * the item's attribute values.
 *
 * @scope    public instance method
*/
orp.view.EntryView.prototype.refresh = function() {
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
orp.view.EntryView.prototype._isLozenge = function() {
  return this._attributeCanBeLozenge && this._valueIsItem && !this._alwaysUseEditField;
};


/**
 * Re-creates all the HTML for the EntryView, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    private instance method
 */
orp.view.EntryView.prototype._buildView = function() {
  var htmlElement = this.getHtmlElement();
  orp.view.View.removeChildrenOfElement(htmlElement);
  
  var textString = this._getText(true);
  var className = (this._isProvisional ? orp.view.EntryView.cssClass.PROVISIONAL : '');
  this._textSpan = orp.view.View.appendNewElement(htmlElement, "span", className, null);
  this._textNode = orp.view.View.appendNewTextNode(this._textSpan, textString);
  // if (this._isProvisional) {
  //   this._textSpan.className = orp.view.EntryView.cssClass.PROVISIONAL;
  // }
  // else if (!this._alwaysUseEditField) {
  //   this._setClassName();
  // }
  if (!this._isProvisional && !this._alwaysUseEditField) {
    this._setClassName();
  }
  
  // htmlElement.onclick = this.onClick.orpBindAsEventListener(this);
  dojo.event.connect(htmlElement, "onclick", this, "onClick");
  if (this._alwaysUseEditField) {
    this.startEditing(true);
  }
    
  this._myHasEverBeenDisplayedFlag = true;
};


/**
 *
 */
orp.view.EntryView.prototype._setClassName = function() {
  if (this._entry) {
    var dataType = this._entry.getType();
    var className = this._getClassNameFromType(dataType);
    var itemType  = this.getWorld().getItemFromUuid(orp.model.World.UUID.TYPE_ITEM);
    var connectionType  = this.getWorld().getItemFromUuid(orp.model.World.UUID.TYPE_CONNECTION);
    if (dataType == itemType || dataType == connectionType) {
      if (this._isLozenge()) {
        // this.getHtmlElement().ondblclick = this.onDoubleClick.orpBindAsEventListener(this);
        var htmlElement = this.getHtmlElement();
        dojo.event.connect(htmlElement, "ondblclick", this, "onDoubleClick");
        if (this.isInEditMode() && !this._draggable) {
          if (orp.view.EntryView._PENDING_temporaryHackToDecreaseLayoutTime) {
            // if (this.getRootView().isInShowToolsMode()) {
            if (orp.view.EntryView._PENDING_enableDragging) {
              this._textSpan.or_entryView = this; 
              this._draggable = new Draggable(this._textSpan, {revert:true});
            }
          } else {
            this._textSpan.or_entryView = this; 
            this._draggable = new Draggable(this._textSpan, {revert:true});
          }
        }
      }
      else {
        className = orp.view.EntryView.cssClass.TEXT_VALUE;
      }
    }
    this._textSpan.className = className;
    
    var typeNumber = this.getWorld().getItemFromUuid(orp.model.World.UUID.TYPE_NUMBER);
    if (dataType == typeNumber) {
      if (this._entry.getValue() < 0) {
        orp.util.css_addClass(this._textSpan,orp.view.EntryView.cssClass.NEGATIVE_NUMBER);
      }
    }
  }
};


/**
 *
orp.view.EntryView.prototype._canStartEditing = function() {
  return (!this._isEditing  && !(this._valueIsItem && !this._alwaysUseEditField));
}; */

orp.view.EntryView.prototype.unSelect = function() {
  orp.lang.assert(this._isLozenge());
  this._setClassName();
  //orp.util.css_removeClass(this._textSpan, orp.view.EntryView.cssClass.SELECTED);
};

/** Select this Entry
 *
 */
orp.view.EntryView.prototype.selectView = function(eventObject) {
  var rootView = this.getRootView();
  if (this._isLozenge()) {
    var addToSelection = (eventObject) && (eventObject.shiftKey || eventObject.ctrlKey || eventObject.metaKey);
    if (addToSelection) {
      rootView.addToSelection(this);
    }
    else {
      rootView.setSelection(this);
    }
    this._textSpan.className = orp.view.EntryView.cssClass.SELECTED; // must set this after setting rootView selection
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
orp.view.EntryView.prototype.startEditing = function(dontSelect,initialStr) {
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
      dojo.event.connect(editField, "onblur", this, "onBlur");
      dojo.event.connect(editField, "onkeypress", this, "onKeyPress");
      dojo.event.connect(editField, "onkeyup", this, "onKeyUp");
      dojo.event.connect(editField, "onfocus", this, "onFocus");
      
      
      editField.value = this._isProvisional ? '' : (initialStr) ? initialStr : this._textNode.data;
      //alert(editField.value)
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
orp.view.EntryView.prototype.stopEditing = function() {
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
      if (dojo.lang.isString(newValue)) {
        newValueDisplayString = newValue;
      }
      else if (newValue instanceof orp.model.Item) {
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
orp.view.EntryView.prototype._transformToExpectedType = function(value) {
  if (value && dojo.lang.isString(value)) {
    var world = this.getWorld();
    var listOfExpectedTypeEntries;
    if (this._expectedTypeEntries) {
      listOfExpectedTypeEntries = this._expectedTypeEntries;
    }
    else {
      var attributeCalledExpectedType = world.getAttributeCalledExpectedType();
      listOfExpectedTypeEntries = this._attribute.getEntriesForAttribute(attributeCalledExpectedType);
    }
    var listOfTypes = [];
    for (var i in listOfExpectedTypeEntries) {
      var entry = listOfExpectedTypeEntries[i];
      listOfTypes.push(entry.getValue());
    }
    return world.transformValueToExpectedType(value, listOfTypes);
  }
  return value;
};


/**
 * Writes edited value back into item entry of repository.
 *
 * @scope    private instance method
 * @param    value    The new value to be saved. 
 */
orp.view.EntryView.prototype._writeValue = function(value) {
  if (value === 0 || value) {
    this.getWorld().beginTransaction();
    value = this._transformToExpectedType(value);

    var oldValue = null;
    if (this._entry) {oldValue = this._entry.getValue(this._item);}
    if (oldValue != value) {
      var attributeCalledInverseAttribute = this.getWorld().getAttributeCalledInverseAttribute();
      var inverseAttributeEntry = this._attribute.getSingleEntryFromAttribute(attributeCalledInverseAttribute);
      if (inverseAttributeEntry) {
        var inverseAttr = inverseAttributeEntry.getValue(this._attribute);
        this._entry = this._item.replaceEntryWithConnection(this._entry, this._attribute, value, inverseAttr);
      } else {
        this._entry = this._item.replaceEntry({previousEntry:this._entry, attribute:this._attribute, value:value});
      }
      var superview = this.getSuperview();
      if (this._isProvisional && superview._provisionalItemJustBecomeReal) {
        superview._provisionalItemJustBecomeReal(this._item);
      }
      if (value instanceof orp.model.Item) {
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
orp.view.EntryView.prototype._getText = function(useNonBreakingSpaces) {
  if (this._isProvisional) {
    return this._provisionalText;
  }
  if (this._entry) {
    var FIXME_OCT_7_2005_EXPERIMENT = true;
    if (FIXME_OCT_7_2005_EXPERIMENT) {
      var text = this._entry.getDisplayString();
    } else {
      // var text = this._item.getDisplayStringForEntry(this._entry);
      text = this._item.getDisplayStringForEntry(this._entry);
    }
    if (useNonBreakingSpaces) {
      var dataType = this._entry.getType();
      if (dataType != this.getWorld().getTypeCalledText()) {
        var regExpForAllSpaces = new RegExp(' ','g');
        var unicodeNonBreakingSpace = '\u00a0'; // The same as &nbsp; in HTML
        text = text.replace(regExpForAllSpaces, unicodeNonBreakingSpace);
      }
    }
    return text;
  }
  return '';
};


/**
 * Restores the original text before this editing session
 *
 * @scope    private instance method
 */
orp.view.EntryView.prototype._restoreText = function(dontSelect) {
  var useNonBreakingSpaces = !this._isEditing;
  var oldText = (this._entry) ?  this._getText(useNonBreakingSpaces) : '';
  if (this._isEditing) {
    this._editField.value = oldText;
  } else {
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
orp.view.EntryView.prototype.setClickFunction = function(onClickFunction) {
  orp.lang.assert(onClickFunction instanceof Function);
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
orp.view.EntryView.prototype.onClick = function(eventObject) {
  if (this._clickFunction && this._clickFunction(eventObject, this)) {
    return true;
  }
  if (this.isInEditMode()) {
    this.selectView(eventObject);
    return true;
  }
};


/**
 * Called when the user double clicks on a lozenge.
 *
 * @scope    public instance method
 * @param    eventObject    An event object. 
 */
orp.view.EntryView.prototype.onDoubleClick = function(eventObject) {
  if (this._valueIsItem) {
    var relatedItem = this._entry.getValue(this._item);
    var urlOfRelatedItem = orp.view.RootView.URL_HASH_ITEM_PREFIX + relatedItem.getUuidString();
    window.location = urlOfRelatedItem;
    this.getRootView().setCurrentContentViewFromUrl();
  }
  return true;
};


/**
 *
 */
orp.view.EntryView.prototype.onFocus = function(eventObject) {
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
orp.view.EntryView.prototype.onBlur = function(eventObject) {
  this.stopEditing();
};


/**
 * Sets a function to be used when onkeypress is called to the EntryView
 *
 * @scope    public instance method
 * @param    keyPressFunction    A function. 
 */
orp.view.EntryView.prototype.setKeyPressFunction = function(keyPressFunction) {
  this._keyPressFunction = keyPressFunction;
};


/**
 *
 */
orp.view.EntryView.prototype.onKeyUp = function(eventObject) {
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
orp.view.EntryView.prototype.onKeyPress = function(eventObject) {
  if (eventObject.keyCode == orp.util.ASCII.ESCAPE) {
    this._restoreText();
    return true;
  }
  if (this._suggestionBox && this._suggestionBox._keyPressOnInputField(eventObject)) {
    return true;
  }
  var ignoreKeyPressFunc = this._isEditing && (eventObject.keyCode == orp.util.ASCII.LEFT_ARROW || 
    eventObject.keyCode == orp.util.ASCII.RIGHT_ARROW);
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
orp.view.EntryView.prototype.handleKeyEventWhenSelected = function(myEvent) {
  if (myEvent.ctrlKey || myEvent.metaKey) {
    // ignore keyboard shortcuts
    return false;
  }
  if (this._keyPressFunction && this._keyPressFunction(myEvent, this)) {
    return true;
  }
  if (myEvent.keyCode ==  orp.util.KEYCODE_FOR_BACKSPACE || myEvent.keyCode == orp.util.KEYCODE_FOR_DELETE ||
      myEvent.keyCode === 0) {
    orp.lang.assert(this._entry !== null);
    this._entry.voteToDelete();
    this._entry = null;
    this._valueIsItem = false;
    this._setClassName();
    this.getRootView().removeFromSelection(this);
    if ((myEvent.keyCode ==  orp.util.KEYCODE_FOR_BACKSPACE || myEvent.keyCode == orp.util.KEYCODE_FOR_DELETE) &&
        this.getSuperview().entryRemoved) {
      this.getSuperview().entryRemoved(this);
    }
    else {
      this._buildView();
    }
    if (myEvent.keyCode === 0) {
      this.startEditing(true, orp.util.getStringFromKeyEvent(myEvent));
      return true;
    }
    return false;
  }
};

/**
 *
 */
orp.view.EntryView.prototype.noLongerProvisional = function() {
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
orp.view.EntryView.prototype._buildTypeHashTable = function() {
  var UUID = orp.model.World.UUID;
  orp.view.EntryView._ourHashTableOfClassNamesKeyedByTypeUuid = {};
  var cssClassNames = orp.view.EntryView._ourHashTableOfClassNamesKeyedByTypeUuid;
  var cssClass = orp.view.EntryView.cssClass;
  cssClassNames[UUID.TYPE_TEXT]       = cssClass.TEXT_VALUE;
  cssClassNames[UUID.TYPE_NUMBER]     = cssClass.NUMBER_VALUE;
  cssClassNames[UUID.TYPE_DATE]       = cssClass.DATE_VALUE;
  cssClassNames[UUID.TYPE_CHECK_MARK] = cssClass.CHECKMARK_VALUE;
  cssClassNames[UUID.TYPE_URL]        = cssClass.URL_VALUE;
  cssClassNames[UUID.TYPE_ITEM]       = cssClass.ITEM_VALUE;
  cssClassNames[UUID.TYPE_CONNECTION] = cssClass.CONNECTION_VALUE;
};


/**
 * Given an item that represents a basic data type, this method returns the 
 * corresponding CSS className for that data type.
 *
 * @scope    private instance method
 * @param    type    An item that represents a basic data type, like Text, Number, or URL. 
 * @return   A string with the CSS className for that type.
 */
orp.view.EntryView.prototype._getClassNameFromType = function(type) {
  // if (!type) {
  //   orp.lang.assert(false);
  // }
  if (!orp.view.EntryView._ourHashTableOfClassNamesKeyedByTypeUuid) {
    this._buildTypeHashTable();
  }
  return orp.view.EntryView._ourHashTableOfClassNamesKeyedByTypeUuid[type.getUuid()];
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------