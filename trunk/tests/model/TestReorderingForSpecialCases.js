/*****************************************************************************
 TestReorderingForSpecialCases.js
 
******************************************************************************
 Written in 2005 by 
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
// 
/*global Util */
/*global World, Item, Entry */
/*global StubArchive */
/*global assertTrue, assertFalse, setUp, tearDown */
// -------------------------------------------------------------------

var world;
var categoryCalledFood = null;


// -------------------------------------------------------------------
// setUp and tearDown
// -------------------------------------------------------------------

function setUp() {
  dojo.setModulePrefix("dojo", "../../dojo/src"); // relative to testRunner.html
  dojo.setModulePrefix("orp", "../../../source"); // relative to dojo.js
  dojo.require("orp.archive.StubArchive");
  dojo.require("orp.model.World");

  var pathToTrunkDirectory = "../..";
  var archive = new orp.archive.StubArchive(pathToTrunkDirectory);

  realUuidGenerator = orp.archive.StubArchive.prototype._generateUuid;
  orp.archive.StubArchive.prototype._generateUuid = mockUuidGenerator;

  world = new orp.model.World(archive);

  annUuid1 = "10000000-2222-1333-8444-555555555555";
  annUuid2 = "10000001-2222-1333-8444-555555555555";
  annUuid3 = "10000002-2222-1333-8444-555555555555";
  mockUuidGenerator.queueOfUuids.push(annUuid1);
  mockUuidGenerator.queueOfUuids.push(annUuid2);
  mockUuidGenerator.queueOfUuids.push(annUuid3);

  var annsPassword = "Ann's password";
  var userAnn = world.newUser("Ann Doe", annsPassword);
  assertTrue("Ann has the expected uuid", userAnn.getUuidString() == annUuid1);
  world.login(userAnn, annsPassword);

  foodUuid1    = "20000000-2222-1333-8444-555555555555";
  foodUuid2    = "20000001-2222-1333-8444-555555555555";
  foodUuid3    = "20000002-2222-1333-8444-555555555555";
  mockUuidGenerator.queueOfUuids.push(foodUuid1);
  mockUuidGenerator.queueOfUuids.push(foodUuid2);
  mockUuidGenerator.queueOfUuids.push(foodUuid3);
  categoryCalledFood = world.newCategory("Food");
}

function tearDown() {
  world.logout();
  mockUuidGenerator.queueOfUuids = new Array();
}


// -------------------------------------------------------------------
// Test functions
// -------------------------------------------------------------------

function testReorderBetweenTwoItemsWithTheSameOrdinal() {
  sushiUuid     = "40000000-2222-1333-8444-555555555555";
  sushiNameUuid = "40000001-2222-1333-8444-555555555555";
  mockUuidGenerator.queueOfUuids.push(sushiUuid);
  mockUuidGenerator.queueOfUuids.push(sushiNameUuid);
  pestoUuid     = "40000000-2222-1333-9999-555555555555";
  pestoNameUuid = "40000001-2222-1333-9999-555555555555";
  mockUuidGenerator.queueOfUuids.push(pestoUuid);
  mockUuidGenerator.queueOfUuids.push(pestoNameUuid);
  guavaUuid     = "50000000-2222-1333-8444-555555555555";
  guavaNameUuid = "50000001-2222-1333-8444-555555555555";
  mockUuidGenerator.queueOfUuids.push(guavaUuid);
  mockUuidGenerator.queueOfUuids.push(guavaNameUuid);
  var sushi = world.newItem("Sushi");
  var pesto = world.newItem("Pesto");
  var guava = world.newItem("Guava");

  orp.archive.StubArchive.prototype._generateUuid = realUuidGenerator;
  
  assertTrue(sushi.getOrdinalNumber() == pesto.getOrdinalNumber());
  
  var caughtError = false;
  try {
    guava.reorderBetween(sushi, pesto);
  } catch (e) {
    caughtError = true;
  }
  assertTrue(caughtError);
}

function testReorderBetweenTwoItemsWithTheSameTimestamp() {
  sushiUuid     = "40000000-2222-1333-8444-555555555555";
  sushiNameUuid = "40000001-2222-1333-8444-555555555555";
  mockUuidGenerator.queueOfUuids.push(sushiUuid);
  mockUuidGenerator.queueOfUuids.push(sushiNameUuid);
  pestoUuid     = "40000002-2222-1333-8444-555555555555";
  pestoNameUuid = "40000003-2222-1333-8444-555555555555";
  mockUuidGenerator.queueOfUuids.push(pestoUuid);
  mockUuidGenerator.queueOfUuids.push(pestoNameUuid);
  guavaUuid     = "40000004-2222-1333-8444-555555555555";
  guavaNameUuid = "40000005-2222-1333-8444-555555555555";
  mockUuidGenerator.queueOfUuids.push(guavaUuid);
  mockUuidGenerator.queueOfUuids.push(guavaNameUuid);
  var sushi = world.newItem("Sushi");
  var pesto = world.newItem("Pesto");
  var guava = world.newItem("Guava");
  assertTrue('Sushi and Pesto have same timestamp', sushi.getTimestamp() == pesto.getTimestamp());
  assertTrue('Sushi and Guava have same timestamp', sushi.getTimestamp() == guava.getTimestamp());

  orp.archive.StubArchive.prototype._generateUuid = realUuidGenerator;

  guava.reorderBetween(sushi, pesto);

  orp.archive.StubArchive.prototype._generateUuid = mockUuidGenerator;

  sushiLinkUuid    = "60000000-2222-1333-8444-555555555555";
  mockUuidGenerator.queueOfUuids.push(sushiLinkUuid);
  sushi.assignToCategory(categoryCalledFood);
  pestoLinkUuid    = "60000001-2222-1333-8444-555555555555";
  mockUuidGenerator.queueOfUuids.push(pestoLinkUuid);
  pesto.assignToCategory(categoryCalledFood);
  guavaLinkUuid    = "60000002-2222-1333-8444-555555555555";
  mockUuidGenerator.queueOfUuids.push(guavaLinkUuid);
  guava.assignToCategory(categoryCalledFood);
  
  orp.archive.StubArchive.prototype._generateUuid = realUuidGenerator;

  guava.reorderBetween(sushi, pesto);
  foodItems = world.getItemsInCategory(categoryCalledFood);
  assertTrue('After first reordering, Sushi is first in the list.', foodItems[0] == sushi);
  assertTrue('After first reordering, Guava is second in the list.', foodItems[1] == guava);
  assertTrue('After first reordering, Pesto is third in the list.', foodItems[2] == pesto);

  pesto.reorderBetween(sushi, guava);
  foodItems = world.getItemsInCategory(categoryCalledFood);
  assertTrue('After 2nd reordering, Sushi is first in the list.', foodItems[0] == sushi);
  assertTrue('After 2nd reordering, Pesto is second in the list.', foodItems[1] == pesto);
  assertTrue('After 2nd reordering, Guava is third in the list.', foodItems[2] == guava);
}


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
