/*****************************************************************************
 ModelTest.js
 
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
/*global StubVirtualServer */
/*global assertTrue, assertFalse, setUp, tearDown */
// -------------------------------------------------------------------


var ModelTestVars = null;
var world;

// -------------------------------------------------------------------
// setUp and tearDown
// -------------------------------------------------------------------

function setUp() {
  dojo.hostenv.setModulePrefix("dojo", "../../../dojo/dojo-0.1.0/src");
  dojo.hostenv.setModulePrefix("orp", "../../../../source");
  dojo.require("orp.model.World");
  dojo.require("orp.model.StubVirtualServer");
  dojo.require("orp.util.DateValue");

  ModelTestVars = {};

  var pathToTrunkDirectory = "../..";
  var stubVirtualServer = new orp.model.StubVirtualServer(pathToTrunkDirectory);
  world = new orp.model.World(stubVirtualServer);
}

function tearDown() {
  ModelTestVars = null;
}


// -------------------------------------------------------------------
// Test functions
// -------------------------------------------------------------------

function testUuids() {
  var janesPassword = "jane's password";
  var userJane = world.newUser("Jane Doe", janesPassword);  

  world.login(userJane, janesPassword);
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

function testGetUserstamp() {
  var listOfUsers = world.getUsers();  

  var janesPassword = "jane's password";
  var userJane = world.newUser("Jane Doe", janesPassword);
  var passwordForChris = "Kringlishous!";
  var userChris = world.newUser("Chris Kringle", passwordForChris);

  world.login(userJane, janesPassword);

  assertTrue('The user Jane created the user Jane', (userJane.getUserstamp() == userJane));
  
  var starWars = world.newItem("Star Wars");
  var recoveredUser = starWars.getUserstamp();
  assertTrue("The user that created 'starWars' should be Jane", recoveredUser == userJane);
  
  world.logout();
  world.login(userChris, passwordForChris);
  var elephant = world.newItem("Elephant");
  recoveredUser = elephant.getUserstamp();
  assertTrue("The user that created 'elephant' should be Chris", recoveredUser == userChris);
  recoveredUser = starWars.getUserstamp();
  assertTrue("The user that created 'starWars' should be Jane", recoveredUser == userJane);  
}

function testGetTimestamp() {
  var tZero = new Date();
  var janesPassword = "jane's password";
  waitForNextMillisecond();
  var userJane = world.newUser("Jane Doe", janesPassword);
  world.login(userJane, janesPassword);
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

function testLoginLogout() {
  var listOfUsers;
  var loginSuccess;
  
  listOfUsers = world.getUsers();
  var originalLength = listOfUsers.length;
  // assertTrue("Initially, there's only an axiomatic user", listOfUsers.length == 1);
  // assertTrue('Nobody is logged in', world.getCurrentUser() === null);

  var janesPassword = "jane's password";
  var userJane = world.newUser("Jane Doe", janesPassword);  
  listOfUsers = world.getUsers();
  assertTrue("Now there is another user", listOfUsers.length == (originalLength + 1));
  assertTrue('Nobody is logged in', world.getCurrentUser() === null);

  loginSuccess = world.login(userJane, "wrong password");
  assertFalse('Can not log in with wrong password', loginSuccess);
  assertTrue('Jane is not logged in', world.getCurrentUser() === null);

  loginSuccess = world.login(userJane, janesPassword);
  assertTrue('Can log in with right password', loginSuccess);
  assertTrue('Jane is logged in', world.getCurrentUser() == userJane);
  
  world.logout();
  assertTrue('Nobody is logged in', world.getCurrentUser() === null);
  
  var passwordForChris = "Kringlishous!";
  var userChris = world.newUser("Chris Kringle", passwordForChris);
  world.login(userChris, passwordForChris);
  assertTrue('Chris is logged in', world.getCurrentUser() == userChris);
  world.logout();
  
  world.login(userJane, janesPassword);
  assertTrue('Jane is logged in', world.getCurrentUser() == userJane);
  assertFalse('Chris is not logged in', world.getCurrentUser() == userChris);
  var caughtError = false;
  var oprahsPassword = "Oprah's password";
  try {
    var userOprah = world.newUser("Oprah", oprahsPassword);
  } catch (error) {
    caughtError = true;
  }
  assertTrue("We can't create a new user while Jane is logged in", caughtError);
  world.logout();
  
  caughtError = false;
  try {
    var newItem = world.newItem("The Great Wall of China");
  } catch (error) {
    caughtError = true;
  }
  assertTrue("We can't create a new item without being logged in", caughtError);
}
  

function testAccessorsForAxiomaticItems() {
  var key;
  var item;
  var listOfAssignedNames;
  var nameEntry;
  
  var categoryCalledAttribute = world.getCategoryCalledAttribute();
  var listOfAttributes = [];
  listOfAttributes.push(world.getAttributeCalledName());
  listOfAttributes.push(world.getAttributeCalledShortName());
  listOfAttributes.push(world.getAttributeCalledSummary());
  listOfAttributes.push(world.getAttributeCalledCategory());
  listOfAttributes.push(world.getAttributeCalledClassName());
  for (key in listOfAttributes) {
    item = listOfAttributes[key];
    listOfAssignedNames = item.getNameEntries();
    assertTrue('Every axiomatic attribute has an array of names', orp.util.isArray(listOfAssignedNames));
    assertTrue('Every axiomatic attribute has one name assigned', listOfAssignedNames.length == 1);
    nameEntry = listOfAssignedNames[0];
    assertTrue('Every axiomatic attribute has a name which is an entry', (nameEntry instanceof orp.model.Entry));
    assertTrue('Every entry can be displayed as a string', orp.util.isString(nameEntry.getDisplayString()));
    assertTrue('Every axiomatic attribute is in the category "Attribute"', item.isInCategory(categoryCalledAttribute));
  }
  
  var listOfCategories = [];
  listOfCategories.push(world.getCategoryCalledAttribute());
  listOfCategories.push(world.getCategoryCalledCategory());
  for (key in listOfCategories) {
    item = listOfCategories[key];
    listOfAssignedNames = item.getNameEntries();
    assertTrue('Every axiomatic category has an array of names', orp.util.isArray(listOfAssignedNames));
    assertTrue('Every axiomatic category has one name assigned', listOfAssignedNames.length == 1);
    nameEntry = listOfAssignedNames[0];
    assertTrue('Every axiomatic category has a name which is entry', (nameEntry instanceof orp.model.Entry));
    assertTrue('Every entry can be displayed as a string', orp.util.isString(nameEntry.getDisplayString()));
  }
}

  
function noyet_testAdditionsAndRetrievals() {
  var nameAttribute = world.getAttributeCalledName();
  
  var janesPassword = "jane's password";
  var listOfCharacters = null;
  var listOfEntries = null;
  var listOfAttributes = null;
  var worldRetrievalFilter = null;
  var hasAll;
  
  var tZero = new Date();
  
  // operations done by Jane
  var userJane = world.newUser("Jane Doe", janesPassword);
  assertTrue('The user Jane created the user Jane', (userJane.getUserstamp() == userJane));
   
  world.login(userJane, janesPassword);

  var characterAttribute = world.newAttribute("Characters");
  var starWars = world.newItem("Star Wars");
  assertTrue('getDisplayName() works for "Star Wars"', (starWars.getDisplayName() == "Star Wars"));

  var luck = starWars.addEntry({attribute:characterAttribute, value:"Luck Skywalker"});
  var c3po = starWars.addEntry({attribute:characterAttribute, value:"C3PO"});
  var r2d2 = starWars.addEntry({value:"R2D2"});
  assertTrue('"Star Wars" has not been deleted', !starWars.hasBeenDeleted());
  assertTrue('"R2D2" has not been deleted', !r2d2.hasBeenDeleted());
  assertTrue('"R2D2" has not been replaced', !r2d2.hasBeenReplaced());

  listOfCharacters = starWars.getEntriesForAttribute(characterAttribute);
  hasAll = orp.util.areObjectsInSet([luck, c3po], listOfCharacters);
  assertTrue('"Star Wars" has characters: luck, c3po', hasAll);
  assertTrue('Exactly 2 characters in Star Wars', listOfCharacters.length == 2);

  listOfEntries = starWars.getEntries();
  hasAll = orp.util.areObjectsInSet([luck, c3po, r2d2], listOfEntries);
  assertTrue('"Star Wars" has entries: luck, c3po, r2d2', hasAll);  
  
  var ordinalA = starWars.getOrdinalNumberAtCreation();
  var ordinalB = starWars.getOrdinalNumber();
  assertTrue('"Star Wars" ordinal values match', ordinalA == ordinalB);  
  
  var starWarsTimestamp = starWars.getTimestamp();
  var now = new Date();
  // alert("now: " + now + "\nstar wars: " + starWarsTimestamp);
  assertTrue('"Star Wars" has a timestamp in the past', now >= starWarsTimestamp);  
  assertTrue('"Star Wars" was created after tZero', starWarsTimestamp >= tZero);  

  var starWarsUserstamp = starWars.getUserstamp();
  assertTrue('"Star Wars" was made by Jane', starWarsUserstamp == userJane);    

  listOfAttributes = starWars.getAttributes();
  hasAll = orp.util.areObjectsInSet([nameAttribute, characterAttribute], listOfAttributes);
  assertTrue('"Star Wars" has both expected attributes', hasAll);
  
  worldRetrievalFilter = world.getRetrievalFilter();
  assertTrue('Default retrieval filter is "last edit wins"', worldRetrievalFilter == orp.model.World.RetrievalFilter.LAST_EDIT_WINS);
  
  var luke = starWars.replaceEntry({previousEntry:luck, value:"Luke Skywalker"});
  var previousEntry = luke.getPreviousEntry();
  assertTrue('"Luke" has the previous version "Luck"', previousEntry !== null);
  assertTrue('"Luck" has been replaced', luck.hasBeenReplaced());
  assertTrue('"Luck" is a entry in "Star Wars"', luck.getItem() == starWars);

  listOfEntries = starWars.getEntries();
  hasAll = orp.util.areObjectsInSet([luke, c3po, r2d2], listOfEntries);
  assertTrue('"Star Wars" has entries: luke, c3po, r2d2', hasAll);  

  listOfCharacters = starWars.getEntriesForAttribute(characterAttribute);
  hasAll = orp.util.areObjectsInSet([luke, c3po], listOfCharacters);
  assertTrue('"Star Wars" has characters: luke, c3po', hasAll);
  assertTrue('Exactly 2 characters in the star wars', listOfCharacters.length == 2);

  world.logout();
  
  // operations done by Chris
  var passwordForChris = "Kringlishous!";
  var userChris = world.newUser("Chris Kringle", passwordForChris);
  world.login(userChris, passwordForChris);

  // r2d2 = starWars.replaceEntryWithEntryForAttribute(r2d2, characterAttribute, "R2D2");
  r2d2 = starWars.replaceEntry({previousEntry:r2d2, attribute:characterAttribute, value:"R2D2"});
  assertTrue('"R2D2" is now character', r2d2.getAttribute() == characterAttribute);

  var failure = starWars.replaceEntry({previousEntry:r2d2, value:"R2D2"});
  assertTrue("Can't replace a value with an identical value", failure === null);

  listOfCharacters = starWars.getEntriesForAttribute(characterAttribute);
  var hasR2d2 = orp.util.isObjectInSet(r2d2, listOfCharacters);
  hasAll = orp.util.areObjectsInSet([luke, c3po, r2d2], listOfCharacters);
  assertTrue('Chris sees R2D2 as a character', hasR2d2);
  assertTrue('Chris sees characters: luke, c3po, r2d2', hasAll);
  assertTrue('Chris sees 3 characters in "Star Wars"', listOfCharacters.length == 3);
  
  var attributeCalledName = world.getAttributeCalledName();
  var theHobbit = world.newItem("The Hobbit");
  theHobbit.addEntry({attribute:attributeCalledName, value:"There and Back Again"});
  listOfEntries = theHobbit.getEntriesForAttribute(attributeCalledName);
  assertTrue('"The Hobbit" has two names', listOfEntries.length == 2);
  assertTrue('getDisplayName() returns the first name', (starWars.getDisplayName() == "Star Wars"));
  var listOfNames = theHobbit.getNameEntries();
  assertTrue('getContentData() returns a string', listOfNames[0].getValue() == "The Hobbit");
  hasAll = orp.util.areObjectsInSet(listOfNames, listOfEntries);
  hasAll = hasAll && orp.util.areObjectsInSet(listOfEntries, listOfNames);
  assertTrue('getName() matches getEntriesForAttribute(attributeCalledName)', hasAll);
  
  world.logout();
}


function testCategories() {
  var janesPassword = "jane's password";
  var userJane = world.newUser("Jane Doe", janesPassword);
  world.login(userJane, janesPassword);

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
  
  world.logout();
}

function testOrdinals() {
  var janesPassword = "jane's password";
  var userJane = world.newUser("Jane Doe", janesPassword);
  world.login(userJane, janesPassword);
  
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
  
  world.logout();
}
  
function testDeletion() {
  var janesPassword = "jane's password";
  var userJane = world.newUser("Jane Doe", janesPassword);
  world.login(userJane, janesPassword);
  
  var hydrogen = world.newItem("Hydrogen");
  var oxygen = world.newItem("Oxygen");
  
  assertTrue('Hydrogen starts out not having been deleted"', !hydrogen.hasBeenDeleted());

  hydrogen.voteToDelete();
  assertTrue('After a voteToDelete(), hydrogen hasBeenDeleted()"', hydrogen.hasBeenDeleted());
  
  hydrogen.voteToRetain();
  assertTrue('After a voteToRetain(), hydrogen no longer hasBeenDeleted()', !hydrogen.hasBeenDeleted());

  world.logout();
}


function testItemObservation() {
  var janesPassword = "jane's password";
  var userJane = world.newUser("Jane Doe", janesPassword);
  world.login(userJane, janesPassword);
  
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
  
  world.logout();
}


function testListObservation() {
  var janesPassword = "jane's password";
  var userJane = world.newUser("Jane Doe", janesPassword);
  world.login(userJane, janesPassword);

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
  
  world.logout();
}


function testQueries() {
  var janesPassword = "jane's password";
  var userJane = world.newUser("Jane Doe", janesPassword);
  world.login(userJane, janesPassword);
  
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
  
  world.logout();
}



// Tests World._getFilteredList, via World.getUsers and World.getCategories.

function testFilteredLists() {
  var janesPassword = "jane's password";
  var userJane = world.newUser("Jane Doe", janesPassword);  
  var listOfUsers = world.getUsers();

  var listOfCategories = world.getCategories();
  var origNumberOfCategories = listOfCategories.length;
  assertTrue("Should be at least 3 categories", origNumberOfCategories >= 3);
  
  // Need to login before adding a category.
  var loginSuccess = world.login(userJane, janesPassword);
  assertTrue('login succeeded', loginSuccess);
  assertTrue('Jane is logged in', world.getCurrentUser() == userJane);  

  var categoryCalledBlueThings = world.newCategory("BlueThings");
  listOfCategories = world.getCategories();
  assertTrue("Should be exactly one more category than before.", listOfCategories.length == origNumberOfCategories + 1);
}

function testItemTypes() {
  var janesPassword = "jane's password";
  var userJane = world.newUser("Jane Doe", janesPassword);
  world.login(userJane, janesPassword);
  
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
