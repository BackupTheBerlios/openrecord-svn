/*****************************************************************************
 MultiEntries.js
 
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
dojo.provide("orp.view.MultiEntriesView");
dojo.require("orp.view.View");
dojo.require("orp.view.EntryView");
dojo.require("orp.model.Item");
dojo.require("orp.lang.Lang");
dojo.require("dojo.event.*");

// -------------------------------------------------------------------
// Dependencies, expressed in the syntax that JSLint understands:
// 
/*global document  */
/*global Util  */
/*global Item  */
/*global EntryView  */
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------

/**
 * An instance of MultiEntriesView can be placed in any parent container View
 * to display and (if in edit mode) edit multi-lines of text
 *
 * @scope    public instance constructor
 * @extends  View
 * @param    superview    The view that this view is nested in. 
 * @param    htmlElement      The HTMLElement to display the HTML in. 
 * @param    item         The Item to be displayed and edited by this view. 
 * @param    attribute    The attribute of the item to be displayed.
 * @param    isMultiLine     a boolean indicating if text view is single line or multi-line
 */
orp.view.MultiEntriesView = function(superview, htmlElement, item, attribute) {
  orp.view.View.call(this, superview, htmlElement, "MultiEntriesView");

  orp.lang.assert(item instanceof orp.model.Item);
  orp.lang.assert(attribute instanceof orp.model.Item); // PENDING need to check that attribute is an attribute
  
  this._item = item;
  this._attribute = attribute;
  this._entryViews = null;
  this._listOfSuggestions = null;
};

dojo.inherits(orp.view.MultiEntriesView, orp.view.View);  // makes MultiEntriesView be a subclass of View


// -------------------------------------------------------------------
// Public constants
// -------------------------------------------------------------------
orp.view.MultiEntriesView.SEPARATOR = " • ";
orp.view.MultiEntriesView.SEPARATOR_COLOR = '#999999';


// -------------------------------------------------------------------
// Public methods
// -------------------------------------------------------------------

/**
 * Updates the HTML elements in this view to reflect any changes in 
 * the item's attribute values.
 *
 * @scope    public instance method
 */
