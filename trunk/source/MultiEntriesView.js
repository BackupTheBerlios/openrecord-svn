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
// Dependencies:
//   repository.js
//   util.js
//   TextView.js
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
 * @param    theSuperview    The view that this view is nested in. 
 * @param    theItem         The Item to be displayed and edited by this view. 
 * @param    theAttribute    The attribute of the item to be displayed.
 * @param    theElement      The HTMLElement to display the HTML in. 
 * @param    theClassType    A string that gives a class name to assign to the HTML element. 
 * @param    isMultiLine     a boolean indicating if text view is single line or multi-line
 */
MultiEntriesView.prototype = new View();  // makes MultiEntriesView be a subclass of View
function MultiEntriesView(theSuperview, theElement, theItem, theAttribute, theClassType) {
  Util.assert(theItem instanceof Item);
  //Util.assert(theAttribute instanceof Attribute); PENDING need to check that attribute is an attribute
  
  this.setSuperview(theSuperview);
  this.setHTMLElement(theElement);
  this._item = theItem;
  this._attribute = theAttribute;
  this._className = theClassType;
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
 *
 */
MultiEntriesView.prototype.noLongerProvisional = function() {
  Util.assert(this._entryViews.length == 1); // provisional item should only have one entry
  for (var i=0; i < this._entryViews.length; ++i) {
    this._entryViews[i].noLongerProvisional();
  }
};


/**
 *
 */
MultiEntriesView.prototype.select = function(inSelectFirst) {
  var index = inSelectFirst ? 0 : this._entryViews.length - 1;
  this._entryViews[index].startEditing();
};


/**
 *
 */
MultiEntriesView.prototype.setSuggestions = function(suggestionList) {
  for (var i=0; i < this._entryViews.length; ++i) {
    this._entryViews[i].setSuggestions(suggestionList);
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
 * Sets a function to be used when onclick is called to the TextView
 *
 * @scope    public instance method
 * @param    inEventObject    An event object. 
 */
MultiEntriesView.prototype.setClickFunction = function(inClickFunction) {
  Util.assert(inClickFunction instanceof Function);
  this._clickFunction = inClickFunction;
};

/**
 * Returns width for TextView edit field to set
 * HACK: See http://lists.berlios.de/pipermail/openrecord-dev/2005-June/000120.html
 *
 * @scope    public instance method
 */

MultiEntriesView.prototype.getTextViewWidth = function() {
  return this._myHTMLElement.offsetWidth;
};

/**
 *
 */
MultiEntriesView.prototype._handleClick = function(inEvent, inTextView) {
  if (this._clickFunction && this._clickFunction(inEvent, inTextView)) {
    return true;
  }
  return false;
};


/**
 *
 */
MultiEntriesView.prototype._handleOwnClick = function(inEvent) {
  var lastEntry = this._entryViews[this._entryViews.length-1];
  if (this._handleClick(inEvent, lastEntry)) {return true;}
  if (inEvent.target == this.getHTMLElement()) {lastEntry.startEditing();}
};


/**
 *
 */
MultiEntriesView.prototype._keyPressOnEditField = function(inEvent, inTextView) {
  Util.assert(inTextView instanceof TextView);
  var asciiValueOfKey = inEvent.keyCode;
  var move, doCreateNewEntry;
  switch (asciiValueOfKey) {
    case Util.ASCII_VALUE_FOR_LEFT_ARROW: move = -1; break;
    case Util.ASCII_VALUE_FOR_RIGHT_ARROW: move = 1; break;
    case Util.ASCII_VALUE_FOR_RETURN:
      if (inEvent.altKey) {
        doCreateNewEntry = true;
        break;
      }
      if (inTextView != this._entryViews[this._entryViews.length-1]) {move=1;}
      break;
    default: move = 0; break;
  }
  if (doCreateNewEntry) {
    inTextView.stopEditing();
    this._addSeparator();
    this._addEntryView(null).startEditing();
    return true;
  }
  if (move != 0) {
    var index = Util.getArrayIndex(this._entryViews, inTextView);
    Util.assert(index != -1);
    index += move;
    if (index >= 0 && index < this._entryViews.length) {
      inTextView.stopEditing();
      this._entryViews[index].startEditing();
      return true;
    }
  }
  if (this._keyPressFunction && this._keyPressFunction(inEvent, inTextView)) {
    return true;
  }
  return false;
};


/**
 *
 */
MultiEntriesView.prototype._addEntryView = function(inEntry) {
  var spanElt = document.createElement("span");
  spanElt.style.width = '100%';
  var aTextView = new TextView(this, spanElt, this._item, this._attribute, inEntry, this._className);
  this._entryViews.push(aTextView);
  this.getHTMLElement().appendChild(spanElt);
  aTextView.refresh();
  if (this.isInEditMode()) {
    var listener = this;
    aTextView.setKeyPressFunction(function (evt, aTxtView) {return listener._keyPressOnEditField(evt, aTxtView);});
    aTextView.setClickFunction(function (evt, aTxtView) {return listener._handleClick(evt, aTxtView);});
  }
  return aTextView;
};


/**
 *
 */
MultiEntriesView.prototype._addSeparator = function() {
  var spanElt = document.createElement("span");
  spanElt.appendChild(document.createTextNode(MultiEntriesView.SEPARATOR));
  spanElt.style.color = MultiEntriesView.SEPARATOR_COLOR;
  this.getHTMLElement().appendChild(spanElt);
  return spanElt;
};


/**
 * Re-creates all the HTML for the MultiEntriesView, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    public instance method
 */
MultiEntriesView.prototype._buildView = function() {
  var htmlElement = this.getHTMLElement();
  htmlElement.innerHTML = '';
  this._entryViews = [];
  
  var entries = this._item.getEntriesForAttribute(this._attribute);
  if (this._item.isProvisional() || entries.length == 0) {
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