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
// Provides and Requires
// -------------------------------------------------------------------
dojo.provide("orp.util.Uuid");
dojo.require("dojo.lang.*");
dojo.require("orp.util.Util");


// -------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------

/**
 * The Uuid class offers methods for generating UUIDs and 
 * inspecting existing UUIDs.
 *
 * Examples:
 * <pre>
 *   var uuid = new orp.util.Uuid("3B12F1DF-5232-4804-897E-917BF397618A");
 *   var uuid = new orp.util.Uuid({uuidString: "3B12F1DF-5232-4804-897E-917BF397618A"});
 * </pre>
 *
 * @scope    public instance constructor
 * @param    uuidString    A 36-character string that conforms to the UUID spec. 
 * @namedParam    uuidString    A 36-character string that conforms to the UUID spec. 
 */
orp.util.Uuid = function(uuidString) {
  this._uuidString = null;
  if (uuidString) {
    if (dojo.lang.isString(uuidString)) {
      this._uuidString = uuidString;
    } else {
      if (dojo.lang.isObject(uuidString)) {
        var namedParameters = uuidString;
        this._uuidString = namedParameters["uuidString"];
        
        // Check for typos in parameter names
        orp.util.assert(orp.util.hasNoUnexpectedProperties(namedParameters, ["uuidString"]));
      } else {
        orp.util.assert(false);
      }
    }
  }
};


// -------------------------------------------------------------------
// Public constants
// -------------------------------------------------------------------
orp.util.Uuid.HEX_RADIX = 16;
orp.util.Uuid.Version = {
  UNKNOWN: 0,
  TIME_BASED: 1,
  DCE_SECURITY: 2,
  NAME_BASED_MD5: 3,
  RANDOM: 4,
  NAME_BASED_SHA1: 5 };
orp.util.Uuid.Variant = {
  NCS: "0",
  DCE: "10",
  MICROSOFT: "110",
  UNKNOWN: "111" };
orp.util.Uuid.NamedParameters = {
  uuidString: "uuidString" };

// -------------------------------------------------------------------
// Public class methods
// -------------------------------------------------------------------

/**
 * Given a 36-character string representing a UUID, returns a new UUID object.
 *
 * @scope    public class method
 * @param    uuidString    A 36-character string that conforms to the UUID spec. 
 * @namedParam    uuidString    A 36-character string that conforms to the UUID spec. 
 * @return   A new instance of Uuid, TimeBasedUuid, or RandomUuid.
 */
orp.util.Uuid.newUuid = function(namedParameters) {
  dojo.require("orp.util.RandomUuid");
  dojo.require("orp.util.TimeBasedUuid");
  
  var uuidString;
  if (dojo.lang.isString(namedParameters)) {
    uuidString = namedParameters;
  } else {
    orp.util.assert(dojo.lang.isObject(namedParameters));
    uuidString = namedParameters[orp.util.Uuid.NamedParameters.uuidString];
    orp.util.assert(dojo.lang.isString(uuidString));
    
    // Check for typos in parameter names
    orp.util.assert(orp.util.hasNoUnexpectedProperties(namedParameters, [orp.util.Uuid.NamedParameters.uuidString]));
  }

  var uuid = new orp.util.Uuid(uuidString);
  if (uuid.getVersion() == orp.util.Uuid.Version.TIME_BASED) {
    uuid = new orp.util.TimeBasedUuid(uuidString);
  }
  if (uuid.getVersion() == orp.util.Uuid.Version.RANDOM) {
    uuid = new orp.util.RandomUuid(uuidString);
  }
  return uuid;
};


// -------------------------------------------------------------------
// Private class constants
// -------------------------------------------------------------------
orp.util.Uuid._ourVariantLookupTable = null;


// -------------------------------------------------------------------
// Public instance methods
// -------------------------------------------------------------------

/**
 * Returns a 36-character string representing the UUID, such as: 
 * <pre>
 *   "3B12F1DF-5232-1804-897E-917BF397618A"
 * </pre>
 *
 * @scope    public instance method
 * @return   Returns a 36-character UUID string.
 */
orp.util.Uuid.prototype.toString = function() {
  return this._uuidString;
};


