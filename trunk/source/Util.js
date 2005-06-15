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

// Number of seconds between October 15, 1582 and January 1, 1970
// Util.GREGORIAN_CHANGE_OFFSET_IN_SECONDS = 12219292800;
Util.GREGORIAN_CHANGE_OFFSET_IN_HOURS = 3394248;

Util.HEX_RADIX = 16;

// -------------------------------------------------------------------
// Util global class variables
// -------------------------------------------------------------------
Util._ourUuidClockSeqString = null;
Util._ourDateValueOfPreviousUuid = null;
Util._ourNextIntraMillisecondIncrement = 0;

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
  returnString = returnString.replace(/\n/g, " ");
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
  if (Util.isBoolean(inBoolean)) {
    if (!inBoolean) {    
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

      Util.ourErrorReporter("An assert statement failed with mesg: \n" + inMessage + " \nThe method Util.assert() was called with a 'false' value.\nHere's the stack trace, with the line number where the assert statement failed:\n" + (stackString || ""));
    }
  } else {
    Util.ourErrorReporter("An assert statement went sour.\nThe method Util.assert() was passed a non-boolean argument.\nHere's the stack trace, with the line number where the assert statement failed:\n" + (stackString || ""));
  }
};


/**
 * Registers a function to be used to report status messages to the user.
 *
 * @scope    public class method
 * @param    inFunction    A function which takes a single string argument. 
 */
Util.setStatusReporter = function (inFunction) {
  Util.ourStatusReporter = inFunction;
};


/**
 * Reports a status message to the user.
 *
 * @scope    public class method
 * @param    inMessage    A string with a status message.
 */
Util.displayStatusBlurb = function (inMessage) {
  Util.ourStatusReporter(inMessage);
};


/**
 * This defaultStatusReporter simply ignores the status report.
 *
 * @scope    public class method
 * @param    inText    The status message to be reported. 
 */
