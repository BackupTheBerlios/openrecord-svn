/*****************************************************************************
 TimeBasedUuid.js
 
******************************************************************************
 Written in 2005 by 
    Brian Douglas Skinner <brian.skinner@gumption.org>
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
/*global Util  */
/*global Uuid  */
// -------------------------------------------------------------------


/**
 * The TimeBasedUuid class offers methods for working with 
 * time-based UUIDs, meaning "version 1" UUIDs.
 *
 * For more info, see 
 *   http://www.webdav.org/specs/draft-leach-uuids-guids-01.txt
 *   http://www.infonuovo.com/dma/csdocs/sketch/instidid.htm
 *   http://kruithof.xs4all.nl/uuid/uuidgen
 *   http://www.opengroup.org/onlinepubs/009629399/apdxa.htm#tagcjh_20
 *   http://jakarta.apache.org/commons/sandbox/id/apidocs/org/apache/commons/id/uuid/clock/Clock.html
 *
 * @scope    public instance constructor
 */
/*
 * PENDING: refactor constructor API
 // OLD API
var uuid = new orp.util.TimeBasedUuid();                 // new
var uuid = new orp.util.TimeBasedUuid("917BF397618A");   // pseudonode
var uuid = new orp.util.TimeBasedUuid("3B12F1DF-5232-1804-897E-917BF397618A")

// NEW API
var uuid = new orp.util.TimeBasedUuid();
var uuid = new orp.util.TimeBasedUuid({pseudoNode: "917BF397618A"});
var uuid = new orp.util.TimeBasedUuid({node: "917BF397618A"});
var uuid = new orp.util.TimeBasedUuid({uuidString: "3B12F1DF-5232-1804-897E-917BF397618A"});


var uuid = new orp.util.RandomUuid();
var uuid = new orp.util.RandomUuid({uuidString: "3B12F1DF-5232-1804-897E-917BF397618A"});

var uuid = new orp.util.Uuid({uuidString: "3B12F1DF-5232-1804-897E-917BF397618A"});
var version = orp.util.Uuid.getVersionFromUuidString("3B12F1DF-5232-1804-897E-917BF397618A");
var version = orp.util.Uuid.getVariantFromUuidString("3B12F1DF-5232-1804-897E-917BF397618A");
var boolean = orp.util.Uuid.isRandomUuidString("3B12F1DF-5232-1804-897E-917BF397618A");
var boolean = orp.util.Uuid.isTimeBasedUuidString("3B12F1DF-5232-1804-897E-917BF397618A");

// in Uuid.js
var Version = {
  TimeBased: 1,
  DCESecurity: 2,
  NameBasedMD5: 3,
  Random: 4,
  NameBasedSHA1: 5
}

var Variant = {
  NCS: "0",
  DCE: "10",
  Microsoft: "110"
}
*/
TimeBasedUuid.prototype = new Uuid();  // makes TimeBasedUuid be a subclass of Uuid
function TimeBasedUuid(uuidStringOrPseudoNode) {
  if (uuidStringOrPseudoNode) {
    Util.assert(Util.isString(uuidStringOrPseudoNode));
    var lengthOfPseudoNodeString = 12;
    if (uuidStringOrPseudoNode.length == lengthOfPseudoNodeString) {
      var pseudoNode = uuidStringOrPseudoNode;
      this._uuidString = TimeBasedUuid._generateUuidString(pseudoNode);
    } else {
      Util.assert(uuidStringOrPseudoNode.length == 36);
      this._uuidString = uuidStringOrPseudoNode;
    }
  } else {
    this._uuidString = TimeBasedUuid._generateUuidString();
  }
}


// -------------------------------------------------------------------
// TimeBasedUuid public class constants
// -------------------------------------------------------------------
// Number of seconds between October 15, 1582 and January 1, 1970
// Util.GREGORIAN_CHANGE_OFFSET_IN_SECONDS = 12219292800;
TimeBasedUuid.GREGORIAN_CHANGE_OFFSET_IN_HOURS = 3394248;
TimeBasedUuid.HEX_RADIX = 16;


// -------------------------------------------------------------------
// Uuid private global class variables
// -------------------------------------------------------------------
TimeBasedUuid._ourUuidClockSeqString = null;
TimeBasedUuid._ourDateValueOfPreviousUuid = null;
TimeBasedUuid._ourNextIntraMillisecondIncrement = 0;

