/*****************************************************************************
 util.js
 
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
 

/**
 * The Util class offers general utility methods that might
 * be useful in a wide variety of applications.
 *
 * There is no need to ever call this constructor.  All the Util
 * methods are class methods, not instance methods, and the only 
 * reason this constructor exists is to cause the name "Util"
 * to be a globally-scoped class name, which the class methods 
 * can then be attached to.
 *
 * @scope    public instance constructor
 * @syntax   DO NOT CALL THIS CONSTRUCTOR
 */
function Util() {
}


// -------------------------------------------------------------------
// Util public class constants
// -------------------------------------------------------------------
Util.ASCII_VALUE_FOR_RETURN = 13;
Util.ASCII_VALUE_FOR_TAB = 9;
Util.ASCII_VALUE_FOR_ESCAPE = 27;

// &#37; = %
// &#38; = &
// &#39; = '
// &#40; = (
Util.ASCII_VALUE_FOR_LEFT_ARROW = 37;  // 123
Util.ASCII_VALUE_FOR_UP_ARROW = 38;    // 126
Util.ASCII_VALUE_FOR_RIGHT_ARROW = 39; // 124
Util.ASCII_VALUE_FOR_DOWN_ARROW = 40;  // 125


// -------------------------------------------------------------------
// String manipulation methods
// -------------------------------------------------------------------

/**
 * Returns a copy of the input string, cleaned up so that it can be 
 * included in a valid HTML page.
 *
 * Returns a copy of the string, but with the original characters 
 * '<', '>', and '&' all replaced by their HTML entities: "&lt;", 
 * "&gt;", and "&amp;".  Allows strings to displayed on HTML pages.
 *
 * @scope    public class method
 * @syntax   var cleanString = Util.getCleanString(dirtyString);
 * @param    inString    A dirty string to be cleaned up.
 * @return   String
 */
