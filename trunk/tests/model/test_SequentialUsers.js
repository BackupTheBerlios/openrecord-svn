/*****************************************************************************
 test_SequentialUsers.js

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

// -------------------------------------------------------------------
// setUp and tearDown
// -------------------------------------------------------------------

function setUp() {
	dojo.setModulePrefix("dojo", "../../dojo/src"); // relative to testRunner.html
	dojo.setModulePrefix("orp", "../../../source"); // relative to dojo.js
	dojo.require("orp.model.World");
	dojo.require("orp.archive.StubArchive");
	dojo.require("orp.util.DateValue");

	var pathToTrunkDirectory = "../..";
	var stubArchive = new orp.archive.StubArchive(pathToTrunkDirectory);
	world = new orp.model.World(stubArchive);
}

function tearDown() {
}


// -------------------------------------------------------------------
// Test functions
// -------------------------------------------------------------------


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
	world.logout();
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



function testAdditionsAndRetrievals() {
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

	var listOfValues = starWars.getValuesForAttribute(characterAttribute);
	hasAll = orp.util.areObjectsInSet(["Luck Skywalker", "C3PO"], listOfValues);
	assertTrue('"Star Wars" has characters: "Luck Skywalker", "C3PO"', hasAll);
	assertTrue('Exactly 2 values for Star Wars characters', listOfValues.length == 2);

	listOfEntries = starWars.getEntries();
	hasAll = orp.util.areObjectsInSet([luck, c3po, r2d2], listOfEntries);
	assertTrue('"Star Wars" has entries: luck, c3po, r2d2', hasAll);

	var ordinalA = starWars.getOrdinalNumberAtCreation();
	var ordinalB = starWars.getOrdinalNumber();
	assertTrue('"Star Wars" ordinal values match', ordinalA == ordinalB);

	var starWarsTimestamp = starWars.getTimestamp();
	var now = new Date();
	// alert("now: " + now + "\nstar wars: " + starWarsTimestamp);
	assertTrue('"Star Wars" has a timestamp in the past', now.valueOf() >= starWarsTimestamp);
	assertTrue('"Star Wars" was created after tZero', starWarsTimestamp >= tZero.valueOf());

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

	r2d2 = starWars.addEntry({previousEntry:r2d2, attribute:characterAttribute, value:"R2D2"});
	assertTrue('"R2D2" is now character', r2d2.getAttribute() == characterAttribute);
	previousEntry = r2d2.getPreviousEntry();
	assertTrue('"R2D2" has a previous version', previousEntry !== null);

	var failure = starWars.addEntry({previousEntry:r2d2, value:"R2D2"});
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
