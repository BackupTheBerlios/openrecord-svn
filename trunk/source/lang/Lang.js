/*****************************************************************************
 Lang.js
 
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
dojo.provide("orp.lang.Lang");
dojo.require("dojo.lang.Lang");


// -------------------------------------------------------------------
// Public Functions
// -------------------------------------------------------------------

orp.lang.throwError = function(message) {
  var extendedMessage = "";
  var exception = new Error(message);  // create an exception, just to get a stack trace
  if (exception.stack) {
    // We're in Firefox
    extendedMessage += "\nHere's a trimmed version of the stack trace:\n";
    var stackString = exception.stack;
    var stackList = stackString.split("\n");
    stackList.shift(); // get rid of the 1st line: "Error(...message...)@:0"
    stackList.shift(); // get rid of the 2nd line: "(false)@file ... Lang.js:45" from: var exception = new Error(message);
    stackList.shift(); // get rid of the 3rd line: "(false)@file ... Lang.js:88" from: orp.lang.throwError(errorMessage);
    //stackList.pop();   // get rid of the trailing "\n"
    //stackList.pop();   // get rid of the "@:0" at the end of the list
    for (var key in stackList) {
      var string = stackList[key];
      var result = string.match(/[^\/]*$/);
      stackList[key] = result[0];
    }
    stackString = stackList.join("\n");
    extendedMessage += stackString;
    throw new Error(message + extendedMessage);
  } else {
    // We're in IE
    throw exception;
  }
};


/**
 * Throws an exception if the assertion fails.
 *
 * If the asserted condition is true, this method does nothing. If the 
 * condition is false, this throws an error with a error message.
 *
 * @scope    public function
 * @param    booleanValue    A boolean value, which needs to be true for the assertion to succeed. 
 * @param    message    Optional. A string describing the assertion.
 */
orp.lang.assert = function(booleanValue, message) {
  if (dojo.lang.isBoolean(booleanValue)) {
    if (!booleanValue) {
      var errorMessage = "An assert statement failed.\n" +
        "The method orp.lang.assert() was called with a 'false' value.\n";
      if (message) {
        errorMessage += "Here's the assert message:\n" + message + "\n";
      }
      orp.lang.throwError(errorMessage);
    }
  } else {
    throw new Error("Badly formed assert statement.\n" +
      "The method orp.lang.assert() was passed a non-boolean argument.");
  }
};


/**
 * Given a value and a data type, this method checks the type of the value
 * to make sure it matches the data type, and throws an exception if there
 * is a mismatch.
 *
 * Examples:
 * <pre>
 *   orp.lang.assertType("foo", String);
 *   orp.lang.assertType(12345, Number);
 *   orp.lang.assertType(false, Boolean);
 *   orp.lang.assertType([6, 8], Array);
 *   orp.lang.assertType(orp.lang.assertType, Function);
 *   orp.lang.assertType({foo: "bar"}, Object);
 *   orp.lang.assertType(new Date(), Date);
 * </pre>
 *
 * @scope    public function
 * @param    value    Any literal value or object instance. 
 * @param    type    A class of object, or a literal type.
 */
orp.lang.assertType = function(value, type) {
  if (!orp.lang.assertType._errorMessage) {
    orp.lang.assertType._errorMessage = "Type mismatch: orp.lang.assertType() failed.";
  }
  var errorMessage = orp.lang.assertType._errorMessage;
  switch (type) {
    case Array:
      orp.lang.assert(dojo.lang.isArray(value), errorMessage);
      break;
    case Function:
      orp.lang.assert(dojo.lang.isFunction(value), errorMessage);
      break;
    case String:
      orp.lang.assert(dojo.lang.isString(value), errorMessage);
      break;
    case Number:
      orp.lang.assert(dojo.lang.isNumber(value), errorMessage);
      break;
    case Boolean:
      orp.lang.assert(dojo.lang.isBoolean(value), errorMessage);
      break;     
    case Object:
      orp.lang.assert(dojo.lang.isObject(value), errorMessage);
      break;
    default:
      orp.lang.assert((value instanceof type), errorMessage);
      break;
  }
};


/**
 * Given a value and a data type, this method checks the type of the value
 * to make sure it matches the data type, and throws an exception if there
 * is a mismatch.  If the value is 'undefined', this method does not throw
 * an exception.
 *
 * Examples:
 * <pre>
 *   var foo;
 *   orp.lang.assertType(foo, String);
 *   foo = "bar";
 *   orp.lang.assertType(foo, String);
 * </pre>
 *
 * @scope    public function
 * @param    value    Optional.  Any literal value, or any object instance, or the value 'undefined'. 
 * @param    type    A class of object, or a literal type.
 */
orp.lang.assertTypeForOptionalValue = function(value, type) {
  if (!dojo.lang.isUndefined(value)) {
    orp.lang.assertType(value, type);
  }
};

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
