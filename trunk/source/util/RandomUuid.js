/*****************************************************************************
 RandomUuid.js
 
******************************************************************************
 Written in 2005 by 
    Brian Douglas Skinner <brian.skinner@gumption.org>
  
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

dojo.provide("orp.util.RandomUuid");
dojo.require("orp.util.Uuid");

// -------------------------------------------------------------------
// Dependencies, expressed in the syntax that JSLint understands:
/*global Util  */
/*global Uuid  */
// -------------------------------------------------------------------


/**
 * The RandomUuid class offers methods for working with 
 * random UUIDs, meaning "version 4" UUIDs.
 * 
 * For more info, see 
 * http://www.webdav.org/specs/draft-leach-uuids-guids-01.txt
 *
 * @scope    public instance constructor
 */
// orp.util.RandomUuid.prototype = new orp.util.Uuid();  
orp.util.RandomUuid = function(uuidString) {
  orp.util.Uuid.call(this);
  if (uuidString) {
    Util.assert(Util.isString(uuidString));
    Util.assert(uuidString.length == 36);
    this._uuidString = uuidString;
  } else {
    this._uuidString = orp.util.RandomUuid._generateUuidString();
  }
};

dj_inherits(orp.util.RandomUuid, orp.util.Uuid);  // makes RandomUuid be a subclass of Uuid


// -------------------------------------------------------------------
// Public class constants
// -------------------------------------------------------------------
orp.util.RandomUuid.HEX_RADIX = 16;


// -------------------------------------------------------------------
// Private class methods
// -------------------------------------------------------------------

/**
 * Generates a random UUID, meaning a "version 4" UUID.  Hopefully this 
 * implementation conforms to the existing standards for UUIDs and GUIDs.  
 * 
 * @scope    public class method
 * @return   Returns a 36-character string, which will look something like "3B12F1DF-5232-4804-897E-917BF397618A".
 */
orp.util.RandomUuid._generateUuidString = function() {
  var hyphen = "-";
  var versionCodeForRandomlyGeneratedUuids = "4"; // 8 == binary2hex("0100")
  var variantCodeForDCEUuids = "8"; // 8 == binary2hex("1000")
  var a = orp.util.RandomUuid._generateRandomEightCharacterHexString();
  var b = orp.util.RandomUuid._generateRandomEightCharacterHexString();
  b = b.substring(0, 4) + hyphen + versionCodeForRandomlyGeneratedUuids + b.substring(5, 8);
  var c = orp.util.RandomUuid._generateRandomEightCharacterHexString();
  c = variantCodeForDCEUuids + c.substring(1, 4) + hyphen + c.substring(4, 8);
  var d = orp.util.RandomUuid._generateRandomEightCharacterHexString();
  var result = a + hyphen + b + hyphen + c + d;
  
  return result;
};


/**
 * Returns a randomly generated floating point number 
 * between 0 and (4,294,967,296 - 1), inclusive.
 *
 * @scope    private class method
 */
orp.util.RandomUuid._generateRandom32bitNumber = function() {
  return Math.floor( (Math.random() % 1) * Math.pow(2, 32) );
};


/**
 * Returns a randomly generated 8-character string of hex digits.
 *
 * @scope    private class method
 */
orp.util.RandomUuid._generateRandomEightCharacterHexString = function() {
  // PENDING: 
  // This isn't really random.  We should find some source of real 
  // randomness, and feed it to an MD5 hash algorithm.     
  var eightCharacterString = orp.util.RandomUuid._generateRandom32bitNumber().toString(orp.util.RandomUuid.HEX_RADIX);
  while (eightCharacterString.length < 8) {
    eightCharacterString = "0" + eightCharacterString;
  }
  return eightCharacterString;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
