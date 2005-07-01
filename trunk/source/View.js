/*****************************************************************************
 View.js
 
******************************************************************************
 Written in 2005 by Brian Douglas Skinner <brian.skinner@gumption.org>
  
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
/*global window, HTMLElement  */
/*global Util  */
// -------------------------------------------------------------------


/**
 * The View class serves as an abstract superclass for other view classes.
 *
 * @scope    public instance constructor
 * @syntax   DO NOT CALL THIS CONSTRUCTOR
 */
function View() {
  this._superview = null;
  this._htmlElement = null;
  this._myHasEverBeenDisplayedFlag = false; // PENDING: this is accessed directly by subclasses, which is bad
}


/**
 * Tells the View who its parent is in the view hierarchy.
 *
 * @scope    public instance method
 * @param    inSuperview    The superview for this view. 
 */
View.prototype.setSuperview = function (inSuperview) {
  // Util.assert(ViewInterface.isImplementedBy(inSuperview));

  this._superview = inSuperview;
};


/**
 * Returns the parent view in the view hierarchy.
 *
 * @scope    public instance method
 * @return   A View object. 
 */
View.prototype.getSuperview = function () {
  return this._superview;
};


/**
 * Tells the View what HTMLElement to display itself in.
 *
 * @scope    public instance method
 * @param    inHTMLElement    The HTMLDivElement to display the view in. 
 */
View.prototype.setHTMLElement = function (inHTMLElement) {
  Util.assert(inHTMLElement instanceof HTMLElement);

  this._htmlElement = inHTMLElement;
};


/**
 * Returns the HTMLElement that the view displays itself in.
 *
 * @scope    public instance method
 * @return   An HTMLElement. 
 */
View.prototype.getHTMLElement = function () {
  return this._htmlElement;
};


/**
 * Returns the World instance that this view is using.
 *
 * @scope    public instance method
 * @return   A World object. 
 */
View.prototype.getWorld = function () {
  return this._superview.getWorld();
};


/**
 * Returns the root view of the view hierarchy.
 *
 * @scope    public instance method
 * @return   An instance of RootView.
 */
View.prototype.getRootView = function() {
  if (!this.getSuperview()) {
    return null;
  } else {
    return this.getSuperview().getRootView();
  }
};


/**
 * Returns true if we are in Edit Mode.
 *
 * @scope    public instance method
 * @return   A boolean value. True if we are in Edit Mode.
 */
View.prototype.isInEditMode = function () {
  return this._superview.isInEditMode();
};


/**
 * Returns true if this view has ever been displayed
 *
 * @scope    public instance method
 * @return   A boolean value. True if the view has ever been displayed.
 */
View.prototype.hasEverBeenDisplayed = function () {
  return this._myHasEverBeenDisplayedFlag;
};


/**
 * Re-creates all the HTML for the View, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    public instance method
 */
View.prototype.refresh = function () {
  if (!this.hasEverBeenDisplayed()) {
    // generate HTML elements for the view
    this._myHasEverBeenDisplayedFlag = true;
  } else {
    // update existing HTML elements for the view
  }
};


/**
 * A toggle switch to set whether this view is drawn on-screen or hidden
 * off-screen.
 *
 * @scope    public instance method
 * @param    inBoolean    True if the view should be visible on screen. False if the view should be hidden off screen.
 */
View.prototype.includeOnScreen = function (inBoolean) {
  Util.assert(Util.isBoolean(inBoolean));

  if (inBoolean) {
    this.refresh();
    this._htmlElement.style.display = "block";
  } else {
    this._htmlElement.style.display = "none";
  }
};


// -------------------------------------------------------------------
// HTML element helper methods
// -------------------------------------------------------------------

/**
 * Given an HTML element, this method deletes all of the contents from
 * within the element.
 *
 * @scope    public class method
 * @param    element    An HTML element. 
 */
View.removeChildrenOfElement = function(element) {
  Util.assert(element instanceof HTMLElement);
  element.innerHTML = '';
};


/**
 * Given an HTML element, we first call document.createElement() to 
 * create a new element, and then call appendChild() to add the new 
 * element to the given element.
 *
 * @scope    public class method
 * @param    inElement    The existing element that we should append the new element to. 
 * @param    inTagName    The HTML tag for the element ("div", "p", "span", etc.). 
 * @param    inClassName    Optional. The HTML/CSS class to assign to the new element. 
 * @param    inId    Optional. The HTML id to assign to the new element. 
 * @return   The newly created HTML element.
 */
View.createAndAppendElement = function (inElement, inTagName, inClassName, inId) {
  Util.assert(inElement instanceof HTMLElement);
  Util.assert(Util.isString(inTagName));
  Util.assert(!inClassName || Util.isString(inClassName));
  Util.assert(!inId || Util.isString(inId));

  var newElement = window.document.createElement(inTagName);
  if (inClassName) {
    newElement.className = inClassName;
  }
  if (inId) {
    newElement.id = inId;
  }
  inElement.appendChild(newElement);
  return newElement;
};


/**
 * Given an HTML element, we first call document.createTextNode() to 
 * create a new text node, and then call appendChild() to add the new 
 * text node to the given element.
 *
 * @scope    public class method
 * @param    inElement    The existing element that we should append the new element to. 
 * @param    inText    The text string to put in the text node.
 * @return   The newly created text node.
 */
View.createAndAppendTextNode = function (inElement, inText) {
  Util.assert(inElement instanceof HTMLElement);
  Util.assert(Util.isString(inText));

  var newTextNode = window.document.createTextNode(inText);
  inElement.appendChild(newTextNode);
  return newTextNode;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
