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
// EntryView.ELEMENT_CLASS_TEXT_BLOCK = "text_block"; 
EntryView.CSS_CLASS_VALUE_IS_ITEM = "entryViewItem";
EntryView.PROVISIONAL_COLOR = '#999999';


/**
 * An instance of EntryView can be placed in any parent container View
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
EntryView.prototype = new View();  // makes EntryView be a subclass of View
function EntryView(theSuperview, inElement, inItem, inAttribute, inEntry, inClassName, isMultiLine) {
  Util.assert((!inEntry) || inEntry instanceof Entry);
  Util.assert(inItem instanceof Item);
  Util.assert(inAttribute instanceof Item);
  //Util.assert(theAttribute instanceof Attribute); PENDING need to check that attribute is an attribute
  
  this.setSuperview(theSuperview);
  this.setHTMLElement(inElement);
  inElement.style.width = "100%";
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
EntryView.prototype._setupSuggestionBox = function() {
  if (this._suggestions) {
    var suggestionBox = new SuggestionBox(this._editField, this._suggestions);
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
EntryView.prototype.alwaysUseEditField = function() {
  this._alwaysUseEditField = true;
  if (this._myHasEverBeenDisplayedFlag) {
    this.startEditing(true);
  }
};

/**
 *
 */
EntryView.prototype.setAutoWiden = function(inAutoWiden) {
  this._autoWiden = inAutoWiden;
};

/**
 *
 */
EntryView.prototype.setExpectedTypeEntries = function(expectedTypeEntries) {
  Util.assert(Util.isArray(expectedTypeEntries));
  for(var i=0;i < expectedTypeEntries.length; ++i) {
    Util.assert(expectedTypeEntries[i] instanceof Entry);
  }
  this._expectedTypeEntries = expectedTypeEntries;
};


/**
 *
 */
EntryView.prototype.setSuggestions = function(suggestionList) {
  if (suggestionList) {Util.assert(Util.isArray(suggestionList));}
  this._suggestions = suggestionList;
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
  var htmlElement = this.getHTMLElement();
  View.removeChildrenOfElement(htmlElement);
  
  var textString = this._getText();
  
  if (this._isProvisional) {
    this._oldColor = htmlElement.style.color;
    htmlElement.style.color = EntryView.PROVISIONAL_COLOR;
  }
  else if (this._isLozenge()) {
    htmlElement.className += " " + EntryView.CSS_CLASS_VALUE_IS_ITEM;
  }
  this._textNode = document.createTextNode(textString);
  htmlElement.appendChild(this._textNode);
  htmlElement.onclick =  this.onClick.bindAsEventListener(this);
  if (this._alwaysUseEditField) {
    this.startEditing(true);
  }
    
  this._myHasEverBeenDisplayedFlag = true;
};


/**
 *
 */
EntryView.prototype._canStartEditing = function() {
  return (!this._isEditing  && !(this._valueIsItem && !this._alwaysUseEditField));
};


/**
 * Switch to edit text field for editing.
 *
 * @scope    public instance method
 */
EntryView.prototype.startEditing = function(dontSelect) {
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
      if (superview._provisionalItemJustBecomeReal) {
        superview._provisionalItemJustBecomeReal(this._item);
      }
      if (value instanceof Item) {
        this._valueIsItem = true;
        var htmlElement = this.getHTMLElement();
        if (this._isLozenge() && !htmlElement.className.match(EntryView.CSS_CLASS_VALUE_IS_ITEM)) {
          htmlElement.className += " " + EntryView.CSS_CLASS_VALUE_IS_ITEM;
        }
      }
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
 * @param    inEventObject    An event object. 
 */
EntryView.prototype.setClickFunction = function(inClickFunction) {
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
EntryView.prototype.onClick = function(inEventObject) {
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
EntryView.prototype.onFocus = function(inEventObject) {
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
EntryView.prototype.onBlur = function(inEventObject) {
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
EntryView.prototype.onKeyUp = function(inEventObject) {
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
EntryView.prototype.onKeyPress = function(inEventObject) {
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
EntryView.prototype.noLongerProvisional = function() {
  if (this._isProvisional) {
    this._isProvisional = false;
    this.getHTMLElement().style.color = this._oldColor;
    // need to set line below because _writeValue() hasn't returned an entry yet
    this._entry = this._item.getSingleEntryFromAttribute(this._attribute); 
    this._buildView();
  }
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------