/**
 * Returns a version number that indicates what type of UUID this is. 
 * For example:
 * <pre>
 *   var uuid = new orp.util.Uuid("3B12F1DF-5232-4804-897E-917BF397618A");
 *   var version = uuid.getVersion();
 *   orp.util.assert(version == orp.util.Uuid.Version.TIME_BASED);
 * </pre>
 *
 * @scope    public instance method
 * @return   Returns one of the enumarted orp.util.Uuid.Version values.
 */
orp.util.Uuid.prototype.getVersion = function() {
  // "3B12F1DF-5232-1804-897E-917BF397618A"
  //                ^
  //                |
  //       (version 1 == TIME_BASED)
  var versionCharacter = this._uuidString.charAt(14);
  var versionNumber = parseInt(versionCharacter, orp.util.Uuid.HEX_RADIX);
  return versionNumber;
};


/**
 * Returns a variant code that indicates what type of UUID this is. 
 * For example:
 * <pre>
 *   var uuid = new orp.util.Uuid("3B12F1DF-5232-4804-897E-917BF397618A");
 *   var variant = uuid.getVariant();
 *   orp.util.assert(variant == orp.util.Uuid.Variant.DCE);
 * </pre>
 *
 * @scope    public instance method
 * @return   Returns one of the enumarted orp.util.Uuid.Variant values.
 */
orp.util.Uuid.prototype.getVariant = function() {
  // "3B12F1DF-5232-1804-897E-917BF397618A"
  //                     ^
  //                     |
  //         (variant "10__" == DCE)
  var variantCharacter = this._uuidString.charAt(19);
  var variantNumber = parseInt(variantCharacter, orp.util.Uuid.HEX_RADIX);
  orp.util.assert((variantNumber >= 0) && (variantNumber <= 16));
  
  if (!orp.util.Uuid._ourVariantLookupTable) {
    var Variant = orp.util.Uuid.Variant;
    var lookupTable = [];
    orp.util.Uuid._ourVariantLookupTable = lookupTable;
    
    lookupTable[0x0] = Variant.NCS;       // 0000
    lookupTable[0x1] = Variant.NCS;       // 0001
    lookupTable[0x2] = Variant.NCS;       // 0010
    lookupTable[0x3] = Variant.NCS;       // 0011
    
    lookupTable[0x4] = Variant.NCS;       // 0100
    lookupTable[0x5] = Variant.NCS;       // 0101
    lookupTable[0x6] = Variant.NCS;       // 0110
    lookupTable[0x7] = Variant.NCS;       // 0111

    lookupTable[0x8] = Variant.DCE;       // 1000
    lookupTable[0x9] = Variant.DCE;       // 1001
    lookupTable[0xA] = Variant.DCE;       // 1010
    lookupTable[0xB] = Variant.DCE;       // 1011
    
    lookupTable[0xC] = Variant.MICROSOFT; // 1100
    lookupTable[0xD] = Variant.MICROSOFT; // 1101
    lookupTable[0xE] = Variant.UNKNOWN;   // 1110
    lookupTable[0xF] = Variant.UNKNOWN;   // 1111
  }
  
  return orp.util.Uuid._ourVariantLookupTable[variantNumber];
};


// -------------------------------------------------------------------
// Private instance methods
// -------------------------------------------------------------------

/**
 * Returns a randomly generated 8-character string of hex digits.
 *
 * @scope    private instance method
 */
orp.util.Uuid.prototype._generateRandomEightCharacterHexString = function() {
  // PENDING: 
  // This isn't really random.  We should find some source of real 
  // randomness, and feed it to an MD5 hash algorithm.
  
  
  // random32bitNumber is a randomly generated floating point number 
  // between 0 and (4,294,967,296 - 1), inclusive.
  var random32bitNumber = Math.floor( (Math.random() % 1) * Math.pow(2, 32) );
  
  var eightCharacterString = random32bitNumber.toString(orp.util.Uuid.HEX_RADIX);
  while (eightCharacterString.length < 8) {
    eightCharacterString = "0" + eightCharacterString;
  }
  return eightCharacterString;
};



// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
