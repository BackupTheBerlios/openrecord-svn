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


// -------------------------------------------------------------------
// Provides and Requires
// -------------------------------------------------------------------
dojo.provide("orp.util.RandomUuid");
dojo.require("orp.util.Uuid");


// -------------------------------------------------------------------
// Dependencies, expressed in the syntax that JSLint understands:
/*global Util  */
/*global Uuid  */
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------

/**
 * The RandomUuid class offers methods for working with 
 * random UUIDs, meaning "version 4" UUIDs.
 * 
 * For more info, see 
 * http://www.webdav.org/specs/draft-leach-uuids-guids-01.txt
 *
 * Examples:
 * <pre>
 *   var uuid = new orp.util.RandomUuid();
 *   var uuid = new orp.util.RandomUuid("3B12F1DF-5232-4804-897E-917BF397618A");
 *   var uuid = new orp.util.RandomUuid({uuidString: "3B12F1DF-5232-4804-897E-917BF397618A"});
 * </pre>
 *
 * @scope    public instance constructor
 * @param    uuidString    A 36-character string that conforms to the UUID spec. 
 * @namedParam    uuidString    A 36-character string that conforms to the UUID spec. 
 */
orp.util.RandomUuid = function(namedParameters) {
  orp.util.Uuid.call(this);
  var uuidString;
  if (namedParameters) {
    if (dojo.lang.isString(namedParameters)) {
      uuidString = namedParameters;
    } else {
      if (dojo.lang.isObject(namedParameters)) {
        uuidString = namedParameters[orp.util.Uuid.NamedParameters.uuidString];
        Util.assert(Util.hasNoUnexpectedProperties(namedParameters, [orp.util.Uuid.NamedParameters.uuidString]));
      } else {
        Util.assert(false);
      }
    }
    Util.assert(dojo.lang.isString(uuidString));
    Util.assert(uuidString.length == 36);
    this._uuidString = uuidString;
  } else {
    this._uuidString = this._generateUuidString();
  }
  Util.assert(this.getVersion() == orp.util.Uuid.Version.RANDOM);
};

dj_inherits(orp.util.RandomUuid, orp.util.Uuid);  // makes RandomUuid be a subclass of Uuid


// -------------------------------------------------------------------
// Private class methods
// -------------------------------------------------------------------

/**
 * Generates a random UUID, meaning a "version 4" UUID.  Hopefully this 
 * implementation conforms to the existing standards for UUIDs and GUIDs.  
 * 
 * @scope    public instance method
 * @return   Returns a 36-character string, which will look something like "3B12F1DF-5232-4804-897E-917BF397618A".
 */
orp.util.RandomUuid.prototype._generateUuidString = function() {
  var hyphen = "-";
  var versionCodeForRandomlyGeneratedUuids = "4"; // 8 == binary2hex("0100")
  var variantCodeForDCEUuids = "8"; // 8 == binary2hex("1000")
  var a = this._generateRandomEightCharacterHexString();
  var b = this._generateRandomEightCharacterHexString();
  b = b.substring(0, 4) + hyphen + versionCodeForRandomlyGeneratedUuids + b.substring(5, 8);
  var c = this._generateRandomEightCharacterHexString();
  c = variantCodeForDCEUuids + c.substring(1, 4) + hyphen + c.substring(4, 8);
  var d = this._generateRandomEightCharacterHexString();
  var result = a + hyphen + b + hyphen + c + d;
  
  return result;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
