/*****************************************************************************
 XmlConverterMultiplePassesTest.js
 
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
var foodIdAttribute;
var itemCategory;
var xmlConverterForSecondPass;

// -------------------------------------------------------------------
// setUp and tearDown
// -------------------------------------------------------------------

function setUp() {
  dojo.hostenv.setModulePrefix("orp", "../../../../source");
  dojo.hostenv.setModulePrefix("dojo", "../../../dojo/dojo-0.1.0/src");
  dojo.require("orp.util.XmlConverter");
  dojo.require("orp.util.Util");

  XmlTextNodeToAttributeSpecifier = orp.util.XmlTextNodeToAttributeSpecifier;
  XmlAttributeToAttributeSpecifier = orp.util.XmlAttributeToAttributeSpecifier;
  XmlConverter = orp.util.XmlConverter;
  
  // var pathToTrunkDirectoryFromThisFile = "../../../";
  var pathToTrunkDirectoryFromThisFile = "../..";
  
  var virtualServer = new StubVirtualServer(pathToTrunkDirectoryFromThisFile);  
  world = new World(virtualServer);
  var annsPassword = "Ann's password";
  var userAnn = world.newUser("Ann Doe", annsPassword);
  world.login(userAnn, annsPassword);
  var xmlFile = "../../../tests/util/food.xml";
  var xmlConverter = new XmlConverter(world, xmlFile, "food", "Record");
  var xmlToAttributeSpecifiers = new Array();
  xmlToAttributeSpecifiers.push(new XmlTextNodeToAttributeSpecifier(["name"], world.getAttributeCalledName()));
  var xmlAttributeToAttributeSpecifiers = new Array();
  foodIdAttribute = world.newAttribute("Food ID");
  xmlAttributeToAttributeSpecifiers.push(new XmlAttributeToAttributeSpecifier("food_id", foodIdAttribute));
  var listOfItems = xmlConverter.makeItemsFromXmlFile(xmlToAttributeSpecifiers,
                                                      xmlAttributeToAttributeSpecifiers);
  assertTrue('3 items should have been created', listOfItems.length == 3);
  itemCategory = xmlConverter.getItemCategory();
  xmlConverterForSecondPass = new XmlConverter(world, xmlFile, null, "Record", itemCategory);
}

function tearDown() {
  world.logout();
}


// -------------------------------------------------------------------
// Test functions
// -------------------------------------------------------------------

function testNewItemsNotCreatedForRecordsWithMatchingXmlAttribute() {
  var equalitySpecifier = new XmlAttributeToAttributeSpecifier("food_id", foodIdAttribute);
  var xmlTextNodeToAttributeSpecifiers = [new XmlTextNodeToAttributeSpecifier(["vitamins", "C"], world.newAttribute("Vitamin C"))];
  var listOfModifiedItems = xmlConverterForSecondPass.makeOrModifyItemsFromXmlFile(equalitySpecifier,
                                                                                   xmlTextNodeToAttributeSpecifiers);
  assertTrue('3 items should have been returned.', listOfModifiedItems.length == 3);
  var listOfAllItemsInItemCategory = world.getItemsInCategory(itemCategory);
  assertTrue('The category "itemCategory" should still have exactly 3 items.', listOfAllItemsInItemCategory.length == 3);
}

function testNewItemsNotCreatedForRecordsWithMatchingXmlTextNode() {
  var equalitySpecifier = new XmlTextNodeToAttributeSpecifier(["name"], world.getAttributeCalledName());
  var xmlTextNodeToAttributeSpecifiers = [new XmlTextNodeToAttributeSpecifier(["vitamins", "C"], world.newAttribute("Vitamin C"))];
  var listOfModifiedItems = xmlConverterForSecondPass.makeOrModifyItemsFromXmlFile(equalitySpecifier,
                                                                                   xmlTextNodeToAttributeSpecifiers);
  assertTrue('3 items should have been returned.', listOfModifiedItems.length == 3);
  var listOfAllItemsInItemCategory = world.getItemsInCategory(itemCategory);
  assertTrue('The category "itemCategory" should still have exactly 3 items.', listOfAllItemsInItemCategory.length == 3);
}

function testNewItemCreatedForRecordWithNonMatchingXmlTextNode() {
  var firstItem = world.getItemsInCategory(itemCategory)[0];
  var nameEntry = firstItem.getSingleEntryFromAttribute(world.getAttributeCalledName());
  firstItem.replaceEntry({previousEntry:nameEntry, value:"parsnip"});

  var equalitySpecifier = new XmlTextNodeToAttributeSpecifier(["name"], world.getAttributeCalledName());
  var xmlTextNodeToAttributeSpecifiers = [new XmlTextNodeToAttributeSpecifier(["vitamins", "C"], world.newAttribute("Vitamin C"))];
  var listOfModifiedItems = xmlConverterForSecondPass.makeOrModifyItemsFromXmlFile(equalitySpecifier,
                                                                                   xmlTextNodeToAttributeSpecifiers);
  assertTrue('3 items should have been returned.', listOfModifiedItems.length == 3);
  var itemsInItemCategory = world.getItemsInCategory(itemCategory);
  assertTrue('The category "itemCategory" should now have exactly 4 items.', itemsInItemCategory.length == 4);
  var names = [];
  for (var i in itemsInItemCategory) {
    names.push(itemsInItemCategory[i].getDisplayName());
  }
  hasAll = orp.util.areObjectsInSet(["carrot", "cheese puff", "radish", "parsnip"], names);
  assertTrue('Item names should include "carrot", "cheese puff", "radish" and "parsnip".', hasAll);  
}

function testModifiedItemsHaveAllExpectedAttributes() {
  var equalitySpecifier = new XmlAttributeToAttributeSpecifier("food_id", foodIdAttribute);
  var xmlTextNodeToAttributeSpecifiers = new Array();
  xmlTextNodeToAttributeSpecifiers.push(new XmlTextNodeToAttributeSpecifier(["vitamins", "A"], world.newAttribute("Vitamin A")));
  xmlTextNodeToAttributeSpecifiers.push(new XmlTextNodeToAttributeSpecifier(["vitamins", "C"], world.newAttribute("Vitamin C")));
  var listOfModifiedItems = xmlConverterForSecondPass.makeOrModifyItemsFromXmlFile(equalitySpecifier,
                                                                                   xmlTextNodeToAttributeSpecifiers);
  assertTrue('3 items should have been returned.', listOfModifiedItems.length == 3);
  for (var i in listOfModifiedItems) {
    var item = listOfModifiedItems[i];
    assertTrue('Each item should be in the category "itemCategory".', item.isInCategory(itemCategory));
    var listOfAttributes = item.getAttributes();
    assertTrue('Each item should have 5 attributes.', listOfAttributes.length == 5);
    var names = [];
    for (var j in listOfAttributes) {
      names.push(listOfAttributes[j].getDisplayName());
    }
    hasAll = orp.util.areObjectsInSet(["Category", "Name", "Food ID", "Vitamin A", "Vitamin C"], names);
    assertTrue('Each item should have attributes called "Category", "Name", "Food ID", "Vitamin A" and "Vitamin C".', hasAll);  
  }
}


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
