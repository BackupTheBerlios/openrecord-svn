/*****************************************************************************
 test_dom.js
 
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
  dojo.hostenv.setModulePrefix("dojo", "../../../dojo/dojo-rev1759/src");
  dojo.hostenv.setModulePrefix("orp", "../../../../source");
  dojo.require("orp.dom");
}

function tearDown() {
}


// -------------------------------------------------------------------
// Test functions
// -------------------------------------------------------------------

function testDependencies() {
  assertTrue("orp.lang is defined", ((typeof orp.lang) === 'object'));
  assertTrue("orp.dom is defined", ((typeof orp.dom) === 'object'));
  var i = 0;  
  for (var key in orp) {
    ++i;
  }
  assertTrue("Only orp.lang and orp.dom are defined", (i === 2));
}

function testKeywordValueAccessors() {
  divElementOne = window.document.createElement('div');
  divElementTwo = window.document.createElement('div');
  
  document.body.appendChild(divElementOne);
  document.body.appendChild(divElementTwo);
  
  orp.dom.setKeywordValueForElement(divElementOne, "foo", 34);
  var fooValueOne = orp.dom.getKeywordValueForElement(divElementOne, "foo");
  var fooValueTwo = orp.dom.getKeywordValueForElement(divElementTwo, "foo");
 
  assertTrue('divElementOne has a "foo" value of 34', (fooValueOne === 34));
  assertTrue('divElementTwo does not have a "foo" value', (fooValueTwo === null));

  var barValueOne = {a: 1, b: 2};
  var barValueTwo = "Kermit the Frog";
  orp.dom.setKeywordValueForElement(divElementOne, "bar", barValueOne);
  orp.dom.setKeywordValueForElement(divElementTwo, "bar", barValueTwo);
  
  var barOneToo = orp.dom.getKeywordValueForElement(divElementOne, "bar");
  var barTwoToo = orp.dom.getKeywordValueForElement(divElementTwo, "bar");
  
  assertTrue('divElementOne has a "foo" value of 34', (barValueOne === barOneToo));
  assertTrue('divElementTwo does not have a "foo" value', (barValueTwo === barTwoToo));

}

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
