/*****************************************************************************
 SuggestionBox.js
 
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
/*global View  */
// -------------------------------------------------------------------


/**
 * A DetailPlugin display one or more content items. 
 *
 * @scope    public instance constructor
 * @param    htmlInputField    The HTMLElement that this suggestion box is associated with. 
 * @param    listOfItems    The items to populate the suggestion box with.
 */
function SuggestionBox(htmlInputField, listOfItems) {
  this._inputField = htmlInputField;
  this._listOfSuggestedItems = listOfItems.sort(SuggestionBox._compareItemDisplayStrings);
  this._selectedItem = null;
  this._shouldHide = htmlInputField.value.length === 0;
  
  this._suggestionBoxDivElement = View.appendNewElement(document.body, "div", "SuggestionBox");
  this._suggestionBoxDivElement.style.zIndex = 11;
  this._suggestionBoxDivElement.style.display = "none";

 /* this._inputField.onkeyup = this._keyPressOnInputField.bindAsEventListener(this);
  this._inputField.onfocus = this._focusOnInputField.bindAsEventListener(this);
  this._inputField.onblur = this._blurOnInputField.bindAsEventListener(this); */
  //this._keyPressOnInputField();
}


/**
 *
 */
SuggestionBox.prototype.getSelectedItem = function() {
  if (!this._selectedItem) {
    // check if typed item is identical to suggested item
    var editValue = this._inputField.value;
    // for (var i = 0; i < this._listOfSuggestedItems.length; ++i) {
    //   var item = this._listOfSuggestedItems[i];
    for (var key in this._listOfSuggestedItems) {
      var item = this._listOfSuggestedItems[key];
      if (editValue.toLowerCase() == item.getDisplayName().toLowerCase()) {
        return item;
      }
      if (editValue.toLowerCase() == item.getDisplayString().toLowerCase()) {
        return item;
      }
    }
  }
  return this._selectedItem;
};


/**
 *
 */
SuggestionBox._compareItemDisplayStrings = function(itemOne, itemTwo) {
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
SuggestionBox.prototype._focusOnInputField = function(eventObject) {
  this._redisplaySuggestionBox();
};


/**
 *
 */
SuggestionBox.prototype._keyPressOnInputField = function(eventObject) {
  var numberOfMatchingItems = this._listOfMatchingItems.length;
  if (numberOfMatchingItems === 0) {return false;}

  var asciiValueOfKey = eventObject.keyCode;
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
      if (this._inputField.value.length === 0) {return false;}
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
    this._redisplaySuggestionBox();
    return true;
  }
  if (doSelectItem) {
    this._inputField.value = this._selectedItem.getDisplayString();
    this._setShouldHide(true);
  }
  return false;
};


/**
 *
 */
SuggestionBox.prototype._keyUpOnInputField = function(eventObject) {
  this._redisplaySuggestionBox();
};


/**
 *
 */
SuggestionBox.prototype._blurOnInputField = function() {
  // make the suggestion box disappear
  this._suggestionBoxDivElement.style.display = "none";
};


/**
 *
 */
SuggestionBox.prototype._clickOnSelection = function(eventObject, item) {
  this._selectedItem = item;
};


/**
 *
 */
SuggestionBox.prototype._setShouldHide = function(shouldHide) {
  // make the suggestion box disappear
  this._shouldHide = shouldHide;
  this._selectedItem = null;
  if (shouldHide) {
    this._suggestionBoxDivElement.style.display = "none";
  }
  else {
    this._redisplaySuggestionBox();
  }
};


/**
 *
 */
SuggestionBox.prototype._redisplaySuggestionBox = function() {
  //if (this._shouldHide) {return;} // if SuggestionBox is in hide mode, don't show the box
  
  var partialInputString = this._inputField.value;
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
    this._suggestionBoxDivElement.style.display = "none";
  } else {
    View.removeChildrenOfElement(this._suggestionBoxDivElement);
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
    this._suggestionBoxDivElement.appendChild(table);

    // set-up the suggestion box to open just below the input field it comes from
    var suggestionBoxTop = Util.getOffsetTopFromElement(this._inputField) + this._inputField.offsetHeight;
    var suggestionBoxLeft = Util.getOffsetLeftFromElement(this._inputField);
    this._suggestionBoxDivElement.style.top = suggestionBoxTop + "px"; 
    this._suggestionBoxDivElement.style.left = suggestionBoxLeft + "px";
    // alert(this._inputField.offsetWidth);
    this._suggestionBoxDivElement.style.width = (this._inputField.offsetWidth - 2)+ "px";

    // this._suggestionBoxDivElement.className = "suggestion_box";
    this._suggestionBoxDivElement.style.visibility = "visible";
    this._suggestionBoxDivElement.style.display = "block";
  }
};

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
