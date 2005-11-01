/*****************************************************************************
 test_AfterLogin.js
 
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
// Dependencies, expressed in the syntax that JSLint understands:
// 
/*global Util */
/*global World, Item, Entry */
/*global StubArchive */
/*global assertTrue, assertFalse, setUp, tearDown */
// -------------------------------------------------------------------


var world;
var userJane;

// -------------------------------------------------------------------
// setUp and tearDown
// -------------------------------------------------------------------

function setUp() {
  dojo.hostenv.setModulePrefix("dojo", "../../../dojo/dojo-rev1759/src");
  dojo.hostenv.setModulePrefix("orp", "../../../../source");
  dojo.require("orp.model.World");
  dojo.require("orp.archive.StubArchive");
  dojo.require("orp.util.DateValue");

  var pathToTrunkDirectory = "../..";
  var stubArchive = new orp.archive.StubArchive(pathToTrunkDirectory);
  world = new orp.model.World(stubArchive);

  var janesPassword = "jane's password";
  userJane = world.newUser("Jane Doe", janesPassword);  
  world.login(userJane, janesPassword);
}

function tearDown() {
  world.logout();
}


// -------------------------------------------------------------------
// Test functions
// -------------------------------------------------------------------

function testUuids() {
  var apple = world.newItem("Apple");
  var brownie = world.newItem("Brownie");
  var cupcake = world.newItem("Cupcake");
  
  var appleUuidString = apple.getUuidString();
  var appleToo = world.getItemFromUuid(appleUuidString);
  assertTrue('We can retrieve "apple" from its UUID string', (apple == appleToo)); 
  
  var appleUuid = apple.getUuid();
  var appleAgain = world.getItemFromUuid(appleUuid);
  assertTrue('We can retrieve "apple" from its UUID', (apple == appleAgain)); 
}

function testGetTimestamp() {
  var tZero = new Date();
  waitForNextMillisecond();
  var starWars = world.newItem("Star Wars");
  var starWarsTimestamp = starWars.getTimestamp();
  waitForNextMillisecond();
  var now = new Date();
  assertTrue('"Star Wars" has a timestamp in the past', now.valueOf() > starWarsTimestamp);
  assertTrue('"Star Wars" was created after tZero', starWarsTimestamp > tZero.valueOf());
  waitForNextMillisecond();
  var starTrek = world.newItem("Star Trek");
  var starTrekTimestamp = starTrek.getTimestamp();
  assertTrue('"Star Wars" was created before "Star Trek"', starWarsTimestamp < starTrekTimestamp);
  var janesTimestamp = userJane.getTimestamp();
  assertTrue('"Star Wars" was created after user Jane', starWarsTimestamp > janesTimestamp);
}
 

function testConnections() { 
  var utah = world.newItem("Utah");
  var provo = world.newItem("Provo");
  var ogden = world.newItem("Ogden");
  
  var locatedIn = world.newAttribute("Located in");
  var cities = world.newAttribute("Cities");
  
  utah.addEntry({attribute: cities, value: provo, inverseAttribute: locatedIn});
  var listOfCities = utah.getValuesForAttribute(cities);
  assertTrue('Utah now has Provo as a city.', listOfCities[0] == provo);
  assertTrue('Provo is now located in Utah.', provo.hasAttributeValue(locatedIn, utah));
  
  utah.addEntry({
    attribute: cities, 
    value: ogden, 
    inverseAttribute: locatedIn});
  assertTrue('Utah still has Provo as a city.', utah.hasAttributeValue(cities, provo));
  assertTrue('Utah now has Ogden as a city.', utah.hasAttributeValue(cities, ogden));
  assertTrue('Provo is still located in Utah.', provo.hasAttributeValue(locatedIn, utah));
  assertTrue('Ogden is now located in Utah.', ogden.hasAttributeValue(locatedIn, utah));
}

