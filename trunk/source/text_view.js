/*****************************************************************************
 text_view.js
 
******************************************************************************
 Written in 2005 by Brian Douglas Skinner <brian.skinner@gumption.org>
 and Chih-Chao Lam <chao@cs.stanford.edu>
  
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


/**
 * An instance of MultiLineTextView can be placed in any parent container View
 * to display and (if in edit mode) edit multi-lines of text
 *
 * @scope    public instance constructor
 * @param    theSuperview    The view that this view is nested in. 
 * @param    theItem    The Item to be displayed and edited by this view. 
 * @param    theAttribute    The attribute of the item to be displayed.
 * @param    theDivElement    The HTMLDivElement to display the HTML in. 
 * @param    theClassType    A string that gives a class name to assign to the HTML element. 
 */
function MultiLineTextView(theSuperview, theDivElement, theItem, theAttribute, theClassType) {
  Util.assert(theItem instanceof Item);
  //Util.assert(theAttribute instanceof Attribute); PROBLEM need to check that attribute is an attribute
  //Util.assert(inDivElement instanceof HTMLDivElement);
  
  this.mySuperview = theSuperview;
  this.textItem = theItem;
  this.attribute = theAttribute;
  this.editField = null;
  this.textObj = null;
  this.classType = theClassType;
  this.isEditing = false;
  this._myHasEverBeenDisplayedFlag = false;
  this.setDivElement(theDivElement);
};


/**
 * Tells the MultiLineTextView what HTMLDivElement to display itself in.
 *
 * @scope    public instance method
 * @param    inDivElement    The HTMLDivElement to display in. 
 */
MultiLineTextView.prototype.setDivElement = function(theDivElement) {
  Util.assert(theDivElement instanceof HTMLDivElement);
  this.divElement = theDivElement;
  if (theDivElement) {
    var listener = this;
    theDivElement.addEventListener("click",
      function(event) {listener.onClick(event)},
      false);
    this.refresh();
  }
};


/**
 * Returns true if we are in Edit Mode.
 *
 * @scope    public instance method
 * @return   A boolean value. True if we are in Edit Mode.
 */
MultiLineTextView.prototype.isInEditMode = function () {
  return this.mySuperview.isInEditMode();
};

  
/**
 * Updates the HTML elements in this view to reflect any changes in 
 * the item's attribute values.
 *
 * @scope    public instance method
 */
MultiLineTextView.prototype.refresh = function() {
  if (!this._myHasEverBeenDisplayedFlag) {
    this.doInitialDisplay();
  } else {
    // if (weHaveBeenNotifiedOfChangesTo(this.textItem)) {
    //   var newText = getNewValueFrom(this.textItem);
    //   this.textNode.data = newText;
    // }
  }
};


/**
 * Re-creates all the HTML for the MultiLineTextView, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    public instance method
 */
MultiLineTextView.prototype.doInitialDisplay = function() {
  if (!this.divElement) return;
  Util.assert(this.divElement instanceof HTMLDivElement);
  
  var textList = this.textItem.getValueListFromAttribute(this.attribute);
  var textString = "";
  for (var i in textList) {
    textString = textList[i] + "\n" + textString;
  };
  
  this.textNode = document.createTextNode(textString);
  this.divElement.appendChild(this.textNode);
  this._myHasEverBeenDisplayedFlag = true;
};


/**
 * Switch to edit text field for editing.
 *
 * @scope    public instance method
 */
MultiLineTextView.prototype.startEditing = function() {
  if (!this.isEditing) {
    var editField = this.editField;
    if (!editField) {
      editField = this.editField = document.createElement("textarea");
      editField.className = this.classType;
      //editField.cols=80; now using css style sheet "text_view"
      var listener = this; 
      editField.addEventListener("blur",
        function(evt) {listener.onBlur(evt)},
        false);
      editField.defaultValue = this.textNode.data;
    }
    editField.style.height = this.divElement.offsetHeight + "px";
    this.divElement.replaceChild(editField,this.textNode);
    editField.focus();
    editField.select();
    this.isEditing = true;
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
MultiLineTextView.prototype.onClick = function(inEventObject) {
  inEventObject = inEventObject || window.event;
  if (this.isInEditMode()) {
    this.startEditing();
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
MultiLineTextView.prototype.onBlur = function(inEventObject) {
  if (this.isEditing) {
    var newText = this.editField.value;
    this.textItem.clear(this.attribute);
    this.textItem.assign(this.attribute,newText); //PROBLEM: need to deal with multi valued attrs
    this.textNode.data = newText;
    this.divElement.replaceChild(this.textNode,this.editField);
    this.isEditing = false;
  }
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
  