TimeBasedUuid._ourCachedMillisecondsBetween1582and1970 = null;
TimeBasedUuid._ourCachedHundredNanosecondIntervalsPerMillisecond = null;


// -------------------------------------------------------------------
// Public instance methods
// -------------------------------------------------------------------

/**
 * Returns a 12-character string with the "node" or "pseudonode" portion of 
 * the UUID, which is the rightmost 12 characters.
 * 
 * @scope    public instance method
 * @return   Returns a 12-character string, which will look something like "917BF397618A".
 */
TimeBasedUuid.prototype.getNode = function() {
  return TimeBasedUuid._getNodeFromUuidString(this._uuidString);
};


/**
 * Returns a JavaScript Date object with a value equal to the value in the
 * time fields of the UUID.
 * 
 * @scope    public instance method
 * @return   Returns a JavaScript Date object.
 */
TimeBasedUuid.prototype.getDate = function() {
  if (!this._date) {
    this._date = TimeBasedUuid._getDateFromUuidString(this._uuidString);
  } 
  return this._date;
};


/**
 * Returns a 15-character string of hex digits that contains the creation
 * timestamp for this UUID, with the high-order bits first.  
 * 
 * @scope    public instance method
 * @return   A 15-character string of hex digits.
 */
TimeBasedUuid.prototype.getTimestampAsHexString = function() {
  if (!this._timestampAsHexString) {
    this._timestampAsHexString = TimeBasedUuid._getTimestampAsHexString(this.toString());
  }
  return this._timestampAsHexString;
};


// -------------------------------------------------------------------
// Private class methods
// -------------------------------------------------------------------

/**
 * Generates a time-based UUID, meaning a "version 1" UUID.  JavaScript
 * code running in a browser doesn't have access to the IEEE 802.3 address
 * of the computer, so we generate a random pseudonode value instead.
 * Hopefully this implementation conforms to the existing standards for 
 * UUIDs and GUIDs.  
 * 
 * @scope    private class method
 * @param    pseudoNode    Optional. A 12-character string to use as the node in the new UUID.
 * @return   Returns a 36 character string, which will look something like "3B12F1DF-5232-1804-897E-917BF397618A".
 */