function testCategories() {
  var attributeCalledCategory = world.getAttributeCalledCategory();
  var attributeCalledName = world.getAttributeCalledName();
  var categoryCalledAttribute = world.getCategoryCalledAttribute();

  var isInCategory;
  isInCategory = attributeCalledName.isInCategory(categoryCalledAttribute);
  assertTrue('The attribute "Name" is in the category "Attribute"', isInCategory);
  isInCategory = categoryCalledAttribute.isInCategory(categoryCalledAttribute);
  assertTrue('The category "Attribute" is NOT in the category "Attribute"', !isInCategory);
  
  var theHobbit = world.newItem("The Hobbit");
  var theWisdomOfCrowds = world.newItem("The Wisdom of Crowds");
  var theTransparentSociety = world.newItem("The Transparent Society");
  isInCategory = theHobbit.isInCategory(categoryCalledAttribute);
  assertTrue('"The Hobbit" is NOT in the category "Attribute"', !isInCategory);
  
  var categoryCalledBook = world.newCategory("Book");
  isInCategory = theHobbit.isInCategory(categoryCalledBook);
  assertTrue('"The Hobbit" is NOT in the category "Book"', !isInCategory);
  
  theHobbit.assignToCategory(categoryCalledBook);
  theWisdomOfCrowds.assignToCategory(categoryCalledBook);
  theTransparentSociety.assignToCategory(categoryCalledBook);
  isInCategory = theHobbit.isInCategory(categoryCalledBook);
  assertTrue('"The Hobbit" is in the category "Book"', isInCategory);
 
  var allBooks = world.getItemsInCategory(categoryCalledBook);
  var hasAll = orp.util.areObjectsInSet([theHobbit, theWisdomOfCrowds, theTransparentSociety], allBooks);
  assertTrue('All three books are in the category "Book"', hasAll);
}

function testOrdinals() {
  var attributeCalledCategory = world.getAttributeCalledCategory();
  
  var apple = world.newItem("Apple");
  var cupcake = world.newItem("Cupcake");
  var brownie = world.newItem("Brownie");  

  var categoryCalledFood = world.newCategory("Food");
  apple.assignToCategory(categoryCalledFood);
  cupcake.assignToCategory(categoryCalledFood);
  brownie.assignToCategory(categoryCalledFood);

  var foodItems = world.getItemsInCategory(categoryCalledFood);
  assertTrue('Apple starts out first in the list"', foodItems[0] == apple);
  assertTrue('Cupcake starts out second in the list"', foodItems[1] == cupcake);
  assertTrue('Brownie starts out second in the list"', foodItems[2] == brownie);

  brownie.reorderBetween(apple, cupcake);
  foodItems = world.getItemsInCategory(categoryCalledFood);
  assertTrue('Apple is now first in the list"', foodItems[0] == apple);
  assertTrue('Brownie is now second in the list"', foodItems[1] == brownie);
  assertTrue('Cupcake is now third in the list"', foodItems[2] == cupcake);

  cupcake.reorderBetween(null, apple);
  foodItems = world.getItemsInCategory(categoryCalledFood);
  assertTrue('Cupcake is now first in the list"', foodItems[0] == cupcake);
  assertTrue('Apple is now second in the list"', foodItems[1] == apple);
  assertTrue('Brownie is now third in the list"', foodItems[2] == brownie);

  cupcake.reorderBetween(brownie, null);
  foodItems = world.getItemsInCategory(categoryCalledFood);
  assertTrue('Apple is now first in the list"', foodItems[0] == apple);
  assertTrue('Brownie is now second in the list"', foodItems[1] == brownie);
  assertTrue('Cupcake is now third in the list"', foodItems[2] == cupcake);
}
  
function testDeletion() {
  var hydrogen = world.newItem("Hydrogen");
  var oxygen = world.newItem("Oxygen");
  
  assertTrue('Hydrogen starts out not having been deleted"', !hydrogen.hasBeenDeleted());

  hydrogen.voteToDelete();
  assertTrue('After a voteToDelete(), hydrogen hasBeenDeleted()"', hydrogen.hasBeenDeleted());
  
  hydrogen.voteToRetain();
  assertTrue('After a voteToRetain(), hydrogen no longer hasBeenDeleted()', !hydrogen.hasBeenDeleted());
}

