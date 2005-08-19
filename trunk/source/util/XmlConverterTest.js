/*****************************************************************************
 XmlConverterTest.js
 
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
var xmlConverter;

function setUp() {
  var pathToTrunkDirectoryFromThisFile = "../../../";
  var virtualServer = new StubVirtualServer(pathToTrunkDirectoryFromThisFile);  
  world = new World(virtualServer);
  var annsPassword = "Ann's password";
  var userAnn = world.newUser("Ann Doe", annsPassword);
  world.login(userAnn, annsPassword);
  xmlConverter = new XmlConverter();
}

function testDefaultConversionOfTagsToAttributes() {
  var listOfItems = xmlConverter.makeItemsFromXmlFile(world,
                                                      "../../../source/util/food.xml",
                                                      "food",
                                                      "Record");
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
    hasAll = Util.areObjectsInSet(["food:name", "food:color", "food:flavor"], names);
    assertTrue('Each item should have attributes called "food:name", "food:color" and "food:flavor".', hasAll);  
  }
}

function testSimpleXmlToAttributeSpecifiers() {
  var xmlToAttributeSpecifiers = new Array();
  xmlToAttributeSpecifiers.push(new XmlToAttributeSpecifier(["name"], world.getAttributeCalledName()));
  xmlToAttributeSpecifiers.push(new XmlToAttributeSpecifier(["flavor"], world.newAttribute("Flavor")));
  var listOfItems = xmlConverter.makeItemsFromXmlFile(world,
                                                      "../../../source/util/food.xml",
                                                      "food",
                                                      "Record",
                                                      xmlToAttributeSpecifiers);
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
    assertTrue('Each item should have attributes called "Category", "Name" and "Flavor".', Util.areObjectsInSet(["Category", "Name", "Flavor"], names));
  }
}

function testMultipleValuesForAnAttribute() {
  var xmlToAttributeSpecifiers = new Array();
  xmlToAttributeSpecifiers.push(new XmlToAttributeSpecifier(["name"], world.getAttributeCalledName()));
  var flavorAttribute = world.newAttribute("Flavor");
  xmlToAttributeSpecifiers.push(new XmlToAttributeSpecifier(["flavor"], flavorAttribute));
  var listOfItems = xmlConverter.makeItemsFromXmlFile(world,
                                                      "../../../source/util/food.xml",
                                                      "food",
                                                      "Record",
                                                      xmlToAttributeSpecifiers);
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
  assertTrue("'cheese puff' should have flavors called 'salty' and 'cheesy'.", Util.areObjectsInSet(['salty', 'cheesy'], flavorNames));
}

function testNestedXmlConversion() {
  var xmlToAttributeSpecifiers = new Array();
  xmlToAttributeSpecifiers.push(new XmlToAttributeSpecifier(["name"], world.getAttributeCalledName()));
  xmlToAttributeSpecifiers.push(new XmlToAttributeSpecifier(["vitamins", "C"], world.newAttribute("Vitamin C")));
  var listOfItems = xmlConverter.makeItemsFromXmlFile(world,
                                                      "../../../source/util/food.xml",
                                                      "food",
                                                      "Record",
                                                      xmlToAttributeSpecifiers);
  assertTrue('3 items should have been created', listOfItems.length == 3);
  for (var i in listOfItems) {
    var item = listOfItems[i];
    var listOfAttributes = item.getAttributes();
    assertTrue('Each item should have 3 attributes.', listOfAttributes.length == 3);
    var names = [];
    for (var j in listOfAttributes) {
      names.push(listOfAttributes[j].getDisplayName());
    }
    assertTrue('Each item should have attributes called "Category", "Name" and "Vitamin C".', Util.areObjectsInSet(["Category", "Name", "Vitamin C"], names));
  }
}

function testExpectedType() {
  var xmlToAttributeSpecifiers = new Array();
  xmlToAttributeSpecifiers.push(new XmlToAttributeSpecifier(["name"], world.getAttributeCalledName()));
  var colorAttribute = world.newAttribute("Color");
  var foodColorCategory = world.newCategory("Food color");
  colorAttribute.addEntryForAttribute(world.getAttributeCalledExpectedType(), foodColorCategory);
  xmlToAttributeSpecifiers.push(new XmlToAttributeSpecifier(["color"], colorAttribute));
  var listOfItems = xmlConverter.makeItemsFromXmlFile(world,
                                                      "../../../source/util/food.xml",
                                                      "food",
                                                      "Record",
                                                      xmlToAttributeSpecifiers);
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
  xmlToAttributeSpecifiers.push(new XmlToAttributeSpecifier(["name"], world.getAttributeCalledName()));
  var colorAttribute = world.newAttribute("Color");
  var foodColorCategory = world.newCategory("Food Color");
  colorAttribute.addEntryForAttribute(world.getAttributeCalledExpectedType(), foodColorCategory);
  var foodsOfThisColorCategory = world.newCategory("Foods of this color");
  colorAttribute.addEntryForAttribute(world.getAttributeCalledInverseAttribute(), foodsOfThisColorCategory);
  xmlToAttributeSpecifiers.push(new XmlToAttributeSpecifier(["color"], colorAttribute));
  var listOfItems = xmlConverter.makeItemsFromXmlFile(world,
                                                      "../../../source/util/food.xml",
                                                      "food",
                                                      "Record",
                                                      xmlToAttributeSpecifiers);
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

function tearDown() {
  world.logout();
}

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