TimeBasedUuid._generateUuidString = function(pseudoNode) {
  Util.assert(!pseudoNode || Util.isString(pseudoNode));  
  if (pseudoNode) {
    Util.assert(pseudoNode.length == 12);  
  } else {
    var pseudoNodeIndicatorBit = 0x8000;
    var random15bitNumber = Math.floor( (Math.random() % 1) * Math.pow(2, 15) );
    var leftmost4HexCharacters = (pseudoNodeIndicatorBit | random15bitNumber).toString(TimeBasedUuid.HEX_RADIX);
    pseudoNode = leftmost4HexCharacters + RandomUuid._generateRandomEightCharacterHexString();
  }
  if (!TimeBasedUuid._ourUuidClockSeqString) {
    var variantCodeForDCEUuids = 0x8000; // 10--------------, i.e. uses only first two of 16 bits.
    var random14bitNumber = Math.floor( (Math.random() % 1) * Math.pow(2, 14) );
    TimeBasedUuid._ourUuidClockSeqString = (variantCodeForDCEUuids | random14bitNumber).toString(TimeBasedUuid.HEX_RADIX);
  }

  // Maybe someday think about trying to make the code more readable to
  // newcomers by creating a class called "WholeNumber" that encapsulates
  // the methods and data structures for working with these arrays that 
  // hold 4 16-bit numbers?  And then these variables below have names  
  // like "wholeSecondsPerHour" rather than "arraySecondsPerHour"?
  var now = new Date();
  var nowArray = TimeBasedUuid._get64bitArrayFromFloat(now.valueOf());
  if (!TimeBasedUuid._ourCachedMillisecondsBetween1582and1970) {
    var arraySecondsPerHour = TimeBasedUuid._get64bitArrayFromFloat(60 * 60);
    var arrayHoursBetween1582and1970 = TimeBasedUuid._get64bitArrayFromFloat(TimeBasedUuid.GREGORIAN_CHANGE_OFFSET_IN_HOURS);
    var arraySecondsBetween1582and1970 = TimeBasedUuid._multiplyTwo64bitArrays(arrayHoursBetween1582and1970, arraySecondsPerHour);
    var arrayMillisecondsPerSecond = TimeBasedUuid._get64bitArrayFromFloat(1000);
    TimeBasedUuid._ourCachedMillisecondsBetween1582and1970 = TimeBasedUuid._multiplyTwo64bitArrays(arraySecondsBetween1582and1970, arrayMillisecondsPerSecond);
    TimeBasedUuid._ourCachedHundredNanosecondIntervalsPerMillisecond = TimeBasedUuid._get64bitArrayFromFloat(10000);
  }
  var arrayMillisecondsSince1970 = nowArray;
  var arrayMillisecondsSince1582 = TimeBasedUuid._addTwo64bitArrays(TimeBasedUuid._ourCachedMillisecondsBetween1582and1970, arrayMillisecondsSince1970);
  // var arrayMicrosecondsPerMillisecond = TimeBasedUuid._get64bitArrayFromFloat(1000);
  // var arrayMicrosecondsSince1582 = TimeBasedUuid._multiplyTwo64bitArrays(arrayMillisecondsSince1582, arrayMicrosecondsPerMillisecond);
  // var arrayHundredNanosecondIntervalsPerMicrosecond = TimeBasedUuid._get64bitArrayFromFloat(10);
  // var arrayHundredNanosecondIntervalsSince1582 = TimeBasedUuid._multiplyTwo64bitArrays(arrayMicrosecondsSince1582, arrayHundredNanosecondIntervalsPerMicrosecond);
  var arrayHundredNanosecondIntervalsSince1582 = TimeBasedUuid._multiplyTwo64bitArrays(arrayMillisecondsSince1582, TimeBasedUuid._ourCachedHundredNanosecondIntervalsPerMillisecond);
  
  if (now.valueOf() == TimeBasedUuid._ourDateValueOfPreviousUuid) {
    arrayHundredNanosecondIntervalsSince1582[3] += TimeBasedUuid._ourNextIntraMillisecondIncrement;
    TimeBasedUuid._carry(arrayHundredNanosecondIntervalsSince1582);
    TimeBasedUuid._ourNextIntraMillisecondIncrement += 1;
    if (TimeBasedUuid._ourNextIntraMillisecondIncrement == 10000) {
      // If we've gotten to here, it means we've already generated 10,000
      // UUIDs in this single millisecond, which is the most that the UUID
      // timestamp field allows for.  So now we'll just sit here and wait
      // for a fraction of a millisecond, so as to ensure that the next 
      // time this method is called there will be a different millisecond 
      // value in the timestamp field.
      while (now.valueOf() == TimeBasedUuid._ourDateValueOfPreviousUuid) {
        now = new Date();
      }
    }
  } else {
    TimeBasedUuid._ourDateValueOfPreviousUuid = now.valueOf();
    TimeBasedUuid._ourNextIntraMillisecondIncrement = 1;
  }
  
  var hexTimeLowLeftHalf  = arrayHundredNanosecondIntervalsSince1582[2].toString(TimeBasedUuid.HEX_RADIX);
  var hexTimeLowRightHalf = arrayHundredNanosecondIntervalsSince1582[3].toString(TimeBasedUuid.HEX_RADIX);
  var hexTimeLow = TimeBasedUuid._padWithLeadingZeros(hexTimeLowLeftHalf, 4) + TimeBasedUuid._padWithLeadingZeros(hexTimeLowRightHalf, 4);
  var hexTimeMid = arrayHundredNanosecondIntervalsSince1582[1].toString(TimeBasedUuid.HEX_RADIX);
  hexTimeMid = TimeBasedUuid._padWithLeadingZeros(hexTimeMid, 4);
  var hexTimeHigh = arrayHundredNanosecondIntervalsSince1582[0].toString(TimeBasedUuid.HEX_RADIX);
  hexTimeHigh = TimeBasedUuid._padWithLeadingZeros(hexTimeHigh, 3);
  var hyphen = "-";
  var versionCodeForTimeBasedUuids = "1"; // binary2hex("0001")
  var resultUuid = hexTimeLow + hyphen + hexTimeMid + hyphen +
        versionCodeForTimeBasedUuids + hexTimeHigh + hyphen +
        TimeBasedUuid._ourUuidClockSeqString + hyphen + pseudoNode;
  return resultUuid;
};


