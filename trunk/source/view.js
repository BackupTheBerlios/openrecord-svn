/*****************************************************************************
 view.js
 
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
// Dependencies:
//   util.js
// -------------------------------------------------------------------


/**
 * The View class serves as an abstract superclass for other view classes.
 *
 * @scope    public instance constructor
 * @syntax   DO NOT CALL THIS CONSTRUCTOR
 */
function View() {
  // alert("View constructor");
  this._mySuperview = null;
  this._myDivElement = null;
}


/**
 * Tells the View who its parent is in the view hierarchy.
 *
 * @scope    public instance method
 * @param    inSuperview    The superview for this view. 
 */
View.prototype.setSuperview = function (inSuperview) {
  // Util.assert(ViewInterface.isImplementedBy(inSuperview));

  this._mySuperview = inSuperview;
};


/**
 * Returns the parent view in the view hierarchy.
 *
 * @scope    public instance method
 * @return   A View object. 
 */
View.prototype.getSuperview = function () {
  return this._mySuperview;
};


/**
 * Tells the View what HTMLDivElement to display itself in.
 *
 * @scope    public instance method
 * @param    inDivElement    The HTMLDivElement to display the view in. 
 */
View.prototype.setDivElement = function (inDivElement) {
  Util.assert(inDivElement instanceof HTMLDivElement);

  this._myDivElement = inDivElement;
  // this.display();
};


/**
 * Returns the HTMLDivElement that the view displays itself in.
 *
 * @scope    public instance method
 * @return   An HTMLDivElement. 
 */
View.prototype.getDivElement = function () {
  return this._myDivElement;
};


/**
 * Returns the Stevedore instance that this view is using.
 *
 * @scope    public instance method
 * @return   A Stevedore object. 
 */
View.prototype.getStevedore = function () {
  return this._mySuperview.getStevedore();
};


/**
 * Returns true if we are in Edit Mode.
 *
 * @scope    public instance method
 * @return   A boolean value. True if we are in Edit Mode.
 */
View.prototype.isInEditMode = function () {
  return this._mySuperview.isInEditMode();
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
    this._myDivElement.style.display = "block";
  } else {
    this._myDivElement.style.display = "none";
  }
};


// -------------------------------------------------------------------
// HTML element helper methods
// -------------------------------------------------------------------

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


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------