orp.view.MultiEntriesView.prototype.refresh = function() {
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
 * This method will only ever be called by one of our EntryView subviews.
 * The EntryView will call this method during the transaction in which
 * the EntryView is creating the first Entry for a provisional item, 
 * causing the provisional item to become "real".
 * 
 * @scope    package instance method
 * @param    item      The Item which just became real. 
 */
orp.view.MultiEntriesView.prototype._provisionalItemJustBecomeReal = function(item) {
  orp.lang.assert(item == this._item);
  var superview = this.getSuperview();
  if (superview._provisionalItemJustBecomeReal) {
    superview._provisionalItemJustBecomeReal(item);
  }
};

/**
 *
 */
orp.view.MultiEntriesView.prototype.getEntryWidth = function() {
  if (this._entryViews.length > 1) {
    return -1;
  }
  return this.getHtmlElement().offsetWidth-7;
};

/**
 *
 */
orp.view.MultiEntriesView.prototype.noLongerProvisional = function() {
  orp.lang.assert(this._entryViews.length == 1); // provisional item should only have one entry
  for (var key in this._entryViews) {
    var entry = this._entryViews[key];
    entry.noLongerProvisional();
  }
};


/**
 *
 */
orp.view.MultiEntriesView.prototype.select = function(selectFirst) {
  var index = selectFirst ? 0 : this._entryViews.length - 1;
  this._entryViews[index].selectView();
};


/**
 *
 */
orp.view.MultiEntriesView.prototype.entryRemoved = function(anEntryView) {
  this._buildView();
};


/**
 *
 */
orp.view.MultiEntriesView.prototype.setSuggestions = function(listOfSuggestions) {
  this._listOfSuggestions = listOfSuggestions;
  for (var key in this._entryViews) {
    var entry = this._entryViews[key];
    entry.setSuggestions(listOfSuggestions);
  }
};


/**
 *
 */
orp.view.MultiEntriesView.prototype.setKeyPressFunction = function(keyPressFunction) {
  orp.lang.assert(keyPressFunction instanceof Function);
  this._keyPressFunction = keyPressFunction;
};


/**
 * Sets a function to be used when onclick is called to the EntryView
 *
 * @scope    public instance method
 * @param    onClickFunction    A function to call. 
 */
orp.view.MultiEntriesView.prototype.setClickFunction = function(onClickFunction) {
  orp.lang.assert(onClickFunction instanceof Function);
  this._clickFunction = onClickFunction;
};

/**
 *
 */
orp.view.MultiEntriesView.prototype.hasEntry = function(anEntry) {
  for (var i in this._entryViews) {
    if (this._entryViews[i]._entry == anEntry) {return true;}
  }
  return false;
};

/**
 *
 */
orp.view.MultiEntriesView.prototype._handleClick = function(eventObject, entryView) {
  if (this._clickFunction && this._clickFunction(eventObject, entryView)) {
    return true;
  }
  return false;
};


/**
 *
 */
orp.view.MultiEntriesView.prototype._handleOwnClick = function(eventObject) {
  var lastEntry = this._entryViews[this._entryViews.length-1];
  if (this._handleClick(eventObject, lastEntry)) {return true;}
  if (eventObject.target == this.getHtmlElement()) {lastEntry.selectView();}
};

/**
 *
 */
orp.view.MultiEntriesView.prototype._handleDrop = function(element) {
  var draggedEntryView = element.or_entryView;
  if (!draggedEntryView) {orp.lang.assert(false);}
  var droppedEntry = draggedEntryView._entry;
  if (!droppedEntry) {orp.lang.assert(false);}
  if (!this.hasEntry(droppedEntry)) {
    var newEntry;
    if (droppedEntry.getType() == this.getWorld().getTypeCalledConnection()) {
      var FIXME_OCT_7_2005_EXPERIMENT = true;
      if (FIXME_OCT_7_2005_EXPERIMENT) {
        var inverseItem = droppedEntry.getValue();
        var inverseAttribute = droppedEntry.getInverseAttribute();
        newEntry = this._item.replaceEntryWithConnection(droppedEntry, this._attribute, inverseItem, inverseAttribute);
      } else {
        var otherItem = droppedEntry.getConnectedItem(draggedEntryView._item);
        var otherAttribute = droppedEntry.getAttributeForItem(otherItem);
        newEntry = this._item.replaceEntryWithConnection(droppedEntry, this._attribute, otherItem, otherAttribute);
      }
    } else {
      // newEntry = this._item.replaceEntry(droppedEntry, droppedEntry.getValue(), droppedEntry.getType());
      newEntry = this._item.replaceEntry({previousEntry:droppedEntry, attribute:this._attribute, value:droppedEntry.getValue(), type:droppedEntry.getType()});
    }
    this._addEntryView(newEntry);

    // This is a little hack that accesses instance variables of the "Draggable"
    // object in the script.aculo.us dragdrop.js library.
    // We set "revert" to false to prevent the UI animation where the dragged 
    // column header goes "flying" home again
    var draggable = draggedEntryView._draggable;
    draggable.options.revert = false;
    // element.style.display = "none";
    
    this.getSuperview().refresh();
  }
};


/**
 *
 */
orp.view.MultiEntriesView.prototype._keyPressOnEditField = function(eventObject, entryView) {
  orp.lang.assert(entryView instanceof orp.view.EntryView);
  var asciiValueOfKey = eventObject.keyCode;
  var move, doCreateNewEntry;
  switch (asciiValueOfKey) {
    case orp.util.ASCII.LEFT_ARROW: move = -1; break;
    case orp.util.ASCII.RIGHT_ARROW: move = 1; break;
    case orp.util.ASCII.RETURN:
      if (eventObject.altKey) {
        doCreateNewEntry = true;
        break;
      }
      if (entryView != this._entryViews[this._entryViews.length-1]) {move=1;}
      break;
    default: 
      move = 0; 
      break;
  }
  if (doCreateNewEntry) {
    entryView.stopEditing();
    this._addEntryView(null).startEditing();
    return true;
  }
  if (move !== 0) {
    var index = orp.util.getArrayIndex(this._entryViews, entryView);
    orp.lang.assert(index != -1);
    index += move;
    if (index >= 0 && index < this._entryViews.length) {
      entryView.stopEditing();
      this._entryViews[index].selectView();
      return true;
    }
  }
  if (this._keyPressFunction && this._keyPressFunction(eventObject, entryView)) {
    return true;
  }
  return false;
};


/**
 *
 */
orp.view.MultiEntriesView.prototype._addEntryView = function(entry) {
  if (this._entryViews.length > 0 && this._entryViews[0]._entry) {this._addSeparator();}
  var spanElement = document.createElement("span");
  spanElement.style.width = '100%';
  var anEntryView = new orp.view.EntryView(this, spanElement, this._item, this._attribute, entry);
  this._entryViews.push(anEntryView);
  this.getHtmlElement().appendChild(spanElement);
  anEntryView.refresh();
  if (this.isInEditMode()) {
    var listener = this;
    anEntryView.setSuggestions(this._listOfSuggestions);
    anEntryView.setKeyPressFunction(function (evt, entryView) {return listener._keyPressOnEditField(evt, entryView);});
    anEntryView.setClickFunction(function (evt, entryView) {return listener._handleClick(evt, entryView);});
  }
  return anEntryView;
};


/**
 *
 */
orp.view.MultiEntriesView.prototype._addSeparator = function() {
  var spanElement = document.createElement("span");
  spanElement.appendChild(document.createTextNode(orp.view.MultiEntriesView.SEPARATOR));
  spanElement.style.color = orp.view.MultiEntriesView.SEPARATOR_COLOR;
  this.getHtmlElement().appendChild(spanElement);
  return spanElement;
};


/**
 * Re-creates all the HTML for the MultiEntriesView, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    public instance method
 */
orp.view.MultiEntriesView.prototype._buildView = function() {
  var htmlElement = this.getHtmlElement();
  orp.view.View.removeChildrenOfElement(htmlElement);
  this._entryViews = [];
  
  var entries = this._item.getEntriesForAttribute(this._attribute);
  if (this._item.isProvisional() || entries.length === 0) {
    this._addEntryView(null);
  }
  else {
    for (var i=0; i<entries.length; ++i) {
      var anEntry = entries[i];
      this._addEntryView(anEntry);
    }
  }
  
  if (this.isInEditMode()) {
    dojo.event.connect(htmlElement, "onclick", this, "_handleOwnClick");
    var listener = this;
    Droppables.add(htmlElement, {accept: [orp.view.EntryView.cssClass.CONNECTION_VALUE, orp.view.EntryView.CSS_ITEM_VALUE, orp.view.EntryView.cssClass.SELECTED],
      hoverclass: "test",
      onDrop: function(element) {listener._handleDrop(element);}});
  } 
  this._myHasEverBeenDisplayedFlag = true;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------