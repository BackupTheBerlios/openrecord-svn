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
 * @param    theItem         The Item to be displayed and edited by this view. 
 * @param    theAttribute    The attribute of the item to be displayed 
 * @param    theDivElement   The HTMLDivElement to display the HTML in. 
 */
function MultiLineTextView(theItem, theAttribute, theDivElement, classType) {
  Util.assert(theItem instanceof Item);
  //Util.assert(theAttribute instanceof Attribute); FIXME need to check that attribute is an attribute
  //Util.assert(inDivElement instanceof HTMLDivElement);
  
  this.textItem = theItem;
  this.attribute = theAttribute;
  this.editMode = true;
  this.editField = null;
  this.textObj = null;
  this.classType = classType;
  this.setDivElement(theDivElement);
  this.isEditing = false;
};

// -------------------------------------------------------------------
// MultiLineTextView.setDivElement()
//   public instance method
// -------------------------------------------------------------------
MultiLineTextView.prototype.setDivElement = function(theDivElement) {
  Util.assert(theDivElement instanceof HTMLDivElement);
  this.divElement = theDivElement;
  if (theDivElement) {
    var listener = this;
    theDivElement.addEventListener("click",
      function(event) {listener.onClick(event)},
      false);
    this.display();
  }
};

MultiLineTextView.prototype.display = function() {
  if (!this.divElement) return;
  Util.assert(this.divElement instanceof HTMLDivElement);
  
  var textList = this.textItem.getValueListFromAttribute(this.attribute);
  var textString = "";
  for (var i in textList) {
    textString = textList[i] + "\n" + textString;
  };
  
  this.textNode = document.createTextNode(textString);
  this.divElement.appendChild(this.textNode);
}
  
// -------------------------------------------------------------------
// MultiLineTextView.onClick()
//  public instance method
//  handle mouse click on text view. Called by listener   
// -------------------------------------------------------------------
MultiLineTextView.prototype.onClick = function(eventObj) {
  eventObj = eventObj || window.event;
  this.startEditing();
}

// -------------------------------------------------------------------
// MultiLineTextView.onClick()
//  public instance method
//  Switch to edit text field for editing 
// -------------------------------------------------------------------
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
// MultiLineTextView.onClick()
//  public instance method
//  handles loss of focus for text view. Called by listener   
//  switches back to static text from editable text
// -------------------------------------------------------------------
MultiLineTextView.prototype.onBlur = function(eventObj) {
  var newText = this.editField.value;
  this.textItem.clear(this.attribute);
  this.textItem.assign(this.attribute,newText); //FIXME: need to deal with multi valued attrs
  this.textNode.data = newText;
  this.divElement.replaceChild(this.textNode,this.editField);
  this.isEditing = false;
}


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
  