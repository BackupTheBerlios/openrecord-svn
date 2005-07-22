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
 

// -------------------------------------------------------------------
// Dependencies, expressed in the syntax that JSLint understands:
/*global window, document  */
/*global hex_md5  */
// -------------------------------------------------------------------


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
  throw new Error("Util is a static class. You can't create instances of it.");
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
Util.KEYCODE_FOR_BACKSPACE = 8;
Util.KEYCODE_FOR_DELETE = 46;



// -------------------------------------------------------------------
// Assertions and error handling methods
// -------------------------------------------------------------------

/**
 * Registers a function to be used to report errors.
 *
 * @scope    public class method
 * @param    errorReporterFunction    A function which takes a single string argument. 
 */
Util.setErrorReportCallback = function(errorReporterFunction) {
  Util.ourErrorReporter = errorReporterFunction;
};


/**
 * This defaultErrorReporter simply calls "alert" to report errors.
 *
 * @scope    public class method
 * @param    inText    The error message to be reported. 
 */
Util.defaultErrorReporter = function(text) {
  window.alert(text);
};
Util.ourErrorReporter = Util.defaultErrorReporter;

 
 /**
 * Pops up an alert box showing an error message.
 *
 * @scope    public class method
 * @param    message    A string describing the error.
 * @param    url    A string that gives the name of the file where the error was found.
 * @param    line    The line number where the error was found.
 */
