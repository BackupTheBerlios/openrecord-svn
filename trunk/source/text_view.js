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


// -------------------------------------------------------------------
// MultiLineTextView public class constants
// -------------------------------------------------------------------
MultiLineTextView.ELEMENT_CLASS_TEXT_BLOCK = "text_block";


/**
 * An instance of MultiLineTextView can be placed in any parent container View
 * to display and (if in edit mode) edit multi-lines of text
 *
 * @scope    public instance constructor
 * @extends  View
 * @param    theSuperview    The view that this view is nested in. 
 * @param    theItem    The Item to be displayed and edited by this view. 
 * @param    theAttribute    The attribute of the item to be displayed.
 * @param    theDivElement    The HTMLDivElement to display the HTML in. 
 * @param    theClassType    A string that gives a class name to assign to the HTML element. 
 */
MultiLineTextView.prototype = new View();  // makes MultiLineTextView be a subclass of View
function MultiLineTextView(theSuperview, theDivElement, theItem, theAttribute, theClassType) {
  Util.assert(theItem instanceof Item);
  //Util.assert(theAttribute instanceof Attribute); PENDING need to check that attribute is an attribute
  
  this.setSuperview(theSuperview);
  this.setDivElement(theDivElement);
  this.textItem = theItem;
  this.attribute = theAttribute;
  this.editField = null;
  this.textObj = null;
  this.classType = theClassType;
  this.isEditing = false;
  this._myHasEverBeenDisplayedFlag = false;
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
  var divElement = this.getDivElement();
  Util.assert(divElement instanceof HTMLDivElement);
  
  divElement.className = MultiLineTextView.ELEMENT_CLASS_TEXT_BLOCK;
  var textList = this.textItem.getValueListFromAttribute(this.attribute);
  var textString = "";
  for (var i in textList) {
    textString = textList[i] + "\n" + textString;
  };
  
  this.textNode = document.createTextNode(textString);
  divElement.appendChild(this.textNode);

  var listener = this;
  Util.addEventListener(divElement, "click", function(event) { listener.onClick(event);});
    
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
      Util.addEventListener(editField, "blur", function(event) {listener.onBlur(event);});
      editField.defaultValue = this.textNode.data;
    }
    editField.style.height = this.getDivElement().offsetHeight + "px";
    this.getDivElement().replaceChild(editField, this.textNode);
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
    this.textItem.assign(this.attribute, newText); // PENDING: need to deal with multi valued attrs
    this.textNode.data = newText;
    this.getDivElement().replaceChild(this.textNode, this.editField);
    this.isEditing = false;
  }
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
  