Util.getCleanString = function(inString) {
  Util.assert(Util.isString(inString));
  
  var returnString = inString;
  returnString = returnString.replace(/&/g, "&amp;");
  returnString = returnString.replace(/</g, "&lt;");
  returnString = returnString.replace(/>/g, "&gt;");
  returnString = returnString.replace(/"/g, "&quot;");
  return returnString;
};


// -------------------------------------------------------------------
// Assertions and error handling methods
// -------------------------------------------------------------------

/**
 * Registers a function to be used to report errors.
 *
 * @scope    public class method
 * @param    inFunction    A function which takes a single string argument. 
 */
Util.setErrorReportCallback = function (inFunction) {
  Util.ourErrorReporter = inFunction;
};


/**
 * This defaultErrorReporter simply calls "alert" to report errors.
 *
 * @scope    public class method
 * @param    inText    The error message to be reported. 
 */
Util.defaultErrorReporter = function (inText) {
  window.alert(inText);
};
Util.ourErrorReporter = Util.defaultErrorReporter;

 
 /**
 * Pops up an alert box showing an error message.
 *
 * @scope    public class method
 * @param    inMessage    A string describing the error.
 * @param    inUrl    A string that gives the name of the file where the error was found.
 * @param    inLine    The line number where the error was found.
 */
Util.handleError = function (inMessage, inUrl, inLine) {
  Util.ourErrorReporter("Util.handleError()\n" + inMessage + "\nline: " + inLine + "\nURL: " + inUrl);
};


/**
 * Pops up an alert box if the assertion fails.
 *
 * If the asserted condition is true, this method does nothing. If the condition
 * is false, this method pops up an alert box.  The alert box explains that an
 * assertion failed, and it gives a stack trace showing the file name and line
 * number where the assertion failed.
 *
 * @scope    public class method
 * @param    inBoolean    A boolean value, which needs to be true for the assertion to succeed. 
 * @param    inMessage    Optional. A string describing the assertion.
 */
Util.assert = function (inBoolean, inMessage) {
  var exception = new Error();  // create an exception, just to get a stack trace
  var stackString = exception.stack;
  var stackList = stackString.split("\n");
  stackList.shift(); // get rid of the "ReferenceError()@:0" at the start of the list
  stackList.shift(); // get rid of the "(false)@file ... util.js:67" at the start of the list
  stackList.pop();   // get rid of the trailing "\n"
  stackList.pop();   // get rid of the "@:0" at the end of the list
  stackString = stackList.join("\n");
  if (Util.isBoolean(inBoolean)) {
    if (!inBoolean) {    
      Util.ourErrorReporter("An assert statement failed.\nThe method Util.assert() was called with a 'false' value.\nHere's the stack trace, with the line number where the assert statement failed:\n" + (stackString || ""));
    }
  } else {
    Util.ourErrorReporter("An assert statement went sour.\nThe method Util.assert() was passed a non-boolean argument.\nHere's the stack trace, with the line number where the assert statement failed:\n" + (stackString || ""));
  }
};


// -------------------------------------------------------------------
// Type checking methods
// -------------------------------------------------------------------

/**
 * Returns true if the given value is a string.
 *
 * @scope    public class method
 * @param    inValue    Any object or literal value. 
 * @return   A boolean value. True if inValue is a string.
 */
Util.isString = function (inValue) {
  return (typeof(inValue) == "string");
};


/**
 * Returns true if the given value is a number (and is finite number).
 *
 * @scope    public class method
 * @param    inValue    Any object or literal value. 
 * @return   A boolean value. True if inValue is a number.
 */
Util.isNumber = function (inValue) {
  return ((typeof(inValue) == "number") && isFinite(inValue));
};


/**
 * Returns true if the given value is a number or a string that 
 * represents a number.
 *
 * @scope    public class method
 * @param    inValue    Any object or literal value. 
 * @return   A boolean value. True if inValue is a number or a string that represents a number.
 */
Util.isNumeric = function (inValue) {
  var isNumber = Util.isNumber(inValue);
  if (isNumber) {
    return true;
  }
  var isNumeric = Util.isString(inValue) && Util.isNumber(parseInt(inValue));
  return isNumeric;
};


/**
 * Returns true if the given value is a boolean.
 *
 * @scope    public class method
 * @param    inValue    Any object or literal value. 
 * @return   A boolean value. True if inValue is a boolean.
 */
Util.isBoolean = function (inValue) {
  return (typeof(inValue) == "boolean");
};


/**
 * Returns true if the given value is an object.
 *
 * @scope    public class method
 * @param    inValue    Any object or literal value. 
 * @return   A boolean value. True if inValue is an object.
 */
Util.isObject = function (inValue) {
  return (inValue && (typeof(inValue) == "object"));
};


/**
 * Returns true if the given value is an array.
 *
 * @scope    public class method
 * @param    inValue    Any object or literal value. 
 * @return   A boolean value. True if inValue is an array.
 */
Util.isArray = function (inValue) {
  return (inValue && (typeof(inValue) == "object") && (inValue.constructor == Array));
};


/**
 * Returns true if the given value is a hash table.
 *
 * @scope    public class method
 * @param    inValue    Any object or literal value. 
 * @return   A boolean value. True if inValue is a hash table.
 */
Util.isHashTable = function (inValue) {
  return (inValue && (typeof(inValue) == "object"));  // FIX_ME: we should be more restrictive!
};


// -------------------------------------------------------------------
// Methods that operate on Sets
// -------------------------------------------------------------------

/**
 * Returns true if the given object is a member of the set.  
 * 
 * @scope    public class method
 * @param    inObject    The object to look for. 
 * @param    inSet    The Array to look for the object in. 
 * @return   Returns true if the object was found in the set.
 */
Util.isObjectInSet = function (inObject, inSet) {
  Util.assert(Util.isArray(inSet));
  
  for (var i=0; i<inSet.length; i+=1) {
    if (inSet[i] == inObject) {
      return true;
    }
  }
  return false;
};


/**
 * Removes an object from an array.  
 * 
 * @scope    public class method
 * @param    inObject    The object to be removed. 
 * @param    inSet    The Array that the object should be removed from. 
 * @return   Returns true if the object was removed from the array.
 */
Util.removeObjectFromSet = function (inObject, inSet) {
  Util.assert(Util.isArray(inSet));
  
  if (!inObject) {
    return false;
  }
  for (var i=0; i<inSet.length; i+=1) {
    if (inSet[i] == inObject) {
      inSet.splice(i, 1);
      return true;
    }
  }
  return false;
};


/**
 * This method is similar to array.push(object), but it will only add the
 * object to the array if the object is not already in the array.  
 * 
 * @scope    public class method
 * @param    inObject    The object to be added. 
 * @param    inSet    The Array that the object should be added to. 
 * @return   Returns true if the object was added to the array.
 */
Util.addObjectToSet = function (inObject, inSet) {
  Util.assert(Util.isArray(inSet));

  if (!inObject) {
    return false;
  }
  if (Util.isObjectInSet(inObject, inSet)) {
    return false;
  }
  inSet.push(inObject);
  return true;
};


// -------------------------------------------------------------------
// Methods that deal with event handling
// -------------------------------------------------------------------

/**
 * Given an event object, returns the HTML element that was the 
 * target of the event.  
 * 
 * Should work for IE, Mozilla, and _some_ other browsers.  
 *
 * @scope    public class method
 * @param    inEventObject    An event object. 
 * @return   An HTML element.
 */
Util.getTargetFromEvent = function (inEventObject) {
  var target = null;
  if (inEventObject.target) {
    target = inEventObject.target;
  } else {
    if (inEventObject.srcElement) {
      target = inEventObject.srcElement;
    }
  }
  if (target && target.nodeType == 3) { // defeat Safari bug
    target = target.parentNode;
  }
  return target;
};


/**
 * This function allows Views to register an event listener in an 
 * object-oriented manner, allowing a specific object's handleEvent() 
 * method to be called. 
 *
 * @scope public class method
 * @param inElement    An HTMLElement.
 * @param inEventtype    The type of event (e.g. "mousedown", "click").
 * @param inView    The object whose handleEvent() method is to be called.
 * @param inCaptures    True if the event should be captured by this function.
 */
Util.registerObjectEventHandler = function(inElement, inEventtype, inView, inCaptures) {
  inElement.addEventListener(inEventtype,
    function(event) { inView.handleEvent(event);},
    inCaptures);
};


// -------------------------------------------------------------------
// HTML document manipulation
// -------------------------------------------------------------------

/**
 * Looks at all the anchor links in the document, finds the ones with the 
 * attribute rel="external", and sets the target attribute of those anchor
 * links so that the links will open in a new browser window.  
 * 
 * @scope    public class method
 */
Util.setTargetsForExternalLinks = function () {
  if (!window.document.getElementsByTagName) {
    return;
  }
  var listOfAnchorElements = window.document.getElementsByTagName("a");
  for (var i=0; i<listOfAnchorElements.length; i+=1) {
    var anchor = listOfAnchorElements[i];
    // FIX_ME: This only works if the "rel" attribute has a single value == "external".
    // To make it work with multi-valued rel attributes, we should do some regular
    // expression matching to check for strings like "external", "foo external", 
    // and "external foo".
    if (anchor.getAttribute("href") && (anchor.getAttribute("rel") == "external")) {
      anchor.target = "_blank";
    }
  }
};

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
