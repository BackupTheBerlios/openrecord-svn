/*****************************************************************************
 Uuid.js
 
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
// -------------------------------------------------------------------


/**
 * The Uuid class offers methods for generating UUIDs and 
 * inspecting existing UUIDs.
 * 
 * There is no need to ever call this constructor.  All the Uuid
 * methods are class methods, not instance methods, and the only 
 * reason this constructor exists is to cause the name "Uuid"
 * to be a globally-scoped class name, which the class methods 
 * can then be attached to.
 *
 * @scope    public instance constructor
 * @syntax   DO NOT CALL THIS CONSTRUCTOR
 */
function Uuid() {
  this._uuidString = Uuid.generateTimeBasedUuid();
}

// -------------------------------------------------------------------
// Uuid public class constants
// -------------------------------------------------------------------
// Number of seconds between October 15, 1582 and January 1, 1970
// Util.GREGORIAN_CHANGE_OFFSET_IN_SECONDS = 12219292800;
Uuid.GREGORIAN_CHANGE_OFFSET_IN_HOURS = 3394248;
Uuid.HEX_RADIX = 16;


// -------------------------------------------------------------------
// Uuid private global class variables
// -------------------------------------------------------------------
Uuid._ourUuidClockSeqString = null;
Uuid._ourDateValueOfPreviousUuid = null;
Uuid._ourNextIntraMillisecondIncrement = 0;


/**
 * Returns a 36-character string representing the UUID, such as 
 * "3B12F1DF-5232-1804-897E-917BF397618A".
 * 
 * @scope    public instance method
 * @return   Returns a 36-character UUID string.
 */
Uuid.prototype.toString = function() {
  return this._uuidString;
};


/**
 * Returns a 12-character string with the "node" or "pseudonode" portion of 
 * the UUID, which is the rightmost 12 characters.
 * 
 * @scope    public instance method
 * @return   Returns a 12-character string, which will look something like "917BF397618A".
 */
Uuid.prototype.getNode = function() {
  return Uuid.getNodeFromUuid(this._uuidString);
};


/**
 * Returns a JavaScript Date object with a value equal to the value in the
 * time fields of the UUID.
 * 
 * @scope    public class method
 * @return   Returns a JavaScript Date object.
 */
Uuid.prototype.getDate = function() {
  return Uuid.getDateFromUuid(this._uuidString);
};


// -------------------------------------------------------------------
// Public methods for working with UUIDs
// -------------------------------------------------------------------

mockUuidGenerator.queueOfUuids = new Array();

function mockUuidGenerator() {
  if (mockUuidGenerator.queueOfUuids.length === 0) {
    // This should probably throw an exception instead.    
    return "00000000-0000-0000-0000-000000000000";
  }
  return mockUuidGenerator.queueOfUuids.shift();
}

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
 * @param    pseudoNode    Optional. A 12-character string to use as the node in the new UUID.
 * @return   Returns a 36 character string, which will look something like "3B12F1DF-5232-1804-897E-917BF397618A".
 */
