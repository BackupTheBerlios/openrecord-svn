/*****************************************************************************
 Util.js
 
******************************************************************************
 Written in 2005 by 
    Brian Douglas Skinner <brian.skinner@gumption.org>
    Chih-Chao Lam <chao@cs.stanford.edu>
    Mignon Belongie
  
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

dojo.provide("orp.util.Util");
dojo.require("orp.lang.Lang");
dojo.require("dojo.lang.*");

// -------------------------------------------------------------------
// Dependencies, expressed in the syntax that JSLint understands:
/*global window, document  */
/*global hex_md5  */
// -------------------------------------------------------------------


/**
 * The Util file offers general utility functions that might
 * be useful in a wide variety of applications.
 */

// -------------------------------------------------------------------
// Public constants
// -------------------------------------------------------------------
orp.util.ASCII = {
  RETURN: 13,
  TAB: 9,
  ESCAPE: 27,
  LEFT_ARROW: 37,  // 123
  UP_ARROW: 38,    // 126
  RIGHT_ARROW: 39, // 124
  DOWN_ARROW: 40,  // 125
  BACKSPACE: 8,
  DELETE: 46 };
// &#37; = %
// &#38; = &
// &#39; = '
// &#40; = (



// -------------------------------------------------------------------
// Assertions and error handling methods
// -------------------------------------------------------------------

/**
 * Registers a function to be used to report errors.
 *
 * @scope    public class method
 * @param    errorReporterFunction    A function which takes a single string argument. 
 */
orp.util.setErrorReportCallback = function(errorReporterFunction) {
  orp.util.ourErrorReporter = errorReporterFunction;
};


/**
 * This defaultErrorReporter simply calls "alert" to report errors.
 *
 * @scope    public class method
 * @param    inText    The error message to be reported. 
 */
orp.util.defaultErrorReporter = function(text) {
  window.alert(text);
};
orp.util.ourErrorReporter = orp.util.defaultErrorReporter;

 
 /**
 * Pops up an alert box showing an error message.
 *
 * @scope    public class method
 * @param    message    A string describing the error.
 * @param    url    A string that gives the name of the file where the error was found.
 * @param    line    The line number where the error was found.
 */
orp.util.handleError = function(message, url, line) {
  orp.util.ourErrorReporter("orp.util.handleError()\n" + message + "\nline: " + line + "\nURL: " + url);
};


/**
 * Registers a function to be used to report status messages to the user.
 *
 * @scope    public class method
 * @param    statusReporterFunction    A function which takes a single string argument. 
 */
orp.util.setStatusReporter = function(statusReporterFunction) {
  orp.util.ourStatusReporter = statusReporterFunction;
};


/**
 * Reports a status message to the user.
 *
 * @scope    public class method
 * @param    message    A string with a status message.
 */
orp.util.displayStatusBlurb = function(message) {
  orp.util.ourStatusReporter(message);
};


/**
 * This defaultStatusReporter simply ignores the status report.
 *
 * @scope    public class method
 * @param    text    The status message to be reported. 
 */
orp.util.defaultStatusReporter = function(text) {
  // do nothing!
};
orp.util.ourStatusReporter = orp.util.defaultStatusReporter;


// -------------------------------------------------------------------
// Type checking methods
// -------------------------------------------------------------------


/**
 * Returns true if the given value is a number or a string that 
 * represents a number.
 *
 * @scope    public class method
 * @param    value    Any object or literal value. 
 * @return   A boolean value. True if inValue is a number or a string that represents a number.
 */
orp.util.isNumeric = function(value) {
  var isNumber = dojo.lang.isNumber(value);
  if (isNumber) {
    return true;
  }
  if (dojo.lang.isString(value)) {
    var asNumber = parseInt(value);
    var isNumeric = dojo.lang.isNumber(asNumber) && isFinite(asNumber);
    return isNumeric;
  }
  return false;
};


/**
 * Returns true if the given value is a Date.
 *
 * @scope    public class method
 * @param    value    Any object or literal value. 
 * @return   A boolean value. True if inValue is a Date.
 */
orp.util.isDate = function(value) {
  return (value instanceof Date);
};


/**
 * Returns true if the given value is a hash table.
 *
 * @scope    public class method
 * @param    value    Any object or literal value. 
 * @return   A boolean value. True if inValue is a hash table.
 */
orp.util.isHashTable = function(value) {
  return (value && ((typeof value) == "object"));  // PENDING: we should be more restrictive!
};


orp.util.isEmpty = function(object) {
  for (var key in object) {
    return false;
  }
  return true;
};


orp.util.hasProperty = function(object, property) {
  return (object[property] !== undefined);
};

orp.util.hasProperties = function(object, properties) {
  for (var i in properties) {
    if (object[properties[i]] === undefined) { return false; }
  }
  return true;
};

