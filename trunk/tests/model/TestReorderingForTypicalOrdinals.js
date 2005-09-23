/*****************************************************************************
 TestReorderingForTypicalOrdinals.js
 
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
/*global StubVirtualServer */
/*global assertTrue, assertFalse, setUp, tearDown */
// -------------------------------------------------------------------

var world;
var categoryCalledFood;
var sushi;
var pesto;
var guava;
var taffy;


// -------------------------------------------------------------------
// setUp and tearDown
// -------------------------------------------------------------------

function setUp() {
  dojo.hostenv.setModulePrefix("dojo", "../../../dojo/dojo-0.1.0/src");
  dojo.hostenv.setModulePrefix("orp", "../../../../source");
  dojo.require("orp.model.StubVirtualServer");
  dojo.require("orp.model.World");
  
  ContentRecord = orp.model.ContentRecord;

  var pathToTrunkDirectory = "../..";
  var virtualServer = new orp.model.StubVirtualServer(pathToTrunkDirectory);
  var realUuidGenerator = orp.model.StubVirtualServer.prototype._generateUuid;
  orp.model.StubVirtualServer.prototype._generateUuid = mockUuidGenerator;
/*
You can use DeltaVirtualServer instead if you want to append all transactions to a file for debugging purposes.
Note that the tests will run a lot slower if you do.

  var virtualServer = new orp.model.DeltaVirtualServer("OrdinalsTest", pathToTrunkDirectory, {"_generateUuid":mockUuidGenerator});
*/

  world = new orp.model.World(virtualServer);

  annUuid1 = "10000000-2222-1333-F444-555555555555";
  annUuid2 = "10000001-2222-1333-F444-555555555555";
  annUuid3 = "10000002-2222-1333-F444-555555555555";
  mockUuidGenerator.queueOfUuids.push(annUuid1);
  mockUuidGenerator.queueOfUuids.push(annUuid2);
  mockUuidGenerator.queueOfUuids.push(annUuid3);

  var annsPassword = "Ann's password";
  var userAnn = world.newUser("Ann Doe", annsPassword);
  assertTrue("Ann has the expected uuid", userAnn.getUuidString() == annUuid1);
  world.login(userAnn, annsPassword);

  foodUuid1    = "20000000-2222-1333-F444-555555555555";
  foodUuid2    = "20000001-2222-1333-F444-555555555555";
  foodUuid3    = "20000002-2222-1333-F444-555555555555";
  mockUuidGenerator.queueOfUuids.push(foodUuid1);
  mockUuidGenerator.queueOfUuids.push(foodUuid2);
  mockUuidGenerator.queueOfUuids.push(foodUuid3);
  categoryCalledFood = world.newCategory("Food");

  sushiUuid     = "40000000-2222-1333-F444-555555555555";
  sushiNameUuid = "40000001-2222-1333-F444-555555555555";
  mockUuidGenerator.queueOfUuids.push(sushiUuid);
  mockUuidGenerator.queueOfUuids.push(sushiNameUuid);
  pestoUuid     = "40000010-2222-1333-F444-555555555555";
  pestoNameUuid = "40000011-2222-1333-F444-555555555555";
  mockUuidGenerator.queueOfUuids.push(pestoUuid);
  mockUuidGenerator.queueOfUuids.push(pestoNameUuid);
  guavaUuid     = "40000020-2222-1333-F444-555555555555";
  guavaNameUuid = "40000021-2222-1333-F444-555555555555";
  mockUuidGenerator.queueOfUuids.push(guavaUuid);
  mockUuidGenerator.queueOfUuids.push(guavaNameUuid);
  taffyUuid     = "40000030-2222-1333-F444-555555555555";
  taffyNameUuid = "40000031-2222-1333-F444-555555555555";
  mockUuidGenerator.queueOfUuids.push(taffyUuid);
  mockUuidGenerator.queueOfUuids.push(taffyNameUuid);
  sushi = world.newItem("Sushi");
  assertTrue("sushi has the expected uuid", sushi.getUuidString() == sushiUuid);
  pesto = world.newItem("Pesto");
  assertTrue("pesto has the expected uuid", pesto.getUuidString() == pestoUuid);
  guava = world.newItem("Guava");
  assertTrue("guava has the expected uuid", guava.getUuidString() == guavaUuid);
  taffy = world.newItem("Taffy");
  assertTrue("taffy has the expected uuid", taffy.getUuidString() == taffyUuid);

  sushiLinkUuid    = "60000000-2222-1333-F444-555555555555";
  mockUuidGenerator.queueOfUuids.push(sushiLinkUuid);
  sushi.assignToCategory(categoryCalledFood);
  pestoLinkUuid    = "60000001-2222-1333-F444-555555555555";
  mockUuidGenerator.queueOfUuids.push(pestoLinkUuid);
  pesto.assignToCategory(categoryCalledFood);
  guavaLinkUuid    = "60000002-2222-1333-F444-555555555555";
  mockUuidGenerator.queueOfUuids.push(guavaLinkUuid);
  guava.assignToCategory(categoryCalledFood);
  taffyLinkUuid    = "60000002-2222-1333-F444-555555555555";
  mockUuidGenerator.queueOfUuids.push(taffyLinkUuid);
  taffy.assignToCategory(categoryCalledFood);

  orp.model.StubVirtualServer.prototype._generateUuid = realUuidGenerator;
}