Uuid.generateTimeBasedUuid = function(pseudoNode) {
  Util.assert(!pseudoNode || Util.isString(pseudoNode));  
  if (pseudoNode) {
    Util.assert(pseudoNode.length == 12);  
  }
  else {
    var pseudoNodeIndicatorBit = 0x8000;
    var random15bitNumber = Math.floor( (Math.random() % 1) * Math.pow(2, 15) );
    var leftmost4HexCharacters = (pseudoNodeIndicatorBit | random15bitNumber).toString(Uuid.HEX_RADIX);
    pseudoNode = leftmost4HexCharacters + Uuid._getRandomEightCharacterHexString();
  }
  if (!Uuid._ourUuidClockSeqString) {
    var variantCodeForDCEUuids = 0x8000; // 10--------------, i.e. uses only first two of 16 bits.
    var random14bitNumber = Math.floor( (Math.random() % 1) * Math.pow(2, 14) );
    Uuid._ourUuidClockSeqString = (variantCodeForDCEUuids | random14bitNumber).toString(Uuid.HEX_RADIX);
  }

  // Maybe someday think about trying to make the code more readable to
  // newcomers by creating a class called "WholeNumber" that encapsulates
  // the methods and data structures for working with these arrays that 
  // hold 4 16-bit numbers?  And then these variables below have names  
  // like "wholeSecondsPerHour" rather than "arraySecondsPerHour"?
  var now = new Date();
  var nowArray = Uuid._get64bitArrayFromFloat(now.valueOf());
  var arraySecondsPerHour = Uuid._get64bitArrayFromFloat(60 * 60);
  var arrayHoursBetween1582and1970 = Uuid._get64bitArrayFromFloat(Uuid.GREGORIAN_CHANGE_OFFSET_IN_HOURS);
  var arraySecondsBetween1582and1970 = Uuid._multiplyTwo64bitArrays(arrayHoursBetween1582and1970, arraySecondsPerHour);
  var arrayMillisecondsPerSecond = Uuid._get64bitArrayFromFloat(1000);
  var arrayMillisecondsBetween1582and1970 = Uuid._multiplyTwo64bitArrays(arraySecondsBetween1582and1970, arrayMillisecondsPerSecond);
  var arrayMillisecondsSince1970 = nowArray;
  var arrayMillisecondsSince1582 = Uuid._addTwo64bitArrays(arrayMillisecondsBetween1582and1970, arrayMillisecondsSince1970);
  var arrayMicrosecondsPerMillisecond = Uuid._get64bitArrayFromFloat(1000);
  var arrayMicrosecondsSince1582 = Uuid._multiplyTwo64bitArrays(arrayMillisecondsSince1582, arrayMicrosecondsPerMillisecond);
  var arrayHundredNanosecondIntervalsPerMicrosecond = Uuid._get64bitArrayFromFloat(10);
  var arrayHundredNanosecondIntervalsSince1582 = Uuid._multiplyTwo64bitArrays(arrayMicrosecondsSince1582, arrayHundredNanosecondIntervalsPerMicrosecond);
  
  if (now.valueOf() == Uuid._ourDateValueOfPreviousUuid) {
    arrayHundredNanosecondIntervalsSince1582[3] += Uuid._ourNextIntraMillisecondIncrement;
    Uuid._carry(arrayHundredNanosecondIntervalsSince1582);
    Uuid._ourNextIntraMillisecondIncrement += 1;
    if (Uuid._ourNextIntraMillisecondIncrement == 10000) {
      // If we've gotten to here, it means we've already generated 10,000
      // UUIDs in this single millisecond, which is the most that the UUID
      // timestamp field allows for.  So now we'll just sit here and wait
      // for a fraction of a millisecond, so as to ensure that the next 
      // time this method is called there will be a different millisecond 
      // value in the timestamp field.
      while (now.valueOf() == Uuid._ourDateValueOfPreviousUuid) {
        now = new Date();
      }
    }
  }
  else {
    Uuid._ourDateValueOfPreviousUuid = now.valueOf();
    Uuid._ourNextIntraMillisecondIncrement = 1;
  }
  
  var hexTimeLowLeftHalf  = arrayHundredNanosecondIntervalsSince1582[2].toString(Uuid.HEX_RADIX);
  var hexTimeLowRightHalf = arrayHundredNanosecondIntervalsSince1582[3].toString(Uuid.HEX_RADIX);
  var hexTimeLow = Uuid._padWithLeadingZeros(hexTimeLowLeftHalf, 4) + Uuid._padWithLeadingZeros(hexTimeLowRightHalf, 4);
  var hexTimeMid = arrayHundredNanosecondIntervalsSince1582[1].toString(Uuid.HEX_RADIX);
  hexTimeMid = Uuid._padWithLeadingZeros(hexTimeMid, 4);
  var hexTimeHigh = arrayHundredNanosecondIntervalsSince1582[0].toString(Uuid.HEX_RADIX);
  hexTimeHigh = Uuid._padWithLeadingZeros(hexTimeHigh, 3);
  var hyphen = "-";
  var versionCodeForTimeBasedUuids = "1"; // binary2hex("0001")
  var resultUuid = hexTimeLow + hyphen + hexTimeMid + hyphen +
        versionCodeForTimeBasedUuids + hexTimeHigh + hyphen +
        Uuid._ourUuidClockSeqString + hyphen + pseudoNode;
  return resultUuid;
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
Uuid.generateRandomUuid = function() {
  var hyphen = "-";
  var versionCodeForRandomlyGeneratedUuids = "4"; // 8 == binary2hex("0100")
  var variantCodeForDCEUuids = "8"; // 8 == binary2hex("1000")
  var a = Uuid._getRandomEightCharacterHexString();
  var b = Uuid._getRandomEightCharacterHexString();
  b = b.substring(0, 4) + hyphen + versionCodeForRandomlyGeneratedUuids + b.substring(5, 8);
  var c = Uuid._getRandomEightCharacterHexString();
  c = variantCodeForDCEUuids + c.substring(1, 4) + hyphen + c.substring(4, 8);
  var d = Uuid._getRandomEightCharacterHexString();
  var result = a + hyphen + b + hyphen + c + d;
  
  return result;
};


/**
 * Given a 36-character UUID string, this method returns the "node" or 
 * "pseudonode" portion of the UUID, which is the rightmost 12 characters.
 * 
 * @scope    public class method
 * @param    uuid    A 36-character UUID string.
 * @return   Returns a 12-character string, which will look something like "917BF397618A".
 */
Uuid.getNodeFromUuid = function(uuid) {
  var arrayOfStrings = uuid.split('-');
  var nodeString = arrayOfStrings[4];
  return nodeString;
};


/**
 * Given a 36-character UUID string for a time-based UUID, this method 
 * returns a JavaScript Date object.
 * 
 * @scope    public class method
 * @param    uuid    A 36-character UUID string for a time-based UUID.
 * @return   Returns a JavaScript Date objects
 */
Uuid.getDateFromUuid = function(uuid) {
  var hexTimeLow = uuid.split('-')[0];
  var hexTimeMid = uuid.split('-')[1];
  var hexTimeHigh = uuid.split('-')[2];
  var timeLow = parseInt(hexTimeLow, Uuid.HEX_RADIX);
  var timeMid = parseInt(hexTimeMid, Uuid.HEX_RADIX);
  var timeHigh = parseInt(hexTimeHigh, Uuid.HEX_RADIX);
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
  var hoursBetween1582and1970 = Uuid.GREGORIAN_CHANGE_OFFSET_IN_HOURS;
  var secondsBetween1582and1970 = hoursBetween1582and1970 * secondsPerHour;
  var millisecondsBetween1582and1970 = secondsBetween1582and1970 * 1000;

  var millisecondsSince1970 = millisecondsSince1582 - millisecondsBetween1582and1970;

  var date = new Date(millisecondsSince1970);
  return date;
};


Uuid.getOriginalOrdinalFromUuid = function(uuid) {
  var hexTimeLow = uuid.split('-')[0];
  var hexTimeMid = uuid.split('-')[1];
  var hexTimeHigh = uuid.split('-')[2];
  return hexTimeHigh + hexTimeMid + hexTimeLow;
};

// -------------------------------------------------------------------
// Private methods
// -------------------------------------------------------------------

/**
 * 
 */
Uuid._getRandom32bitNumber = function() {
  return Math.floor( (Math.random() % 1) * Math.pow(2, 32) );
};


/**
 * 
 */
Uuid._getRandomEightCharacterHexString = function() {
  // PENDING: 
  // This isn't really random.  We should find some source of real 
  // randomness, and feed it to an MD5 hash algorithm.     
  var eightCharacterString = Uuid._getRandom32bitNumber().toString(Uuid.HEX_RADIX);
  while (eightCharacterString.length < 8) {
    eightCharacterString = "0" + eightCharacterString;
  }
  return eightCharacterString;
};


/**
 * 
 */
Uuid._carry = function(a) {
  a[2] += a[3] >>> 16;
  a[3] &= 0xFFFF;
  a[1] += a[2] >>> 16;
  a[2] &= 0xFFFF;
  a[0] += a[1] >>> 16;
  a[1] &= 0xFFFF;
  Util.assert((a[0] >>> 16) === 0);
};


/**
 * 
 */
Uuid._get64bitArrayFromFloat = function(x) {
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
 * 
 */
Uuid._addTwo64bitArrays = function(a, b) {
  Util.assert(Util.isArray(a));
  Util.assert(a.length == 4);
  Util.assert(Util.isArray(b));
  Util.assert(b.length == 4);
  var result = new Array(0, 0, 0, 0);
  result[3] = a[3] + b[3];
  result[2] = a[2] + b[2];
  result[1] = a[1] + b[1];
  result[0] = a[0] + b[0];
  Uuid._carry(result);
  return result;
};


/**
 * 
 */
Uuid._multiplyTwo64bitArrays = function(a, b) {
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
  Uuid._carry(result);
  result[0] += a[1] * b[2];
  Uuid._carry(result);
  result[0] += a[2] * b[1];
  Uuid._carry(result);
  result[0] += a[3] * b[0];
  Uuid._carry(result);
  result[1] += a[1] * b[3];
  Uuid._carry(result);
  result[1] += a[2] * b[2];
  Uuid._carry(result);
  result[1] += a[3] * b[1];
  Uuid._carry(result);
  result[2] += a[2] * b[3];
  Uuid._carry(result);
  result[2] += a[3] * b[2];
  Uuid._carry(result);
  result[3] += a[3] * b[3];
  Uuid._carry(result);
  return result;
};


/**
 * 
 */
Uuid._padWithLeadingZeros = function(string, desiredLength) {
  while (string.length < desiredLength) {
    string = "0" + string;
  }
  return string;
};

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
