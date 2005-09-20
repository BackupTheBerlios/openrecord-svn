/*****************************************************************************
 UtilTest.js
 
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
 
var UtilTestVars = null;


// -------------------------------------------------------------------
// setUp and tearDown
// -------------------------------------------------------------------

function setUp() {
  UtilTestVars = {};
  UtilTestVars.theHobbit = "The Hobbit";
}

function tearDown() {
  UtilTestVars = null;
}


// -------------------------------------------------------------------
// Test functions
// -------------------------------------------------------------------

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

  var setNumber2 = [123, "456", 78.9, new Date(), theHobbit];
  assertTrue('"The Hobbit" is in setNumber2', Util.isObjectInSet(theHobbit, setNumber2));
  assertTrue('78.9 is in setNumber2', Util.isObjectInSet(78.9, setNumber2));
  assertTrue('78.9 and "The Hobbit" is in setNumber2', Util.areObjectsInSet([78.9, theHobbit], setNumber2));
  assertTrue('All members of setNumber2 are in setNumber2', Util.areObjectsInSet(setNumber2, setNumber2));
}

function testEncryptionMethods() {
  var longString = "When in the course of human events: d41d8cd98f00b204e9800998ecf8427e";
  assertTrue('md5 of "" is correct', (Util.hex_md5("") == "d41d8cd98f00b204e9800998ecf8427e"));
  assertTrue('md5 of "iggy" is correct', (Util.hex_md5("iggy") == "0e026f55a72c0861a93e750c2a5427b1"));
  assertTrue('md5 of longString is correct', (Util.hex_md5(longString) == "4d694e03af399831c6f0c1f1bcc2fc93"));
}

function testIsEmpty() {
  var canada = {name:"Canada", provinces:8};
  var atlantis = {};
  
  assertTrue('Canada has properties', !Util.isEmpty(canada));
  assertTrue('Atlantis does not have properties', Util.isEmpty(atlantis));
  
  delete canada.name;
  delete canada.provinces;
  assertTrue('Canada does not have properties', Util.isEmpty(canada));
}

function testHasProperty() {
  var canada = {name:"Canada", provinces:8};
  var atlantis = {};

  assertTrue('Canada has a name', Util.hasProperty(canada, "name"));
  assertTrue('Canada does not have a foo', !Util.hasProperty(canada, "foo"));
  
  assertTrue('Atlantis does not have a name', !Util.hasProperty(atlantis, "name"));

  assertTrue('Atlantis has []', Util.hasProperties(atlantis, []));
  assertTrue('Canada has ["name", "provinces"]', Util.hasProperties(canada, ["name", "provinces"]));
  assertTrue('Canada has ["name"]', Util.hasProperties(canada, ["name"]));
  assertTrue('Canada has []', Util.hasProperties(canada, []));
  assertTrue('Canada does not have ["foo", "bar"]', !Util.hasProperties(canada, ["foo", "bar"]));

  assertTrue('Canada has only ["name", "provinces"]', Util.hasNoUnexpectedProperties(canada, ["name", "provinces"]));
  assertTrue('Canada does not have just ["name"]', !Util.hasNoUnexpectedProperties(canada, ["name"]));
  
  assertTrue('Canada does not have just ["name"]', !Util.hasExactlyTheseProperties(canada, ["name"]));
  assertTrue('Canada has ["name", "provinces"]', Util.hasExactlyTheseProperties(canada, ["name", "provinces"]));
  assertTrue('Canada does not have ["name", "provinces", "foo"]', !Util.hasExactlyTheseProperties(canada, ["name", "provinces", "foo"]));
}

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