function tearDown() {
  world.logout();
}


// -------------------------------------------------------------------
// Test functions
// -------------------------------------------------------------------

function testReorderBetweenTwoItems() {
  guava.reorderBetween(sushi, pesto);
  foodItems = world.getItemsInCategory(categoryCalledFood);
  assertTrue('After first reordering, Sushi is first in the list.', foodItems[0] == sushi);
  assertTrue('After first reordering, Guava is second in the list.', foodItems[1] == guava);
  assertTrue('After first reordering, Pesto is third in the list.', foodItems[2] == pesto);
}

function testReorderAfterAnItem() {
  assertTrue(ContentRecord.compareOrdinals(sushi, guava) < 0);
  sushi.reorderBetween(guava, null);
  assertTrue(ContentRecord.compareOrdinals(sushi, guava) > 0);
}

function testReorderBeforeAnItem() {
  assertTrue(ContentRecord.compareOrdinals(pesto, guava) < 0);
  guava.reorderBetween(null, pesto);
  assertTrue(ContentRecord.compareOrdinals(pesto, guava) > 0);
}

function testReorderTwice() {
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

function testReorderManyTimes() {
  for (i = 0; i < 10; i++) {
    guava.reorderBetween(sushi, pesto);
    assertTrue(ContentRecord.compareOrdinals(sushi, guava) < 0);
    assertTrue(ContentRecord.compareOrdinals(guava, pesto) < 0);
    pesto.reorderBetween(sushi, guava);
    assertTrue(ContentRecord.compareOrdinals(sushi, pesto) < 0);
    assertTrue(ContentRecord.compareOrdinals(pesto, guava) < 0);
  }
}

function testReorderBetweenTwoItemsWhichAreTheSame() {
  var caughtError = false;
  try {
    pesto.reorderBetween(sushi, sushi);
  } catch (e) {
    caughtError = true;
  }
  assertTrue(caughtError);
}

function testReorderBetweenTwoItemsNotInOrder() {
  assertTrue(ContentRecord.compareOrdinals(sushi, pesto) < 0);
  guava.reorderBetween(pesto, sushi);
  assertTrue(ContentRecord.compareOrdinals(pesto, guava) > 0);
  assertTrue(ContentRecord.compareOrdinals(guava, sushi) > 0);
}

function testReorderTwoItemsBetweenTheSameTwoItems() {
  guava.reorderBetween(sushi, pesto);
  taffy.reorderBetween(sushi, pesto);
  assertTrue(ContentRecord.compareOrdinals(sushi, guava) < 0);
  assertTrue(ContentRecord.compareOrdinals(guava, pesto) < 0);
  assertTrue(ContentRecord.compareOrdinals(sushi, taffy) < 0);
  assertTrue(ContentRecord.compareOrdinals(taffy, pesto) < 0);
  assertTrue(ContentRecord.compareOrdinals(taffy, guava) != 0);
}


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
