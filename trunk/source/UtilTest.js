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
  var aSet = [];
  var theHobbit = UtilTestVars.theHobbit;
  assertFalse('"The Hobbit" is not in an empty set', Util.isObjectInSet(theHobbit, aSet));
  assertTrue('"The Hobbit" can be added to an empty set', Util.addObjectToSet(theHobbit, aSet));
  assertTrue('"The Hobbit" is in the set after being added', Util.isObjectInSet(theHobbit, aSet));
  assertTrue('"The Hobbit" can be removed from a set it is in', Util.removeObjectFromSet(theHobbit, aSet));
  assertFalse('"The Hobbit" is no longer in a set it was removed from', Util.isObjectInSet(theHobbit, aSet));
  assertFalse('"The Hobbit" can not be removed twice', Util.removeObjectFromSet(theHobbit, aSet));
}

function tearDown() {
  test = null;
}

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
