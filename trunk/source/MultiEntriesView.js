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
// Dependencies, expressed in the syntax that JSLint understands:
// 
/*global document  */
/*global Util  */
/*global Item  */
/*global EntryView  */
// -------------------------------------------------------------------



// -------------------------------------------------------------------
// MultiEntriesView public class constants
// -------------------------------------------------------------------
MultiEntriesView.SEPARATOR = " • ";
MultiEntriesView.SEPARATOR_COLOR = '#999999';


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
MultiEntriesView.prototype = new View();  // makes MultiEntriesView be a subclass of View
function MultiEntriesView(superview, htmlElement, item, attribute) {
  View.call(this, superview, htmlElement, "MultiEntriesView");

  Util.assert(item instanceof Item);
  Util.assert(attribute instanceof Item); // PENDING need to check that attribute is an attribute
  
  this._item = item;
  this._attribute = attribute;
  this._entryViews = null;
  this._listOfSuggestions = null;
}


/**
 * Updates the HTML elements in this view to reflect any changes in 
 * the item's attribute values.
 *
 * @scope    public instance method
 */
MultiEntriesView.prototype.refresh = function() {
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
MultiEntriesView.prototype._provisionalItemJustBecomeReal = function(item) {
  var superview = this.getSuperview();
  if (superview._provisionalItemJustBecomeReal) {
    superview._provisionalItemJustBecomeReal(item);
  }
};


/**
 *
 */
MultiEntriesView.prototype.noLongerProvisional = function() {
  Util.assert(this._entryViews.length == 1); // provisional item should only have one entry
  for (var key in this._entryViews) {
    var entry = this._entryViews[key];
    entry.noLongerProvisional();
  }
};


/**
 *
 */
MultiEntriesView.prototype.select = function(selectFirst) {
  var index = selectFirst ? 0 : this._entryViews.length - 1;
  this._entryViews[index].startEditing();
};


/**
 *
 */
MultiEntriesView.prototype.setSuggestions = function(listOfSuggestions) {
  this._listOfSuggestions = listOfSuggestions;
  for (var key in this._entryViews) {
    var entry = this._entryViews[key];
    entry.setSuggestions(listOfSuggestions);
  }
};


/**
 *
 */
MultiEntriesView.prototype.setKeyPressFunction = function(keyPressFunction) {
  Util.assert(keyPressFunction instanceof Function);
  this._keyPressFunction = keyPressFunction;
};


/**
 * Sets a function to be used when onclick is called to the EntryView
 *
 * @scope    public instance method
 * @param    onClickFunction    A function to call. 
 */
MultiEntriesView.prototype.setClickFunction = function(onClickFunction) {
  Util.assert(onClickFunction instanceof Function);
  this._clickFunction = onClickFunction;
};


/**
 *
 */
MultiEntriesView.prototype._handleClick = function(eventObject, entryView) {
  if (this._clickFunction && this._clickFunction(eventObject, entryView)) {
    return true;
  }
  return false;
};


/**
 *
 */
MultiEntriesView.prototype._handleOwnClick = function(eventObject) {
  var lastEntry = this._entryViews[this._entryViews.length-1];
  if (this._handleClick(eventObject, lastEntry)) {return true;}
  if (eventObject.target == this.getHtmlElement()) {lastEntry.startEditing();}
};


/**
 *
 */
MultiEntriesView.prototype._keyPressOnEditField = function(eventObject, entryView) {
  Util.assert(entryView instanceof EntryView);
  var asciiValueOfKey = eventObject.keyCode;
  var move, doCreateNewEntry;
  switch (asciiValueOfKey) {
    case Util.ASCII_VALUE_FOR_LEFT_ARROW: move = -1; break;
    case Util.ASCII_VALUE_FOR_RIGHT_ARROW: move = 1; break;
    case Util.ASCII_VALUE_FOR_RETURN:
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
    this._addSeparator();
    this._addEntryView(null).startEditing();
    return true;
  }
  if (move !== 0) {
    var index = Util.getArrayIndex(this._entryViews, entryView);
    Util.assert(index != -1);
    index += move;
    if (index >= 0 && index < this._entryViews.length) {
      entryView.stopEditing();
      this._entryViews[index].startEditing();
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
MultiEntriesView.prototype._addEntryView = function(entry) {
  var spanElement = document.createElement("span");
  spanElement.style.width = '100%';
  var anEntryView = new EntryView(this, spanElement, this._item, this._attribute, entry);
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
MultiEntriesView.prototype._addSeparator = function() {
  var spanElement = document.createElement("span");
  spanElement.appendChild(document.createTextNode(MultiEntriesView.SEPARATOR));
  spanElement.style.color = MultiEntriesView.SEPARATOR_COLOR;
  this.getHtmlElement().appendChild(spanElement);
  return spanElement;
};


/**
 * Re-creates all the HTML for the MultiEntriesView, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    public instance method
 */
MultiEntriesView.prototype._buildView = function() {
  var htmlElement = this.getHtmlElement();
  View.removeChildrenOfElement(htmlElement);
  this._entryViews = [];
  
  var entries = this._item.getEntriesForAttribute(this._attribute);
  if (this._item.isProvisional() || entries.length === 0) {
    this._addEntryView(null);
  }
  else {
    for (var i=0; i<entries.length; ++i) {
      var anEntry = entries[i];
      this._addEntryView(anEntry);
      if (i < (entries.length-1)) { this._addSeparator();}
    }
  }
  
  if (this.isInEditMode()) {
    htmlElement.onclick = this._handleOwnClick.bindAsEventListener(this);
  } 
  this._myHasEverBeenDisplayedFlag = true;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------