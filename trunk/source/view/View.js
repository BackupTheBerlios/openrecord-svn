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
// Provides and Requires
// -------------------------------------------------------------------
dojo.provide("orp.view.View");
dojo.require("orp.util.Util");

// -------------------------------------------------------------------
// Dependencies, expressed in the syntax that JSLint understands:
// 
/*global window, HTMLElement  */
/*global Util  */
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------
/**
 * The View class serves as an abstract superclass for other view classes.
 *
 * @scope    public instance constructor
 * @param    superview    The superview for this view. 
 * @param    htmlElement    The HTMLElement to display this view in. 
 * @param    className    Optional. The CSS className to assign to the htmlElement.
 */
orp.view.View = function(superview, htmlElement, className) {
  if (!superview) {return;} // initial call that subclasses of PluginViews make without parameters
  this._superview = superview;
  this._htmlElement = htmlElement;
  this._className = className;
  if (this._className) {
    this._htmlElement.className = this._className;
  }
  this._myHasEverBeenDisplayedFlag = false; // PENDING: this is accessed directly by subclasses, which is bad
};


// -------------------------------------------------------------------
// Public instance methods
// -------------------------------------------------------------------

/**
 * Returns the parent view in the view hierarchy.
 *
 * @scope    public instance method
 * @return   A View object. 
 */
orp.view.View.prototype.getSuperview = function() {
  return this._superview;
};


/**
 * Returns the HTMLElement that the view displays itself in.
 *
 * @scope    public instance method
 * @return   An HTMLElement. 
 */
orp.view.View.prototype.getHtmlElement = function() {
  return this._htmlElement;
};


/**
 * Returns the CSS className associated with this view.
 *
 * @scope    public instance method
 * @return   An HTMLElement. 
 */
orp.view.View.prototype.getClassName = function() {
  return this._className;
};


/**
 * Returns the World instance that this view is using.
 *
 * @scope    public instance method
 * @return   A World object. 
 */
orp.view.View.prototype.getWorld = function() {
  return this._superview.getWorld();
};


/**
 * Returns the root view of the view hierarchy.
 *
 * @scope    public instance method
 * @return   An instance of RootView.
 */
orp.view.View.prototype.getRootView = function() {
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
orp.view.View.prototype.isInEditMode = function() {
  return this._superview.isInEditMode();
};


/**
 * Returns true if this view has ever been displayed
 *
 * @scope    public instance method
 * @return   A boolean value. True if the view has ever been displayed.
 */
orp.view.View.prototype.hasEverBeenDisplayed = function() {
  return this._myHasEverBeenDisplayedFlag;
};


/**
 * Re-creates all the HTML for the View, and hands the HTML to the 
 * browser to be re-drawn.
 *
 * @scope    public instance method
 */
orp.view.View.prototype.refresh = function() {
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
 * @param    visibleFlag    True if the view should be visible on screen. False if the view should be hidden off screen.
 */
orp.view.View.prototype.includeOnScreen = function(visibleFlag) {
  orp.util.assert(orp.util.isBoolean(visibleFlag));

  if (visibleFlag) {
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
orp.view.View.removeChildrenOfElement = function(element) {
  orp.util.assert(element instanceof HTMLElement);
  element.innerHTML = '';
};


/**
 * This method calls document.createElement() to create a new element, and 
 * then initialized the new element with the values provided by the caller.
 *
 * @scope    public class method
 * @param    tagName    The HTML tag for the element ("div", "p", "span", etc.). 
 * @param    cssClassName    Optional. The HTML/CSS class to assign to the new element. 
 * @param    attributesInJson    Optional. A JSON object with additional attributes to set on the new element. 
 * @param    text    Optional. A text string to put in a text node within the new element. 
 * @return   The newly created HTML element.
 */
orp.view.View.newElement = function(tagName, cssClassName, attributesInJson, text) {
  orp.util.assert(orp.util.isString(tagName));
  orp.util.assert(!cssClassName || orp.util.isString(cssClassName));
  orp.util.assert(!attributesInJson || orp.util.isObject(attributesInJson));
  orp.util.assert(!text|| orp.util.isString(text));

  var newElement = window.document.createElement(tagName);
  if (cssClassName) {
    newElement.className = cssClassName;
  }
  if (attributesInJson) {
    for (var key in attributesInJson) {
      if (key == 'id') {
        newElement.id = attributesInJson[key];
      } else {
        newElement.setAttribute(key, attributesInJson[key]);
      }
    }
  }
  if (text) {
    newElement.appendChild(window.document.createTextNode(text));
  }
  return newElement;
};


/**
 * Given an HTML element, we first call document.createElement() to 
 * create a new element, and then call appendChild() to add the new 
 * element to the given element.
 *
 * Example:
 * <pre>
 * var menuUrl = "http://en.wikipedia.org/";
 * var menuText = "Wikipedia";
 * var menuItem = orp.view.View.appendNewElement(mainMenu, "li", orp.view.NavbarView.cssClass.MENU_ITEM);
 * var link = orp.view.View.appendNewElement(menuItem, "a", null, {href: menuUrl}, menuText);
 * </pre>
 *
 * @scope    public class method
 * @param    parentElement    The existing element that we should append the new element to. 
 * @param    tagName    The HTML tag for the element ("div", "p", "span", etc.). 
 * @param    cssClassName    Optional. The HTML/CSS class to assign to the new element. 
 * @param    attributesInJson    Optional. A JSON object with additional attributes to set on the new element. 
 * @param    text    Optional. A text string to put in a text node within the new element. 
 * @return   The newly created HTML element.
 */
orp.view.View.appendNewElement = function(parentElement, tagName, cssClassName, attributesInJson, text) {
  orp.util.assert(parentElement instanceof HTMLElement);
  
  var newElement = orp.view.View.newElement(tagName, cssClassName, attributesInJson, text);
  parentElement.appendChild(newElement);
  return newElement;
};


/**
 * Given an HTML element, we first call document.createTextNode() to 
 * create a new text node, and then call appendChild() to add the new 
 * text node to the given element.
 *
 * @scope    public class method
 * @param    parentElement    The existing element that we should append the new element to. 
 * @param    textString    The text string to put in the text node.
 * @return   The newly created text node.
 */
orp.view.View.appendNewTextNode = function(parentElement, textString) {
  orp.util.assert(parentElement instanceof HTMLElement);
  orp.util.assert(orp.util.isString(textString));

  var newTextNode = window.document.createTextNode(textString);
  parentElement.appendChild(newTextNode);
  return newTextNode;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
