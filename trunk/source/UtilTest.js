/*****************************************************************************
 UtilTest.js
 
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
 
var UtilTestVars = null;

function setUp() {
  UtilTestVars = {};
  UtilTestVars.theHobbit = "The Hobbit";
}

function testSimplestCase() {
  assertTrue("This is true", true);
}

function testTypeCheckingMethods() {
  assertTrue('"The Hobbit" is a string', Util.isString("The Hobbit"));
  assertFalse('"The Hobbit" is not a number', Util.isNumber("The Hobbit"));
  assertFalse('"The Hobbit" is not numeric', Util.isNumeric("The Hobbit"));
  assertFalse('"The Hobbit" is not a boolean', Util.isBoolean("The Hobbit"));
  assertFalse('"The Hobbit" is not an object', Util.isObject("The Hobbit"));
  assertFalse('"The Hobbit" is not an array', Util.isArray("The Hobbit"));
  assertFalse('"The Hobbit" is not a hash table', Util.isHashTable("The Hobbit"));
}

function testMethodsThatOperateOnSets() {
  var aTinySet = [];
  var theHobbit = UtilTestVars.theHobbit;
  assertFalse('"The Hobbit" is not in an empty set', Util.isObjectInSet(theHobbit, aTinySet));
  assertTrue('"The Hobbit" can be added to an empty set', Util.addObjectToSet(theHobbit, aTinySet));
  assertTrue('"The Hobbit" is in the set after being added', Util.isObjectInSet(theHobbit, aTinySet));
  assertTrue('"The Hobbit" can be removed from a set it is in', Util.removeObjectFromSet(theHobbit, aTinySet));
  assertFalse('"The Hobbit" is no longer in a set it was removed from', Util.isObjectInSet(theHobbit, aTinySet));
  assertFalse('"The Hobbit" can not be removed twice', Util.removeObjectFromSet(theHobbit, aTinySet));

  setNumber2 = [123, "456", 78.9, new Date(), theHobbit];
  assertTrue('"The Hobbit" is in setNumber2', Util.isObjectInSet(theHobbit, setNumber2));
  assertTrue('78.9 is in setNumber2', Util.isObjectInSet(78.9, setNumber2));
  assertTrue('78.9 and "The Hobbit" is in setNumber2', Util.areObjectsInSet([78.9, theHobbit], setNumber2));
  assertTrue('All members of setNumber2 are in setNumber2', Util.areObjectsInSet(setNumber2, setNumber2));
  
}

function testMethodsForWorkingWithUuids() {
  
  var uuidString = Util.generateRandomUuid();
  assertTrue('UUIDs have 36 characters', (uuidString.length == 36));

  var validCharacters = "0123456789abcedfABCDEF-";
  var character;
  var position;
  for (var i = 0; i < 36; ++i) {
    character = uuidString.charAt(i);
    position = validCharacters.indexOf(character);
    assertTrue('UUIDs have only valid characters', (position != -1));
  }
  
  var arrayOfParts = uuidString.split("-");
  assertTrue('UUIDs have 5 sections separated by 4 hypens', (arrayOfParts.length == 5));
  assertTrue('Section 0 has 8 characters', (arrayOfParts[0].length == 8));
  assertTrue('Section 1 has 4 characters', (arrayOfParts[1].length == 4));
  assertTrue('Section 2 has 4 characters', (arrayOfParts[2].length == 4));
  assertTrue('Section 3 has 4 characters', (arrayOfParts[3].length == 4));
  assertTrue('Section 4 has 8 characters', (arrayOfParts[4].length == 12));
  
  var section2 = arrayOfParts[2];
  assertTrue('Section 2 starts with a 4', (section2.charAt(0) == "4"));
  
  var section3 = arrayOfParts[3];
  var validCharactersForStartOfSection3 = "89abAB";
  character = section3.charAt(0);
  position = validCharactersForStartOfSection3.indexOf(character);
  assertTrue('Section 3 starts with 8, 9, A, or B', (position != -1));
}

function tearDown() {
  test = null;
}

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
