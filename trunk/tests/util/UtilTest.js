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
  dojo.hostenv.setModulePrefix("dojo", "../../../dojo/dojo-rev1759/src");
  dojo.hostenv.setModulePrefix("orp", "../../../../source");
  dojo.require("orp.util.Util");
  dojo.require("dojo.lang.*");
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
  assertTrue('"The Hobbit" is a string', dojo.lang.isString("The Hobbit"));
  assertFalse('"The Hobbit" is not a number', dojo.lang.isNumber("The Hobbit"));
  assertFalse('"The Hobbit" is not numeric', orp.util.isNumeric("The Hobbit"));
  assertFalse('"The Hobbit" is not a boolean', dojo.lang.isBoolean("The Hobbit"));
  assertFalse('"The Hobbit" is not an object', dojo.lang.isObject("The Hobbit"));
  assertFalse('"The Hobbit" is not an array', dojo.lang.isArray("The Hobbit"));
  assertFalse('"The Hobbit" is not a hash table', orp.util.isHashTable("The Hobbit"));
}

function testMethodsThatOperateOnSets() {
  var aTinySet = [];
  var theHobbit = UtilTestVars.theHobbit;
  assertFalse('"The Hobbit" is not in an empty set', orp.util.isObjectInSet(theHobbit, aTinySet));
  assertTrue('"The Hobbit" can be added to an empty set', orp.util.addObjectToSet(theHobbit, aTinySet));
  assertTrue('"The Hobbit" is in the set after being added', orp.util.isObjectInSet(theHobbit, aTinySet));
  assertTrue('"The Hobbit" can be removed from a set it is in', orp.util.removeObjectFromSet(theHobbit, aTinySet));
  assertFalse('"The Hobbit" is no longer in a set it was removed from', orp.util.isObjectInSet(theHobbit, aTinySet));
  assertFalse('"The Hobbit" can not be removed twice', orp.util.removeObjectFromSet(theHobbit, aTinySet));

  var setNumber2 = [123, "456", 78.9, new Date(), theHobbit];
  assertTrue('"The Hobbit" is in setNumber2', orp.util.isObjectInSet(theHobbit, setNumber2));
  assertTrue('78.9 is in setNumber2', orp.util.isObjectInSet(78.9, setNumber2));
  assertTrue('78.9 and "The Hobbit" is in setNumber2', orp.util.areObjectsInSet([78.9, theHobbit], setNumber2));
  assertTrue('All members of setNumber2 are in setNumber2', orp.util.areObjectsInSet(setNumber2, setNumber2));
}

function testIsEmpty() {
  var canada = {name:"Canada", provinces:8};
  var atlantis = {};
  
  assertTrue('Canada has properties', !orp.util.isEmpty(canada));
  assertTrue('Atlantis does not have properties', orp.util.isEmpty(atlantis));
  
  delete canada.name;
  delete canada.provinces;
  assertTrue('Canada does not have properties', orp.util.isEmpty(canada));
}

function testHasProperty() {
  var expectedProperties = {name: "name", provinces: "provinces" };
  var unexpectedProperties = {foo: "foo", bar: "bar" };
  var canada = {name:"Canada", provinces:8};
  var atlantis = {};

  assertTrue('Canada has a name', orp.util.hasProperty(canada, "name"));
  assertTrue('Canada does not have a foo', !orp.util.hasProperty(canada, "foo"));
  
  assertTrue('Atlantis does not have a name', !orp.util.hasProperty(atlantis, "name"));

  assertTrue('Atlantis has []', orp.util.hasProperties(atlantis, []));
  assertTrue('Atlantis has {}', orp.util.hasProperties(atlantis, {}));
  assertTrue('Canada has ["name", "provinces"]', orp.util.hasProperties(canada, ["name", "provinces"]));
  assertTrue('Canada has expectedProperties', orp.util.hasProperties(canada, expectedProperties));
  assertTrue('Canada has ["name"]', orp.util.hasProperties(canada, ["name"]));
  assertTrue('Canada has []', orp.util.hasProperties(canada, []));
  assertTrue('Canada has {}', orp.util.hasProperties(canada, {}));
  assertTrue('Canada does not have ["foo", "bar"]', !orp.util.hasProperties(canada, ["foo", "bar"]));
  assertTrue('Canada does not have unexpectedProperties', !orp.util.hasProperties(canada, unexpectedProperties));

  assertTrue('Canada has only ["name", "provinces"]', orp.util.hasNoUnexpectedProperties(canada, ["name", "provinces"]));
  assertTrue('Canada has only expectedProperties', orp.util.hasNoUnexpectedProperties(canada, expectedProperties));
  assertTrue('Canada does not have just ["name"]', !orp.util.hasNoUnexpectedProperties(canada, ["name"]));
  
  assertTrue('Canada does not have just ["name"]', !orp.util.hasExactlyTheseProperties(canada, ["name"]));
  assertTrue('Canada has ["name", "provinces"]', orp.util.hasExactlyTheseProperties(canada, ["name", "provinces"]));
  assertTrue('Canada has expectedProperties', orp.util.hasExactlyTheseProperties(canada, expectedProperties));
  assertTrue('Canada does not have ["name", "provinces", "foo"]', !orp.util.hasExactlyTheseProperties(canada, ["name", "provinces", "foo"]));
  assertTrue('Canada does not have unexpectedProperties', !orp.util.hasExactlyTheseProperties(canada, unexpectedProperties));
}

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
