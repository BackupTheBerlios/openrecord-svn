/*****************************************************************************
 LangTest.js
 
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
 

// -------------------------------------------------------------------
// setUp and tearDown
// -------------------------------------------------------------------

function setUp() {
  dojo.hostenv.setModulePrefix("dojo", "../../../dojo/dojo-0.1.0/src");
  dojo.hostenv.setModulePrefix("orp", "../../../../source");
  dojo.require("orp.lang.Lang");
}

function tearDown() {
}


// -------------------------------------------------------------------
// Test functions
// -------------------------------------------------------------------

function testSimpleErrorCatching() {
  var caughtError = false;
  try {
    throw new Error();
  } catch (e) {
    caughtError = true;
  }
  assertTrue("We caught an error", caughtError);
}

function testAbsenceOfErrors() {
  var caughtError = false;
  try {
    var four = 2 + 2;
  } catch (e) {
    caughtError = true;
  }
  assertTrue("We did not catch an error", !caughtError);
}

function testAssertionsThatPass() {
  var caughtError = false;
  try {
    orp.lang.assert(2 + 2 == 4);
    orp.lang.assert((2 + 2 == 4), "Two plus two is four");
    orp.lang.assert(dojo.lang.isBoolean(false));
  } catch (e) {
    caughtError = true;
  }
  assertTrue("None of the assert statements failed", !caughtError);
}

function testAssertionsThatFail() {
  var numberOfFailures = 0;
  try {
    orp.lang.assert(2 + 2 == 3);
  } catch (e) {
    ++numberOfFailures;
  }
  try {
    orp.lang.assert(2 + 2 == 3, "Two plus two is three");
  } catch (e) {
    ++numberOfFailures;
  }
  assertTrue("All of the assert statements failed", (numberOfFailures == 2));
}

function testTypeChecksThatPass() {
  var caughtError = false;
  var listOfPairs = [
    ["foo", String],
    [new String("foo"), String],
    [12345, Number],
    [new Number(12345), Number],
    [false, Boolean],
    [[6, 8], Array],
    [new Array(), Array],
    [orp.lang.assertType, Function],
    [testTypeChecksThatFail, Function],
    [{foo: "bar"}, Object],
    [new Object(), Object],
    [new Date(), Object],
    [new Date(), Date]
  ];
  for (var i in listOfPairs) {
    var pair = listOfPairs[i];
    var value = pair[0];
    var type = pair[1];
    try {
      orp.lang.assertType(value, type);
      orp.lang.assertTypeForOptionalValue(value, type);
    } catch (e) {
      caughtError = true;
    }
  }
  assertTrue("None of the assertType() calls failed", !caughtError);
}

function testTypeChecksThatFail() {
  var numberOfFailures = 0;
  var listOfPairs = [
    ["foo", Number],
    [new String("foo"), Boolean],
    [12345, String],
    [new Number(12345), Array],
    [false, Date],
    [[6, 8], Function],
    [new Array(), Date],
    [orp.lang.assertType, Boolean],
    [testTypeChecksThatFail, Number],
    [{foo: "bar"}, Date],
    [new Object(), String],
    [new Date(), Array],
    [new Date(), Number]
  ];
  for (var i in listOfPairs) {
    var pair = listOfPairs[i];
    var value = pair[0];
    var type = pair[1];
    try {
      orp.lang.assertType(value, type);
    } catch (e) {
      ++numberOfFailures;
    }
    try {
      orp.lang.assertTypeForOptionalValue(value, type);
    } catch (e) {
      ++numberOfFailures;
    }
  }
  assertTrue("All of the assertType() calls failed", (numberOfFailures == 26));
}

function testTypeCheckingOptionalValues() {
  var foo;
  var caughtError = false;
  try {
    orp.lang.assertTypeForOptionalValue(foo, String);
  } catch (e) {
    caughtError = true;
  }
  assertTrue("assertTypeForOptionalValue() allows an absent value", !caughtError);
  try {
    orp.lang.assertType(foo, String);
  } catch (e) {
    caughtError = true;
  }
  assertTrue("assertType() does not allow an absent value", caughtError);
}

function nop_testFoo() {
  orp.lang.assert(false, "This is an example of an assert that fails.");
}



// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