/**
 * Given a 36-character UUID string, this method returns the "node" or 
 * "pseudonode" portion of the UUID, which is the rightmost 12 characters.
 * 
 * @scope    private class method
 * @param    uuidString    A 36-character UUID string.
 * @return   Returns a 12-character string, which will look something like "917BF397618A".
 */
TimeBasedUuid._getNodeFromUuidString = function(uuidString) {
  var arrayOfStrings = uuidString.split('-');
  var nodeString = arrayOfStrings[4];
  return nodeString;
};


/**
 * Given a 36-character UUID string for a time-based UUID, this method 
 * returns a JavaScript Date object.
 * 
 * @scope    private class method
 * @param    uuidString    A 36-character UUID string for a time-based UUID.
 * @return   Returns a JavaScript Date objects
 */
TimeBasedUuid._getDateFromUuidString = function(uuidString) {
  var hexTimeLow = uuidString.split('-')[0];
  var hexTimeMid = uuidString.split('-')[1];
  var hexTimeHigh = uuidString.split('-')[2];
  var timeLow = parseInt(hexTimeLow, TimeBasedUuid.HEX_RADIX);
  var timeMid = parseInt(hexTimeMid, TimeBasedUuid.HEX_RADIX);
  var timeHigh = parseInt(hexTimeHigh, TimeBasedUuid.HEX_RADIX);
  var hundredNanosecondIntervalsSince1582 = timeHigh & 0x0FFF;
  hundredNanosecondIntervalsSince1582 <<= 16;
  hundredNanosecondIntervalsSince1582 += timeMid;
  // What we really want to do next is shift left 32 bits, but the result will be too big
  // to fit in an int, so we'll multiply by 2^32, and the result will be a floating point approximation.
  hundredNanosecondIntervalsSince1582 *= 0x100000000;
  hundredNanosecondIntervalsSince1582 += timeLow;
  var millisecondsSince1582 = hundredNanosecondIntervalsSince1582 / 10000;

  // Again, this will be a floating point approximation.
  // We can make things exact later if we need to.
  var secondsPerHour = 60 * 60;
  var hoursBetween1582and1970 = TimeBasedUuid.GREGORIAN_CHANGE_OFFSET_IN_HOURS;
  var secondsBetween1582and1970 = hoursBetween1582and1970 * secondsPerHour;
  var millisecondsBetween1582and1970 = secondsBetween1582and1970 * 1000;

  var millisecondsSince1970 = millisecondsSince1582 - millisecondsBetween1582and1970;

  var date = new Date(millisecondsSince1970);
  return date;
};


/**
 * Returns a 15-character string of hex digits that contains the creation
 * timestamp for this UUID, with the high-order bits first.  
 * 
 * @scope    private class method
 * @return   A 15-character string of hex digits.
 */
TimeBasedUuid._getTimestampAsHexString = function(uuidString) {
  var arrayOfParts = uuidString.split('-');
  var hexTimeLow = arrayOfParts[0];
  var hexTimeMid = arrayOfParts[1];
  var hexTimeHigh = arrayOfParts[2];

  // Chop off the leading "1" character, which is the UUID version number for
  // time-based UUIDs.
  hexTimeHigh = hexTimeHigh.slice(1); 
  
  returnString = hexTimeHigh + hexTimeMid + hexTimeLow;
  
  Util.assert(returnString.length == 15);
  return returnString;
};


/**
 * Given an array which holds a 64-bit number broken into 4 16-bit elements,
 * this method carries any excess bits (greater than 16-bits) from each array
 * element into the next.
 *
 * @scope    private class method
 * @param    arrayA    An array with 4 elements, each of which is a 16-bit number.
 */
TimeBasedUuid._carry = function(arrayA) {
  arrayA[2] += arrayA[3] >>> 16;
  arrayA[3] &= 0xFFFF;
  arrayA[1] += arrayA[2] >>> 16;
  arrayA[2] &= 0xFFFF;
  arrayA[0] += arrayA[1] >>> 16;
  arrayA[1] &= 0xFFFF;
  Util.assert((arrayA[0] >>> 16) === 0);
};