orp.util.hasNoUnexpectedProperties = function(object, expectedProperties) {
  for (var key in object) {
    if (!orp.util.isObjectInSet(key, expectedProperties)) { return false; }
  }
  return true;
};
  
orp.util.hasExactlyTheseProperties = function(object, properties) {
  if (!orp.util.hasProperties(object, properties)) { return false; }
  if (!orp.util.hasNoUnexpectedProperties(object, properties)) { return false; }
  return true;
};

// -------------------------------------------------------------------
// Methods that operate on Arrays
// -------------------------------------------------------------------

/**
 * Given an element in an array, returns the position of the element in
 * the array.  
 * 
 * @scope    public class method
 * @param    array    The Array to look for the element in. 
 * @param    value    The array element to find the position of. 
 * @return   Returns a number between 0 and array.length, or -1 if the element was not in the array.
 */
orp.util.getArrayIndex = function(array, value) {
  for (var i=0; i<array.length; ++i) {
    if (array[i] == value) {
      return i;
    }
  }
  return -1;
};


// -------------------------------------------------------------------
// Methods that operate on Sets
// -------------------------------------------------------------------

/**
 * Returns true if the given object is a member of the set.  
 * 
 * @scope    public class method
 * @param    object    The object to look for. 
 * @param    set    The Array to look for the object in. 
 * @return   Returns true if the object was found in the set.
 */
orp.util.isObjectInSet = function(object, set) {
  orp.lang.assertType(set, Array);
  
  for (var key in set) {
    if (set[key] == object) {
      return true;
    }
  }
  return false;
};


/**
 * Returns true if each of the given objects is a member of the set.  
 * 
 * @scope    public class method
 * @param    array    An array of objects to look for. 
 * @param    set    The Array to look for the objects in. 
 * @return   Returns true if each of the objects was found in the set.
 */
orp.util.areObjectsInSet = function(array, set) {
  orp.lang.assertType(array, Array);
  orp.lang.assertType(set, Array);
  
  for (var key in array) {
    var object = array[key];
    var objectIsInSet = orp.util.isObjectInSet(object, set);
    if (!objectIsInSet) {
      return false;
    }
  }
  return true;
};


/**
 * Removes an object from an array.  
 * 
 * @scope    public class method
 * @param    object    The object to be removed. 
 * @param    set    The Array that the object should be removed from. 
 * @return   Returns true if the object was removed from the array.
 */