Util.handleError = function(message, url, line) {
  Util.ourErrorReporter("Util.handleError()\n" + message + "\nline: " + line + "\nURL: " + url);
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
 * @param    booleanValue    A boolean value, which needs to be true for the assertion to succeed. 
 * @param    message    Optional. A string describing the assertion.
 */
Util.assert = function(booleanValue, message) {
  if (Util.isBoolean(booleanValue)) {
    if (!booleanValue) {    
      var exception = new Error();  // create an exception, just to get a stack trace
      var stackString = exception.stack;
      var stackList = stackString.split("\n");
      stackList.shift(); // get rid of the "ReferenceError()@:0" at the start of the list
      stackList.shift(); // get rid of the "(false)@file ... util.js:67" at the start of the list
      stackList.pop();   // get rid of the trailing "\n"
      stackList.pop();   // get rid of the "@:0" at the end of the list
      for (var key in stackList) {
        var string = stackList[key];
        var result = string.match(/[^\/]*$/);
        stackList[key] = result[0];
      }
      stackString = stackList.join("\n");

      Util.ourErrorReporter("An assert statement failed with message: \n" + message + " \nThe method Util.assert() was called with a 'false' value.\nHere's the stack trace, with the line number where the assert statement failed:\n" + (stackString || ""));
    }
  } else {
    Util.ourErrorReporter("An assert statement went sour.\nThe method Util.assert() was passed a non-boolean argument.\nHere's the stack trace, with the line number where the assert statement failed:\n" + (stackString || ""));
  }
};


/**
 * Registers a function to be used to report status messages to the user.
 *
 * @scope    public class method
 * @param    statusReporterFunction    A function which takes a single string argument. 
 */
Util.setStatusReporter = function(statusReporterFunction) {
  Util.ourStatusReporter = statusReporterFunction;
};


/**
 * Reports a status message to the user.
 *
 * @scope    public class method
 * @param    message    A string with a status message.
 */
Util.displayStatusBlurb = function(message) {
  Util.ourStatusReporter(message);
};


/**
 * This defaultStatusReporter simply ignores the status report.
 *
 * @scope    public class method
 * @param    text    The status message to be reported. 
 */
Util.defaultStatusReporter = function(text) {
  // do nothing!
};
Util.ourStatusReporter = Util.defaultStatusReporter;


// -------------------------------------------------------------------
// Type checking methods
// -------------------------------------------------------------------

/**
 * Returns true if the given value is a function.
 *
 * @scope    public class method
 * @param    value    Any object or literal value. 
 * @return   A boolean value. True if inValue is a function.
 */
Util.isFunction = function(value) {
  return ((typeof value) == "function");
};


/**
 * Returns true if the given value is a string.
 *
 * @scope    public class method
 * @param    value    Any object or literal value. 
 * @return   A boolean value. True if inValue is a string.
 */
Util.isString = function(value) {
  return ((typeof value) == "string");
};


/**
 * Returns true if the given value is a number (and is finite number).
 *
 * @scope    public class method
 * @param    value    Any object or literal value. 
 * @return   A boolean value. True if inValue is a number.
 */
Util.isNumber = function(value) {
  return (((typeof value) == "number") && isFinite(value));
};


/**
 * Returns true if the given value is a number or a string that 
 * represents a number.
 *
 * @scope    public class method
 * @param    value    Any object or literal value. 
 * @return   A boolean value. True if inValue is a number or a string that represents a number.
 */
Util.isNumeric = function(value) {
  var isNumber = Util.isNumber(value);
  if (isNumber) {
    return true;
  }
  var isNumeric = Util.isString(value) && Util.isNumber(parseInt(value));
  return isNumeric;
};


/**
 * Returns true if the given value is a boolean.
 *
 * @scope    public class method
 * @param    value    Any object or literal value. 
 * @return   A boolean value. True if inValue is a boolean.
 */
Util.isBoolean = function(value) {
  return ((typeof value) == "boolean");
};


/**
 * Returns true if the given value is an object.
 *
 * @scope    public class method
 * @param    value    Any object or literal value. 
 * @return   A boolean value. True if inValue is an object.
 */
Util.isObject = function(value) {
  return (value && ((typeof value) == "object"));
};


/**
 * Returns true if the given value is a Date.
 *
 * @scope    public class method
 * @param    value    Any object or literal value. 
 * @return   A boolean value. True if inValue is a Date.
 */
Util.isDate = function(value) {
  return (value instanceof Date);
};


/**
 * Returns true if the given value is a UUID. Here's an example of
 * a valid UUID: "e3bf3e14-e8f4-43e2-866c-121c5ab70c0b".
 *
 * @scope    public class method
 * @param    value    Any object or literal value. 
 * @return   A boolean value. True if inValue is a UUID.
 */
Util.isUuid = function(value) {
  // PENDING: 
  // We should include more rigorous tests, to make sure this
  // is really a UUID, not just a string with 36 characters.
  if ((typeof value) != "string") {
    return false;
  }
  return (value.length == 36);  
};


/**
 * Returns true if the given value is an array.
 *
 * @scope    public class method
 * @param    value    Any object or literal value. 
 * @return   A boolean value. True if inValue is an array.
 */
Util.isArray = function(value) {
  if (!value) {
    return false;
  }
  return (((typeof value) == "object") && (value.constructor == Array));
};


/**
 * Returns true if the given value is a hash table.
 *
 * @scope    public class method
 * @param    value    Any object or literal value. 
 * @return   A boolean value. True if inValue is a hash table.
 */
Util.isHashTable = function(value) {
  return (value && ((typeof value) == "object"));  // PENDING: we should be more restrictive!
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
Util.getArrayIndex = function(array, value) {
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
Util.isObjectInSet = function(object, set) {
  Util.assert(Util.isArray(set));
  
//  for (var i=0; i<set.length; i+=1) {
//    if (set[i] == object) {
//      return true;
//    }
//  }
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
Util.areObjectsInSet = function(array, set) {
  Util.assert(Util.isArray(array));
  Util.assert(Util.isArray(set));
  
  for (var key in array) {
    var object = array[key];
    var objectIsInSet = Util.isObjectInSet(object, set);
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
Util.removeObjectFromSet = function(object, set) {
  Util.assert(Util.isArray(set));
  
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
Util.addObjectToSet = function(object, set) {
  Util.assert(Util.isArray(set));

  if (!object) {
    return false;
  }
  if (Util.isObjectInSet(object, set)) {
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
Util.lengthOfHashTable = function(hashTable) {
  Util.assert(Util.isHashTable(hashTable));
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
Util.hashTableValues = function(hashTable) {
  Util.assert(Util.isHashTable(hashTable));
  var returnArray = [];
  for (var key in hashTable) {
    returnArray.push(hashTable[key]);
  }
  return returnArray;
};


// -------------------------------------------------------------------
// Methods that operate on Dates
// -------------------------------------------------------------------

// Util.getStringMonthDayYear = function(date) {
//   var returnString = Util.ABBREV_MONTHS_ARRAY[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
//   return returnString;
// };


// -------------------------------------------------------------------
// Methods for doing encryption
// -------------------------------------------------------------------

Util.hex_md5 = function(string) {
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
Util.getTargetFromEvent = function(eventObject) {
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
 * A cross-browser compatibility method for registering event listeners. 
 *
 * @scope public class method
 * @param element    An HTMLElement.
 * @param eventType    The type of event (e.g. "mousedown", "click").
 * @param callback    The function to call when the event happens.
 * @param captures    True if the event should be captured by this function.
 */
Util.addEventListener = function(element, eventType, callback, captures) {
  if (element.addEventListener) {
    // for DOM Level 2 browsers, like Firefox
    element.addEventListener(eventType, callback, captures);
  } else {
    if (element.attachEvent) {
      // for Internet Explorer
      element.attachEvent("on"+eventType, callback, captures);
    }
  } 
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
Function.prototype.bindAsEventListener = function(object) {
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
// File I/O methods
// -------------------------------------------------------------------

/**
 * Given the URL of a file, returns the contents of the file as a text string.
 *
 * @scope    public class method
 * @param    url    A string with the URL of a file containing JavaScript code. 
 * @return   A string containing the contents of the file.
 */
Util.getStringContentsOfFileAtURL = function(url) {
  var anXMLHttpRequestObject = new window.XMLHttpRequest();
  anXMLHttpRequestObject.open("GET", url, false);
  anXMLHttpRequestObject.send(null);
  var fileContents = anXMLHttpRequestObject.responseText;
  return fileContents;
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
Util.setTargetsForExternalLinks = function() {
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
Util.createImageElement = function(imageFileName) {
  var imagesDirectory = "images/"; // PENDING: this shouldn't be hard-coded in Util
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
Util.getOffsetLeftFromElement = function(htmlElement) {
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
Util.getOffsetTopFromElement = function(htmlElement) {
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
Util.css_hasClass = function(htmlElement, aClass) {
  var matchingRegex = new RegExp("(^|\\s)" + aClass + "($|\\s)");
  return htmlElement.className.match(matchingRegex);
};

/**
 * Adds css classname aClass to an html Element
 * @param htmlElement The HTML element whose class is to be added
 * @param newClass The String representing class name to add
 */
Util.css_addClass = function(htmlElement, newClass) {
  if (!Util.css_hasClass(htmlElement,newClass)) {
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
Util.css_removeClass = function(htmlElement, oldClass) {
  if (Util.css_hasClass(htmlElement,oldClass)) {
    var matchingRegex = new RegExp("(^|\\s)" + oldClass); //BUG need to avoid replacing classNames that are a superset of oldClass
    htmlElement.className = htmlElement.className.replace(matchingRegex,'');
  }
};

// String Utilities
Util.getStringFromKeyEvent = function(eventObj) {
  return String.fromCharCode(eventObj.charCode); //Mozilla only call
};

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