function testItemObservation() {
  var tokyo = world.newItem("Tokyo");
  var seattle = world.newItem("Seattle");
  
  var changesObservedByObject = null;
  var tokyoObserverObject = {};
  tokyoObserverObject.observedItemHasChanged = function (inItem, inListOfRecords) {
    changesObservedByObject = inListOfRecords;
  };
  tokyo.addObserver(tokyoObserverObject);

  var changesObservedByFunction = null;
  var tokyoObserverFunction = function (inItem, inListOfRecords) {
    changesObservedByFunction = inListOfRecords;
  };
  tokyo.addObserver(tokyoObserverFunction);
  
  seattle.voteToDelete();
  assertTrue('tokyoObserverObject does not observe Seattle', (changesObservedByObject === null));
  assertTrue('tokyoObserverFunction does not observe Seattle', (changesObservedByFunction === null));

  tokyo.voteToDelete();
  assertTrue('tokyoObserverObject does observe Tokyo', (changesObservedByObject !== null));
  assertTrue('tokyoObserverObject sees exactly one change', (changesObservedByObject.length == 1));
  assertTrue('tokyoObserverFunction does observe Tokyo', (changesObservedByFunction !== null));
  assertTrue('tokyoObserverFunction sees exactly one change', (changesObservedByFunction.length == 1));

  changesObservedByObject = null;
  changesObservedByFunction = null;
  world.beginTransaction();
  tokyo.voteToRetain();
  tokyo.addEntry({value:"Japan"});
  assertTrue('tokyoObserverObject does not yet see changes', (changesObservedByObject === null));
  assertTrue('tokyoObserverFunction does not yet see changes', (changesObservedByFunction === null));
  world.endTransaction();
  assertTrue('tokyoObserverObject now sees changes', (changesObservedByObject !== null));
  assertTrue('tokyoObserverObject now sees two changes', (changesObservedByObject.length == 2));
  assertTrue('tokyoObserverFunction now sees changes', (changesObservedByFunction !== null));
  assertTrue('tokyoObserverFunction now sees two changes', (changesObservedByFunction.length == 2));

  changesObservedByObject = null;
  changesObservedByFunction = null;
  tokyo.removeObserver(tokyoObserverObject);
  tokyo.removeObserver(tokyoObserverFunction);
  tokyo.voteToDelete();
  assertTrue('tokyoObserverObject no longer observes Tokyo', (changesObservedByObject === null));
  assertTrue('tokyoObserverFunction no longer observes Tokyo', (changesObservedByFunction === null));
}


function testListObservation() {
  var attributeCalledCategory = world.getAttributeCalledCategory();
  
  var apple = world.newItem("Apple");
  var brownie = world.newItem("Brownie");  
  var cupcake = world.newItem("Cupcake");

  var categoryCalledFood = world.newCategory("Food");
  apple.assignToCategory(categoryCalledFood);
  brownie.assignToCategory(categoryCalledFood);
  cupcake.assignToCategory(categoryCalledFood);

  var tokyo = world.newItem("Tokyo");
  var seattle = world.newItem("Seattle");

  var changesObservedByObject = null;
  var foodObserverObject = {};
  foodObserverObject.observedListHasChanged = function (inList, inListOfChangeReports) {
    changesObservedByObject = inListOfChangeReports;
  };
  var foodItems = world.getItemsInCategory(categoryCalledFood, foodObserverObject);

  var changesObservedByFunction = null;
  var foodObserverFunction = function (inList, inListOfChangeReports) {
    changesObservedByFunction = inListOfChangeReports;
  };
  var alsoFoodItems = world.getItemsInCategory(categoryCalledFood, foodObserverFunction);
  
  apple.addEntry({value:"Red"});
  assertTrue('foodObserverObject sees a change to apple', (changesObservedByObject !== null));
  assertTrue('foodObserverFunction sees a change to apple', (changesObservedByFunction !== null));

  changesObservedByObject = null;
  changesObservedByFunction = null;
  tokyo.addEntry({value:"Japan"});
  assertTrue('foodObserverObject does not see a change to tokyo', (changesObservedByObject === null));
  assertTrue('foodObserverFunction does not see a change to tokyo', (changesObservedByFunction === null));

  world.removeListObserver(foodItems, foodObserverObject);
  world.removeListObserver(alsoFoodItems, foodObserverFunction);
  brownie.addEntry({value:"Brown"});
  assertTrue('foodObserverObject no longer sees changes to food items', (changesObservedByObject === null));
  assertTrue('foodObserverFunction no longer sees changes to food items', (changesObservedByFunction === null));
}


