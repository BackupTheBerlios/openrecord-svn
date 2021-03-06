/*****************************************************************************
 XmlImporterTest.js

******************************************************************************
 Written in 2005 by Mignon Belongie.

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

var world;
var xmlImporter;

// -------------------------------------------------------------------
// setUp and tearDown
// -------------------------------------------------------------------

function setUp() {
	dojo.setModulePrefix("dojo", "../../dojo/src"); // relative to testRunner.html
	dojo.setModulePrefix("orp", "../../../source"); // relative to dojo.js
	dojo.require("orp.transcribers.XmlImporter");
	dojo.require("orp.util.Util");
	dojo.require("orp.archive.StubArchive");
	dojo.require("orp.model.World");

	XmlTextNodeToAttributeSpecifier = orp.transcribers.XmlTextNodeToAttributeSpecifier;
	XmlAttributeToAttributeSpecifier = orp.transcribers.XmlAttributeToAttributeSpecifier;
	XmlImporter = orp.transcribers.XmlImporter;

	// var pathToTrunkDirectoryFromThisFile = "../../../";
	pathToTrunkDirectoryFromThisFile = "../..";

	var archive = new orp.archive.StubArchive(pathToTrunkDirectoryFromThisFile);
	world = new orp.model.World(archive);
	var annsPassword = "Ann's password";
	var userAnn = world.newUser("Ann Doe", annsPassword);
	world.login(userAnn, annsPassword);
	var xmlFile = "../../../tests/util/food.xml";
	xmlImporter = new XmlImporter(world, xmlFile, "food", "Record");
}

function tearDown() {
	world.logout();
}


// -------------------------------------------------------------------
// Test functions
// -------------------------------------------------------------------

function testDefaultConversionOfTagsToAttributes() {
	var listOfItems = xmlImporter.makeItemsFromXmlFile();
	assertTrue('3 items should have been created', listOfItems.length == 3);
	var expectedNewCategory = null;
	var listOfCategories = world.getCategories();
	for (var i in listOfCategories) {
		if (listOfCategories[i].getDisplayName() == "food:Record") {
			expectedNewCategory = listOfCategories[i];
			break;
		}
	}
	assertFalse('A category named "food:Record" should have been created', expectedNewCategory == null);
	for (var i in listOfItems) {
		var item = listOfItems[i];
		assertTrue('Each item should be in the category "food:Record".', item.isInCategory(expectedNewCategory));
		var listOfAttributes = item.getAttributes();
		assertTrue('Each item should have 4 attributes.', listOfAttributes.length == 4);
		var names = [];
		for (var j in listOfAttributes) {
			names.push(listOfAttributes[j].getDisplayName());
		}
		hasAll = orp.util.areObjectsInSet(["food:name", "food:color", "food:flavor"], names);
		assertTrue('Each item should have attributes called "food:name", "food:color" and "food:flavor".', hasAll);
	}
}

function testSimpleXmlToAttributeSpecifiers() {
	var xmlToAttributeSpecifiers = new Array();
	xmlToAttributeSpecifiers.push(new orp.transcribers.XmlTextNodeToAttributeSpecifier(["name"], world.getAttributeCalledName()));
	xmlToAttributeSpecifiers.push(new XmlTextNodeToAttributeSpecifier(["flavor"], world.newAttribute("Flavor")));
	var listOfItems = xmlImporter.makeItemsFromXmlFile(xmlToAttributeSpecifiers);
	assertTrue('3 items should have been created', listOfItems.length == 3);
	var expectedNewCategory = null;
	var listOfCategories = world.getCategories();
	for (var i in listOfCategories) {
		if (listOfCategories[i].getDisplayName() == "food:Record") {
			expectedNewCategory = listOfCategories[i];
			break;
		}
	}
	assertFalse('A category named "food:Record" should have been created', expectedNewCategory == null);
	for (var i in listOfItems) {
		var item = listOfItems[i];
		assertTrue('Each item should be in the category "food:Record".', item.isInCategory(expectedNewCategory));
		var listOfAttributes = item.getAttributes();
		assertTrue('Each item should have 3 attributes.', listOfAttributes.length == 3);
		var names = [];
		for (var j in listOfAttributes) {
			names.push(listOfAttributes[j].getDisplayName());
		}
		assertTrue('Each item should have attributes called "Category", "Name" and "Flavor".', orp.util.areObjectsInSet(["Category", "Name", "Flavor"], names));
	}
}

function testMultipleValuesForAnAttribute() {
	var xmlToAttributeSpecifiers = new Array();
	xmlToAttributeSpecifiers.push(new XmlTextNodeToAttributeSpecifier(["name"], world.getAttributeCalledName()));
	var flavorAttribute = world.newAttribute("Flavor");
	xmlToAttributeSpecifiers.push(new XmlTextNodeToAttributeSpecifier(["flavor"], flavorAttribute));
	var listOfItems = xmlImporter.makeItemsFromXmlFile(xmlToAttributeSpecifiers);
	assertTrue('3 items should have been created', listOfItems.length == 3);
	for (var i in listOfItems) {
		var item = listOfItems[i];
		if (item.getDisplayName() == 'cheese puff') {
			var cheesePuff = item;
		} else if (item.getDisplayName() == 'carrot') {
			var carrot = item;
		}
	}
	var listOfFlavors = carrot.getEntriesForAttribute(flavorAttribute);
	assertTrue("'carrot' should have exactly one flavor.", listOfFlavors.length == 1);
	listOfFlavors = cheesePuff.getEntriesForAttribute(flavorAttribute);
	assertTrue("'cheese puff' should have 2 flavors.", listOfFlavors.length == 2);
	var flavorNames = [listOfFlavors[0].getValue(), listOfFlavors[1].getValue()];
	assertTrue("'cheese puff' should have flavors called 'salty' and 'cheesy'.", orp.util.areObjectsInSet(['salty', 'cheesy'], flavorNames));
}

function testNestedXmlConversion() {
	var xmlToAttributeSpecifiers = new Array();
	xmlToAttributeSpecifiers.push(new XmlTextNodeToAttributeSpecifier(["name"], world.getAttributeCalledName()));
	xmlToAttributeSpecifiers.push(new XmlTextNodeToAttributeSpecifier(["vitamins", "C"], world.newAttribute("Vitamin C")));
	var listOfItems = xmlImporter.makeItemsFromXmlFile(xmlToAttributeSpecifiers);
	assertTrue('3 items should have been created', listOfItems.length == 3);
	for (var i in listOfItems) {
		var item = listOfItems[i];
		var listOfAttributes = item.getAttributes();
		assertTrue('Each item should have 3 attributes.', listOfAttributes.length == 3);
		var names = [];
		for (var j in listOfAttributes) {
			names.push(listOfAttributes[j].getDisplayName());
		}
		assertTrue('Each item should have attributes called "Category", "Name" and "Vitamin C".', orp.util.areObjectsInSet(["Category", "Name", "Vitamin C"], names));
	}
}

function testXmlAttributeConversion() {
	var xmlToAttributeSpecifiers = new Array();
	xmlToAttributeSpecifiers.push(new XmlTextNodeToAttributeSpecifier(["name"], world.getAttributeCalledName()));
	var xmlAttributeToAttributeSpecifiers = new Array();
	xmlAttributeToAttributeSpecifiers.push(new XmlAttributeToAttributeSpecifier("food_id", world.newAttribute("Food ID")));
	var listOfItems = xmlImporter.makeItemsFromXmlFile(
	                  xmlToAttributeSpecifiers,
	                  xmlAttributeToAttributeSpecifiers);
	assertTrue('3 items should have been created', listOfItems.length == 3);
	var listOfIds = [];
	for (var i in listOfItems) {
		var item = listOfItems[i];
		var listOfAttributes = item.getAttributes();
		assertTrue('Each item should have 3 attributes.', listOfAttributes.length == 3);
		var names = [];
		for (var j in listOfAttributes) {
			names.push(listOfAttributes[j].getDisplayName());
			if (listOfAttributes[j].getDisplayName() == "Food ID") {
				listOfIds.push(item.getSingleEntryFromAttribute(listOfAttributes[j]).getValue());
			}
		}
		assertTrue('Each item should have attributes called "Category", "Name" and "Food ID".', orp.util.areObjectsInSet(["Category", "Name", "Food ID"], names));
	}
	assertTrue('Values of the "Food ID" attribute should include "32", "47" and "114".', orp.util.areObjectsInSet(["32", "47", "114"], listOfIds));
}

function testExpectedType() {
	var xmlToAttributeSpecifiers = new Array();
	xmlToAttributeSpecifiers.push(new XmlTextNodeToAttributeSpecifier(["name"], world.getAttributeCalledName()));
	var colorAttribute = world.newAttribute("Color");
	var foodColorCategory = world.newCategory("Food color");
	colorAttribute.addEntry({attribute:world.getAttributeCalledExpectedType(), value:foodColorCategory});
	xmlToAttributeSpecifiers.push(new XmlTextNodeToAttributeSpecifier(["color"], colorAttribute));
	var listOfItems = xmlImporter.makeItemsFromXmlFile(xmlToAttributeSpecifiers);
	assertTrue('3 items should have been created', listOfItems.length == 3);
	for (var i in listOfItems) {
		var item = listOfItems[i];
		var entryForColorAttribute = item.getSingleEntryFromAttribute(colorAttribute);
		var valueOfColorAttribute = entryForColorAttribute.getValue();
		assertTrue("The values of the color attribute should be in the category 'Food color'.", valueOfColorAttribute.isInCategory(foodColorCategory));
	}
}

function testInverseAttribute() {
	var xmlToAttributeSpecifiers = new Array();
	xmlToAttributeSpecifiers.push(new XmlTextNodeToAttributeSpecifier(["name"], world.getAttributeCalledName()));
	var colorAttribute = world.newAttribute("Color");
	var foodColorCategory = world.newCategory("Food Color");
	colorAttribute.addEntry({attribute:world.getAttributeCalledExpectedType(), value:foodColorCategory});
	var foodsOfThisColorCategory = world.newCategory("Foods of this color");
	colorAttribute.addEntry({attribute:world.getAttributeCalledInverseAttribute(), value:foodsOfThisColorCategory});
	xmlToAttributeSpecifiers.push(new XmlTextNodeToAttributeSpecifier(["color"], colorAttribute));
	var listOfItems = xmlImporter.makeItemsFromXmlFile(xmlToAttributeSpecifiers);
	var colorCategories = world.getItemsInCategory(foodColorCategory);
	assertTrue('2 color categories should have been created', colorCategories.length == 2);
	var red = colorCategories[0].getDisplayName() == 'red'? colorCategories[0] : colorCategories[1].getDisplayName() == 'red'? colorCategories[1] : null;
	assertFalse('A color category named "red" should have been created', red == null);
	var orange = colorCategories[0].getDisplayName() == 'orange'? colorCategories[0] : colorCategories[1].getDisplayName() == 'orange'? colorCategories[1] : null;
	assertFalse('A color category named "orange" should have been created', orange == null);
	var redFoods = red.getEntriesForAttribute(foodsOfThisColorCategory);
	assertTrue('There should be one red food.', redFoods.length == 1);
	var orangeFoods = orange.getEntriesForAttribute(foodsOfThisColorCategory);
	assertTrue('There should be two orange foods.', orangeFoods.length == 2);
}


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
