/*****************************************************************************
 test_BeforeLogin.js

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
		assertTrue('Every axiomatic attribute has an array of names', dojo.lang.isArray(listOfAssignedNames));
		assertTrue('Every axiomatic attribute has one name assigned', listOfAssignedNames.length == 1);
		nameEntry = listOfAssignedNames[0];
		assertTrue('Every axiomatic attribute has a name which is an entry', (nameEntry instanceof orp.model.Entry));
		assertTrue('Every entry can be displayed as a string', dojo.lang.isString(nameEntry.getDisplayString()));
		assertTrue('Every axiomatic attribute is in the category "Attribute"', item.isInCategory(categoryCalledAttribute));
	}

	var listOfCategories = [];
	listOfCategories.push(world.getCategoryCalledAttribute());
	listOfCategories.push(world.getCategoryCalledCategory());
	for (key in listOfCategories) {
		item = listOfCategories[key];
		listOfAssignedNames = item.getNameEntries();
		assertTrue('Every axiomatic category has an array of names', dojo.lang.isArray(listOfAssignedNames));
		assertTrue('Every axiomatic category has one name assigned', listOfAssignedNames.length == 1);
		nameEntry = listOfAssignedNames[0];
		assertTrue('Every axiomatic category has a name which is entry', (nameEntry instanceof orp.model.Entry));
		assertTrue('Every entry can be displayed as a string', dojo.lang.isString(nameEntry.getDisplayString()));
	}
}



// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