function testQueries() {
  var attributeCalledCategory = world.getAttributeCalledCategory();
  
  var apple = world.newItem("Apple");
  var brownie = world.newItem("Brownie");  
  var cupcake = world.newItem("Cupcake");

  var categoryCalledFood = world.newCategory("Food");
  assertTrue('The category "Food" is an item', (categoryCalledFood instanceof orp.model.Item));
  apple.assignToCategory(categoryCalledFood);
  brownie.assignToCategory(categoryCalledFood);
  cupcake.assignToCategory(categoryCalledFood);

  var tokyo = world.newItem("Tokyo");
  var seattle = world.newItem("Seattle");

  var hasAll;
  var queryForFoods = world.newQueryForItemsByCategory(categoryCalledFood);
  var queryRunnerForFoods = world.newQueryRunner(queryForFoods);
  var listOfFoods = queryRunnerForFoods.getResultItems();
  
  hasAll = orp.util.areObjectsInSet([apple, brownie, cupcake], listOfFoods);
  assertTrue('Food query returns 3 foods', listOfFoods.length == 3);
  assertTrue('Food query returns all 3 foods', hasAll);

  world.setItemToBeIncludedInQueryResultList(tokyo, queryForFoods);
  assertTrue('Tokyo is now a food', tokyo.isInCategory(categoryCalledFood));

  listOfFoods = queryRunnerForFoods.getResultItems();
  hasAll = orp.util.areObjectsInSet([apple, brownie, cupcake, tokyo], listOfFoods);
  assertTrue('Food query returns 4 foods', listOfFoods.length == 4);
  assertTrue('Food query returns all 4 foods', hasAll);

  // test for queries using non-category attribute e.g. continent
  var attributeCalledContinent = world.newItem("Continent");
  tokyo.addEntry({attribute:attributeCalledContinent, value:"Asia"});
  var beijing = world.newItem("Beijing");
  beijing.addEntry({attribute:attributeCalledContinent, value:"Asia"});
  var seattleEntry = seattle.addEntry({attribute:attributeCalledContinent, value:"North America"});
  var queryRunnerForAsia = world.newQueryRunner({attribute: attributeCalledContinent, values:["Asia"]});
  var listOfCountries = queryRunnerForAsia.getResultItems();
  
  assertTrue('Asia query returns 2 countries', listOfCountries.length == 2);
  hasAll = orp.util.areObjectsInSet([tokyo,beijing], listOfCountries);
  assertTrue('Asia query returns all 2 countries', hasAll);
  
  var northAmericaQuery = world.newQuery(attributeCalledContinent, "North America");
  var queryRunnerForNorthAmerica = world.newQueryRunner(northAmericaQuery);
  listOfCountries = queryRunnerForNorthAmerica.getResultItems();
  assertTrue('North America query returned only Seattle',
  listOfCountries.length == 1 && orp.util.isObjectInSet(seattle, listOfCountries));
    
  seattle.addEntry({attribute:attributeCalledContinent, value:"Asia"});
  listOfCountries = queryRunnerForAsia.getResultItems();
  assertTrue('Asia query returns 3 countries', listOfCountries.length == 3);
  hasAll = orp.util.areObjectsInSet([tokyo,beijing,seattle], listOfCountries);
  assertTrue('Asia query returns all 3 countries', hasAll);
  
  world.setItemToBeIncludedInQueryResultList(beijing, northAmericaQuery);
  listOfCountries = queryRunnerForNorthAmerica.getResultItems();
  assertTrue('Beijing is now in North America',orp.util.isObjectInSet(beijing, listOfCountries));
  assertTrue('North America query returns 2 countries', listOfCountries.length == 2);
  world.setItemToBeIncludedInQueryResultList(seattle, northAmericaQuery);
  listOfCountries = queryRunnerForNorthAmerica.getResultItems();
  assertTrue('North America still returns only 2 countries', listOfCountries.length == 2);
}



// Tests World._getFilteredList, via World.getUsers and World.getCategories.

function testFilteredLists() {
  var listOfCategories = world.getCategories();
  var origNumberOfCategories = listOfCategories.length;
  assertTrue("Should be at least 3 categories", origNumberOfCategories >= 3);
  
  var categoryCalledBlueThings = world.newCategory("BlueThings");
  listOfCategories = world.getCategories();
  assertTrue("Should be exactly one more category than before.", listOfCategories.length == origNumberOfCategories + 1);
}

function testItemTypes() {
  var anEmail = world.newItem("Money saved for you at Nigerian Bank");
  var fromAttribute = world.newAttribute("From");
  var dateReceivedAttribute = world.newAttribute("Received");
  var noOfAttachments = world.newAttribute("Number of attachments");
  var subjectAttribute = world.newAttribute("Subject");
  var aPerson = world.newItem("John Doe");
  var subjectEntry = anEmail.addEntry({attribute:subjectAttribute, value:"Money saved for you at Nigerian Bank"});
  var fromEntry = anEmail.addEntry({attribute:fromAttribute, value:aPerson});
  var receivedEntry = anEmail.addEntry({attribute:dateReceivedAttribute, value:(new orp.util.DateValue("6/8/05"))});
  var numAttachmentsEntry = anEmail.addEntry({attribute:noOfAttachments, value:4});
}


// -------------------------------------------------------------------
// Helper functions
// -------------------------------------------------------------------

function waitForNextMillisecond() {
  var now = new Date();
  var then = now;
  while (now.valueOf() == then.valueOf()) {
    now = new Date();
  }
}


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