orp.util.removeObjectFromSet = function(object, set) {
  orp.lang.assertType(set, Array);
  
  if (!object) {
    return false;
  }
  for (var i=0; i<set.length; i+=1) {
    if (set[i] == object) {
      set.splice(i, 1);
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
 * @param    object    The object to be added. 
 * @param    set    The Array that the object should be added to. 
 * @return   Returns true if the object was added to the array.
 */
orp.util.addObjectToSet = function(object, set) {
  orp.lang.assertType(set, Array);

  if (!object) {
    return false;
  }
  if (orp.util.isObjectInSet(object, set)) {
    return false;
  }
  set.push(object);
  return true;
};


/**
 * Returns the number of values in a hash table. 
 * 
 * @scope    public class method
 * @param    hashTable   A hashTable containing values.
 * @return   The number of values in inHashTable.
 */
orp.util.lengthOfHashTable = function(hashTable) {
  orp.lang.assert(orp.util.isHashTable(hashTable));
  var count = 0;
  for (var key in hashTable) {
    count += 1;
  }
  return count;
};


/**
 * Return the values of a HashTable in the form of an Array
 * Analogous to Python hash.values() 
 * 
 * @scope    public class method
 * @param    hashTable   A hashTable containing values.
 * @return   An array containing the values that are in inHashTable.
 */
orp.util.hashTableValues = function(hashTable) {
  orp.lang.assert(orp.util.isHashTable(hashTable));
  var returnArray = [];
  for (var key in hashTable) {
    returnArray.push(hashTable[key]);
  }
  return returnArray;
};

orp.util.trimString = function(str) {
  return str.replace(/^\s*|\s*$/g,"");
};


// -------------------------------------------------------------------
// Methods for doing encryption
// -------------------------------------------------------------------

orp.util.hex_md5 = function(string) {
  // Calls the hex_md5() function in .../trunk/third_party/md5/md5.js
  return hex_md5(string);
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
 * @param    eventObject    An event object. 
 * @return   An HTML element.
 */
orp.util.getTargetFromEvent = function(eventObject) {
  var target = null;
  if (eventObject.target) {
    target = eventObject.target;
  } else {
    if (eventObject.srcElement) {
      target = eventObject.srcElement;
    }
  }
  if (target && target.nodeType == 3) { // defeat Safari bug
    target = target.parentNode;
  }
  return target;
};


/**
 * When passing an EventListener (e.g. onclick) a function, it is often useful to
 * 1) have the function be called by an instance of an object
 * 2) have additional arguments passed as parameters to the function
 * 3) some of these additional parameters in (2) are known only when the
 *    EventListener function is bound, not when the function is called
 * This utility function returns  a function that satisfies the above 3 reqs.
 * For more details see, http://www.deepwood.net/writing/method-references.html.utf8
 * However, empirically, arguments is not an array in Firefox and cannot be
 * concat'd with an array, hence the mod.
 */
Function.prototype.orpBindAsEventListener = function(object) {
  var method = this;
  var preappliedArguments = arguments;
  return function (event) {
    var args = [event || window.event];
    for (var i = 1; i < preappliedArguments.length; ++i) {
      args.push(preappliedArguments[i]);
    }
    method.apply(object, args);
  };
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
orp.util.setTargetsForExternalLinks = function() {
  if (!window.document.getElementsByTagName) {
    return;
  }
  var listOfAnchorElements = window.document.getElementsByTagName("a");
  var regExp = new RegExp("\\b" + "external" + "\\b");
  for (var i=0; i<listOfAnchorElements.length; i+=1) {
    var anchor = listOfAnchorElements[i];
    if (anchor.getAttribute("href") && (anchor.getAttribute("rel")) && (anchor.getAttribute("rel").search(regExp) != -1)) {
      anchor.target = "_blank";
    }
  }
};


/**
 * Given the filename of an image, returns an HTML img element.
 * 
 * @scope    public class method
 * @return   An HTML "img" element.
 */
orp.util.createImageElement = function(imageFileName) {
  var imagesDirectory = "images/"; // FIXME: this shouldn't be hard-coded in Util
  var imageElement = document.createElement("img");
  imageElement.src = imagesDirectory + imageFileName;
  return imageElement;
};


/**
 * Given an HTML element, find the real left offset for the element,  
 * meaning the distance in pixels from the left edge of the page.
 *
 * @scope    public class method
 * @param    htmlElement    The HTML element that we want the left offest of. 
 * @return   An integer value equal to the number of pixels from the left of the page to htmlElement.
 */
orp.util.getOffsetLeftFromElement = function(htmlElement) {
  var cumulativeOffset = 0;
  if (htmlElement.offsetParent) {
    while (htmlElement.offsetParent) {
      cumulativeOffset += htmlElement.offsetLeft;
      htmlElement = htmlElement.offsetParent;
    }
  } else {
    if (htmlElement.x) {
      cumulativeOffset += htmlElement.x;
    }
  }
  return cumulativeOffset;
};


/**
 * Given an HTML element, find the real top offset for the element,  
 * meaning the distance in pixels from the top edge of the page.
 *
 * @scope    public class method
 * @param    htmlElement    The HTML element that we want the top offest of. 
 * @return   An integer value equal to the number of pixels from the top of the page to htmlElement.
 */
orp.util.getOffsetTopFromElement = function(htmlElement) {
  var cumulativeOffset = 0;
  if (htmlElement.offsetParent) {
    while (htmlElement.offsetParent) {
      cumulativeOffset += htmlElement.offsetTop;
      htmlElement = htmlElement.offsetParent;
    }
  } else {
    if (htmlElement.y) {
      cumulativeOffset += htmlElement.y;
    }
  }
  return cumulativeOffset;
};

// Functions to manipulate CSS

/**
 * Return true in htmlElement has css classname aClass
 * @param htmlElement The HTML element to check on
 * @param aClass The String representing class name to check on
 */
orp.util.css_hasClass = function(htmlElement, aClass) {
  var matchingRegex = new RegExp("(^|\\s)" + aClass + "($|\\s)");
  return htmlElement.className.match(matchingRegex);
};

/**
 * Adds css classname aClass to an html Element
 * @param htmlElement The HTML element whose class is to be added
 * @param newClass The String representing class name to add
 */
orp.util.css_addClass = function(htmlElement, newClass) {
  if (!orp.util.css_hasClass(htmlElement,newClass)) {
    htmlElement.className += ' ' + newClass;
    return true;
  }
  return false;
};

/**
 * Removes css classname aClass from an html Element
 * @param htmlElement The HTML element whose class is to be removed
 * @param oldClass The String representing class name to remove
 */
orp.util.css_removeClass = function(htmlElement, oldClass) {
  if (orp.util.css_hasClass(htmlElement,oldClass)) {
    var matchingRegex = new RegExp("(^|\\s)" + oldClass); //BUG need to avoid replacing classNames that are a superset of oldClass
    htmlElement.className = htmlElement.className.replace(matchingRegex,'');
  }
};

// String Utilities
orp.util.getStringFromKeyEvent = function(eventObj) {
  return String.fromCharCode(eventObj.charCode); //Mozilla only call
};

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