/**
 * Given a floating point number, this method returns an array which holds a 
 * 64-bit number broken into 4 16-bit elements.
 *
 * @scope    private class method
 * @param    x    A floating point number.
 * @return   An array with 4 elements, each of which is a 16-bit number.
 */
TimeBasedUuid._get64bitArrayFromFloat = function(x) {
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


/**
 * Takes two arrays, each of which holds a 64-bit number broken into 4 
 * 16-bit elements, and returns a new array that holds a 64-bit number
 * that is the sum of the two original numbers.
 *
 * @scope    private class method
 * @param    arrayA    An array with 4 elements, each of which is a 16-bit number.
 * @param    arrayB    An array with 4 elements, each of which is a 16-bit number.
 * @return   An array with 4 elements, each of which is a 16-bit number.
 */
TimeBasedUuid._addTwo64bitArrays = function(arrayA, arrayB) {
  Util.assert(Util.isArray(arrayA));
  Util.assert(arrayA.length == 4);
  Util.assert(Util.isArray(arrayB));
  Util.assert(arrayB.length == 4);
  var result = new Array(0, 0, 0, 0);
  result[3] = arrayA[3] + arrayB[3];
  result[2] = arrayA[2] + arrayB[2];
  result[1] = arrayA[1] + arrayB[1];
  result[0] = arrayA[0] + arrayB[0];
  TimeBasedUuid._carry(result);
  return result;
};


/**
 * Takes two arrays, each of which holds a 64-bit number broken into 4 
 * 16-bit elements, and returns a new array that holds a 64-bit number
 * that is the product of the two original numbers.
 *
 * @scope    private class method
 * @param    arrayA    An array with 4 elements, each of which is a 16-bit number.
 * @param    arrayB    An array with 4 elements, each of which is a 16-bit number.
 * @return   An array with 4 elements, each of which is a 16-bit number.
 */
TimeBasedUuid._multiplyTwo64bitArrays = function(arrayA, arrayB) {
  Util.assert(Util.isArray(arrayA));
  Util.assert(arrayA.length == 4);
  Util.assert(Util.isArray(arrayB));
  Util.assert(arrayB.length == 4);
  var overflow = false;
  if (arrayA[0] * arrayB[0] !== 0) { overflow = true; }
  if (arrayA[0] * arrayB[1] !== 0) { overflow = true; }
  if (arrayA[0] * arrayB[2] !== 0) { overflow = true; }
  if (arrayA[1] * arrayB[0] !== 0) { overflow = true; }
  if (arrayA[1] * arrayB[1] !== 0) { overflow = true; }
  if (arrayA[2] * arrayB[0] !== 0) { overflow = true; }
  Util.assert(!overflow);
  
  var result = new Array(0, 0, 0, 0);
  result[0] += arrayA[0] * arrayB[3];
  TimeBasedUuid._carry(result);
  result[0] += arrayA[1] * arrayB[2];
  TimeBasedUuid._carry(result);
  result[0] += arrayA[2] * arrayB[1];
  TimeBasedUuid._carry(result);
  result[0] += arrayA[3] * arrayB[0];
  TimeBasedUuid._carry(result);
  result[1] += arrayA[1] * arrayB[3];
  TimeBasedUuid._carry(result);
  result[1] += arrayA[2] * arrayB[2];
  TimeBasedUuid._carry(result);
  result[1] += arrayA[3] * arrayB[1];
  TimeBasedUuid._carry(result);
  result[2] += arrayA[2] * arrayB[3];
  TimeBasedUuid._carry(result);
  result[2] += arrayA[3] * arrayB[2];
  TimeBasedUuid._carry(result);
  result[3] += arrayA[3] * arrayB[3];
  TimeBasedUuid._carry(result);
  return result;
};


/**
 * Pads a string with leading zeros and returns the result.
 * For example:
 * <pre>
 *   result = TimeBasedUuid._padWithLeadingZeros("abc", 6);
 *   Util.assert(result == "000abc");
 * </pre>
 * 
 * @scope    private class method
 * @param    string    A string to add padding to.
 * @param    desiredLength    The number of characters the return string should have.
 * @return   A string.
 */
TimeBasedUuid._padWithLeadingZeros = function(string, desiredLength) {
  while (string.length < desiredLength) {
    string = "0" + string;
  }
  return string;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