Util.defaultStatusReporter = function (inText) {
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
 * @param    inValue    Any object or literal value. 
 * @return   A boolean value. True if inValue is a function.
 */
Util.isFunction = function (inValue) {
  return ((typeof inValue) == "function");
};


/**
 * Returns true if the given value is a string.
 *
 * @scope    public class method
 * @param    inValue    Any object or literal value. 
 * @return   A boolean value. True if inValue is a string.
 */
Util.isString = function (inValue) {
  return ((typeof inValue) == "string");
};


/**
 * Returns true if the given value is a number (and is finite number).
 *
 * @scope    public class method
 * @param    inValue    Any object or literal value. 
 * @return   A boolean value. True if inValue is a number.
 */
Util.isNumber = function (inValue) {
  return (((typeof inValue) == "number") && isFinite(inValue));
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
  return ((typeof inValue) == "boolean");
};


/**
 * Returns true if the given value is an object.
 *
 * @scope    public class method
 * @param    inValue    Any object or literal value. 
 * @return   A boolean value. True if inValue is an object.
 */
Util.isObject = function (inValue) {
  return (inValue && ((typeof inValue) == "object"));
};


/**
 * Returns true if the given value is a Date.
 *
 * @scope    public class method
 * @param    inValue    Any object or literal value. 
 * @return   A boolean value. True if inValue is a Date.
 */
Util.isDate = function (inValue) {
  return (inValue instanceof Date);
};


/**
 * Returns true if the given value is a UUID. Here's an example of
 * a valid UUID: "e3bf3e14-e8f4-43e2-866c-121c5ab70c0b".
 *
 * @scope    public class method
 * @param    inValue    Any object or literal value. 
 * @return   A boolean value. True if inValue is a UUID.
 */
Util.isUuid = function (inValue) {
  // PENDING: 
  // We should include more rigorous tests, to make sure this
  // is really a UUID, not just a string with 36 characters.
  if ((typeof inValue) != "string") {
    return false;
  }
  return (uuid.length == 36);  
};


/**
 * Returns true if the given value is an array.
 *
 * @scope    public class method
 * @param    inValue    Any object or literal value. 
 * @return   A boolean value. True if inValue is an array.
 */
Util.isArray = function (inValue) {
  if (!inValue) {
    return false;
  }
  return (((typeof inValue) == "object") && (inValue.constructor == Array));
};


/**
 * Returns true if the given value is a hash table.
 *
 * @scope    public class method
 * @param    inValue    Any object or literal value. 
 * @return   A boolean value. True if inValue is a hash table.
 */
Util.isHashTable = function (inValue) {
  return (inValue && ((typeof inValue) == "object"));  // PENDING: we should be more restrictive!
};


// -------------------------------------------------------------------
// Methods that operate on Arrays
// -------------------------------------------------------------------

Util.getArrayIndex = function(inArray, inElt) {
  for (i=0; i<inArray.length; ++i) {
    if (inArray[i] == inElt) {return i;}
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
 * Returns true if each of the given objects is a member of the set.  
 * 
 * @scope    public class method
 * @param    inArray    An array of objects to look for. 
 * @param    inSet    The Array to look for the objects in. 
 * @return   Returns true if each of the objects was found in the set.
 */
Util.areObjectsInSet = function (inArray, inSet) {
  Util.assert(Util.isArray(inArray));
  Util.assert(Util.isArray(inSet));
  
  for (var key in inArray) {
    var object = inArray[key];
    var objectIsInSet = Util.isObjectInSet(object, inSet);
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


/**
 * Returns the number of values in a hash table. 
 * 
 * @scope    public class method
 * @param    inHashTable   A hashTable containing values.
 * @return   The number of values in inHashTable.
 */
Util.lengthOfHashTable = function(inHashTable) {
  Util.assert(Util.isHashTable(inHashTable));
  var count = 0;
  for (var key in inHashTable) {
    count += 1;
  }
  return count;
};


/**
 * Return the values of a HashTable in the form of an Array
 * Analogous to Python hash.values() 
 * 
 * @scope    public class method
 * @param    inHashTable   A hashTable containing values.
 * @return   An array containing the values that are in inHashTable.
 */
Util.hashTableValues = function(inHashTable) {
  Util.assert(Util.isHashTable(inHashTable));
  var returnArray = [];
  for (var key in inHashTable) {
    returnArray.push(inHashTable[key]);
  }
  return returnArray;
};


// -------------------------------------------------------------------
// Methods for doing encryption
// -------------------------------------------------------------------

Util.hex_md5 = function (inString) {
  // Calls the hex_md5() function in .../trunk/third_party/md5/md5.js
  return hex_md5(inString);
};


// -------------------------------------------------------------------
// Methods for working with UUIDs
// -------------------------------------------------------------------

Util.getRandom32bitNumber = function () {
  return Math.floor( (Math.random() % 1) * Math.pow(2, 32) );
};


Util.getRandomEightCharacterHexString = function () {
  // PENDING: 
  // This isn't really random.  We should find some source of real 
  // randomness, and feed it to an MD5 hash algorithm.     
  var eightCharacterString = Util.getRandom32bitNumber().toString(Util.HEX_RADIX);
  while (eightCharacterString.length < 8) {
    eightCharacterString = "0" + eightCharacterString;
  }
  return eightCharacterString;
};


/**
 * Generates a random UUID, meaning a "version 4" UUID.  Hopefully this 
 * implementation conforms to the existing standards for UUIDs and GUIDs.  
 * For more info, see 
 * http://www.webdav.org/specs/draft-leach-uuids-guids-01.txt
 * 
 * @scope    public class method
 * @return   Returns a 36 character string, which will look something like "3B12F1DF-5232-4804-897E-917BF397618A".
 */
Util.generateRandomUuid = function () {
  var hyphen = "-";
  var versionCodeForRandomlyGeneratedUuids = "4"; // 8 == binary2hex("0100")
  var variantCodeForDCEUuids = "8"; // 8 == binary2hex("1000")
  var a = Util.getRandomEightCharacterHexString();
  var b = Util.getRandomEightCharacterHexString();
  b = b.substring(0, 4) + hyphen + versionCodeForRandomlyGeneratedUuids + b.substring(5, 8);
  var c = Util.getRandomEightCharacterHexString();
  c = variantCodeForDCEUuids + c.substring(1, 4) + hyphen + c.substring(4, 8);
  var d = Util.getRandomEightCharacterHexString();
  var result = a + hyphen + b + hyphen + c + d;
  
  return result;
};

Util.carry = function(a) {
  a[2] += a[3] >>> 16;
  a[3] &= 0xFFFF;
  a[1] += a[2] >>> 16;
  a[2] &= 0xFFFF;
  a[0] += a[1] >>> 16;
  a[1] &= 0xFFFF;
  Util.assert((a[0] >>> 16) === 0);
};

Util.get64bitArrayFromFloat = function(x) {
  var result = new Array(0, 0, 0, 0);
  result[3] = x % 0x10000;
  x -= result[3];
  x /= 0x10000;
  result[2] = x % 0x10000;
  x -= result[2];
  x /= 0x10000;
  result[1] = x % 0x10000;
  x -= result[1];
  x /= 0x10000;
  result[0] = x;
  return result;
};

Util.addTwo64bitArrays = function(a, b) {
  Util.assert(Util.isArray(a));
  Util.assert(a.length == 4);
  Util.assert(Util.isArray(b));
  Util.assert(b.length == 4);
  var result = new Array(0, 0, 0, 0);
  result[3] = a[3] + b[3];
  result[2] = a[2] + b[2];
  result[1] = a[1] + b[1];
  result[0] = a[0] + b[0];
  Util.carry(result);
  return result;
};

Util.multiplyTwo64bitArrays = function(a, b) {
  Util.assert(Util.isArray(a));
  Util.assert(a.length == 4);
  Util.assert(Util.isArray(b));
  Util.assert(b.length == 4);
  var overflow = false;
  if (a[0] * b[0] !== 0) { overflow = true; }
  if (a[0] * b[1] !== 0) { overflow = true; }
  if (a[0] * b[2] !== 0) { overflow = true; }
  if (a[1] * b[0] !== 0) { overflow = true; }
  if (a[1] * b[1] !== 0) { overflow = true; }
  if (a[2] * b[0] !== 0) { overflow = true; }
  Util.assert(!overflow);
  
  var result = new Array(0, 0, 0, 0);
  result[0] += a[0] * b[3];
  Util.carry(result);
  result[0] += a[1] * b[2];
  Util.carry(result);
  result[0] += a[2] * b[1];
  Util.carry(result);
  result[0] += a[3] * b[0];
  Util.carry(result);
  result[1] += a[1] * b[3];
  Util.carry(result);
  result[1] += a[2] * b[2];
  Util.carry(result);
  result[1] += a[3] * b[1];
  Util.carry(result);
  result[2] += a[2] * b[3];
  Util.carry(result);
  result[2] += a[3] * b[2];
  Util.carry(result);
  result[3] += a[3] * b[3];
  Util.carry(result);
  return result;
};

Util.padWithLeadingZeros = function(string, desiredLength) {
  while (string.length < desiredLength) {
    string = "0" + string;
  }
  return string;
};

/**
 * Generates a time-based UUID, meaning a "version 1" UUID.  JavaScript
 * code running in a browser doesn't have access to the IEEE 802.3 address
 * of the computer, so we generate a random pseudonode value instead.
 * Hopefully this implementation conforms to the existing standards for 
 * UUIDs and GUIDs.  
 * 
 * For more info, see 
 *   http://www.webdav.org/specs/draft-leach-uuids-guids-01.txt
 *   http://www.infonuovo.com/dma/csdocs/sketch/instidid.htm
 *   http://kruithof.xs4all.nl/uuid/uuidgen
 *   http://www.opengroup.org/onlinepubs/009629399/apdxa.htm#tagcjh_20
 *   http://jakarta.apache.org/commons/sandbox/id/apidocs/org/apache/commons/id/uuid/clock/Clock.html
 *
 * @scope    public class method
 * @return   Returns a 36 character string, which will look something like "3B12F1DF-5232-1804-897E-917BF397618A".
 */
Util.generateTimeBasedUuid = function(pseudoNode) {
  Util.assert(!pseudoNode || Util.isString(pseudoNode));  
  if (pseudoNode) {
    Util.assert(pseudoNode.length == 12);  
  }
  else {
    var pseudoNodeIndicatorBit = 0x8000;
    var random15bitNumber = Math.floor( (Math.random() % 1) * Math.pow(2, 15) );
    var leftmost4HexCharacters = (pseudoNodeIndicatorBit | random15bitNumber).toString(Util.HEX_RADIX);
    pseudoNode = leftmost4HexCharacters + Util.getRandomEightCharacterHexString();
  }
  if (!Util._ourUuidClockSeqString) {
    var variantCodeForDCEUuids = 0x8000; // 10--------------, i.e. uses only first two of 16 bits.
    var random14bitNumber = Math.floor( (Math.random() % 1) * Math.pow(2, 14) );
    Util._ourUuidClockSeqString = (variantCodeForDCEUuids | random14bitNumber).toString(Util.HEX_RADIX);
  }

  // Maybe someday think about trying to make the code more readable to
  // newcomers by creating a class called "WholeNumber" that encapsulates
  // the methods and data structures for working with these arrays that 
  // hold 4 16-bit numbers?  And then these variables below have names  
  // like "wholeSecondsPerHour" rather than "arraySecondsPerHour"?
  var now = new Date();
  var nowArray = Util.get64bitArrayFromFloat(now.valueOf());
  var arraySecondsPerHour = Util.get64bitArrayFromFloat(60 * 60);
  var arrayHoursBetween1582and1970 = Util.get64bitArrayFromFloat(Util.GREGORIAN_CHANGE_OFFSET_IN_HOURS);
  var arraySecondsBetween1582and1970 = Util.multiplyTwo64bitArrays(arrayHoursBetween1582and1970, arraySecondsPerHour);
  var arrayMillisecondsPerSecond = Util.get64bitArrayFromFloat(1000);
  var arrayMillisecondsBetween1582and1970 = Util.multiplyTwo64bitArrays(arraySecondsBetween1582and1970, arrayMillisecondsPerSecond);
  var arrayMillisecondsSince1970 = nowArray;
  var arrayMillisecondsSince1582 = Util.addTwo64bitArrays(arrayMillisecondsBetween1582and1970, arrayMillisecondsSince1970);
  var arrayMicrosecondsPerMillisecond = Util.get64bitArrayFromFloat(1000);
  var arrayMicrosecondsSince1582 = Util.multiplyTwo64bitArrays(arrayMillisecondsSince1582, arrayMicrosecondsPerMillisecond);
  var arrayHundredNanosecondIntervalsPerMicrosecond = Util.get64bitArrayFromFloat(10);
  var arrayHundredNanosecondIntervalsSince1582 = Util.multiplyTwo64bitArrays(arrayMicrosecondsSince1582, arrayHundredNanosecondIntervalsPerMicrosecond);
  
  if (now.valueOf() == Util._ourDateValueOfPreviousUuid) {
    arrayHundredNanosecondIntervalsSince1582[3] += Util._ourNextIntraMillisecondIncrement;
    Util.carry(arrayHundredNanosecondIntervalsSince1582);
    Util._ourNextIntraMillisecondIncrement += 1;
    if (Util._ourNextIntraMillisecondIncrement == 10000) {
      // If we've gotten to here, it means we've already generated 10,000
      // UUIDs in this single milliseconds, which is the most that the UUID
      // timestamp field allows for.  So now we'll just sit here and wait
      // for a fraction of a millisecond, so as to ensure that the next 
      // time this method is called there will be a different millisecond 
      // value in the timestamp field.
      while (now.valueOf() == Util._ourDateValueOfPreviousUuid) {
        now = new Date();
      }
    }
  }
  else {
    Util._ourDateValueOfPreviousUuid = now.valueOf();
    Util._ourNextIntraMillisecondIncrement = 1;
  }
  
  var hexTimeLowLeftHalf  = arrayHundredNanosecondIntervalsSince1582[2].toString(Util.HEX_RADIX);
  var hexTimeLowRightHalf = arrayHundredNanosecondIntervalsSince1582[3].toString(Util.HEX_RADIX);
  var hexTimeLow = Util.padWithLeadingZeros(hexTimeLowLeftHalf, 4) + Util.padWithLeadingZeros(hexTimeLowRightHalf, 4);
  var hexTimeMid = arrayHundredNanosecondIntervalsSince1582[1].toString(Util.HEX_RADIX);
  hexTimeMid = Util.padWithLeadingZeros(hexTimeMid, 4);
  var hexTimeHigh = arrayHundredNanosecondIntervalsSince1582[0].toString(Util.HEX_RADIX);
  hexTimeHigh = Util.padWithLeadingZeros(hexTimeHigh, 3);
  var hyphen = "-";
  var versionCodeForTimeBasedUuids = "1"; // binary2hex("0001")
  var resultUuid = hexTimeLow + hyphen + hexTimeMid + hyphen +
        versionCodeForTimeBasedUuids + hexTimeHigh + hyphen +
        Util._ourUuidClockSeqString + hyphen + pseudoNode;
//alert(resultUuid);
  return resultUuid;
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
 * A cross-browser compatibility method for registering event listeners. 
 *
 * @scope public class method
 * @param inElement    An HTMLElement.
 * @param inEventType    The type of event (e.g. "mousedown", "click").
 * @param inCallback    The function to call when the event happens.
 * @param inCaptures    True if the event should be captured by this function.
 */
Util.addEventListener = function (inElement, inEventType, inCallback, inCaptures) {
  if (inElement.addEventListener) {
    // for DOM Level 2 browsers, like Firefox
    inElement.addEventListener(inEventType, inCallback, inCaptures);
  } else {
    if (inElement.attachEvent) {
      // for Internet Explorer
      inElement.attachEvent("on"+inEventType, inCallback, inCaptures);
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
Function.prototype.bindAsEventListener = function (object) {
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
 * @param    inUrl    A string with the URL of a file containing JavaScript code. 
 * @return   A string containing the contents of the file.
 */
Util.getStringContentsOfFileAtURL = function (inUrl) {
  var anXMLHttpRequestObject = new XMLHttpRequest();
  anXMLHttpRequestObject.open("GET", inUrl, false);
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
Util.setTargetsForExternalLinks = function () {
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
Util.createImageElement = function (imageFileName) {
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
 * @param    inHtmlElement    The HTML element that we want the left offest of. 
 * @return   An integer value equal to the number of pixels from the left of the page to inHtmlElement.
 */
Util.getOffsetLeftFromElement = function (inHtmlElement) {
  var cumulativeOffset = 0;
  if (inHtmlElement.offsetParent) {
    while (inHtmlElement.offsetParent) {
      cumulativeOffset += inHtmlElement.offsetLeft;
      inHtmlElement = inHtmlElement.offsetParent;
    }
  } else {
    if (inHtmlElement.x) {
      cumulativeOffset += inHtmlElement.x;
    }
  }
  return cumulativeOffset;
};


/**
 * Given an HTML element, find the real top offset for the element,  
 * meaning the distance in pixels from the top edge of the page.
 *
 * @scope    public class method
 * @param    inHtmlElement    The HTML element that we want the top offest of. 
 * @return   An integer value equal to the number of pixels from the top of the page to inHtmlElement.
 */
Util.getOffsetTopFromElement = function (inHtmlElement) {
  var cumulativeOffset = 0;
  if (inHtmlElement.offsetParent) {
    while (inHtmlElement.offsetParent) {
      cumulativeOffset += inHtmlElement.offsetTop;
      inHtmlElement = inHtmlElement.offsetParent;
    }
  } else {
    if (inHtmlElement.y) {
      cumulativeOffset += inHtmlElement.y;
    }
  }
  return cumulativeOffset;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
