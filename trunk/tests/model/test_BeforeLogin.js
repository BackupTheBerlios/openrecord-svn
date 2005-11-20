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
  dojo.hostenv.setModulePrefix("dojo", "../../../dojo/dojo-rev1759/src");
  dojo.hostenv.setModulePrefix("orp", "../../../../source");
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
  
function testIllegalAttemptToCreateItem() {
  var caughtError = false;
  try {
    var newItem = world.newItem("The Great Wall of China");
  } catch (error) {
    caughtError = true;
  }
  assertTrue("We can't create a new item without being logged in", caughtError);
}

function testIllegalAttemptToCreateEntry() {
  var caughtError = false;
  var attributeCalledName = world.getAttributeCalledName();
  try {
    var newEntry = attributeCalledName.addEntry({value: "Name Too"});
  } catch (error) {
    caughtError = true;
  }
  assertTrue("We can't create a new entry without being logged in", caughtError);
}

function testAccessorsForAxiomaticItems() {
  var i;
  var item;
  var uuid;
  var listOfAssignedNames;
  var nameEntry;
  
  var categoryCalledAttribute = world.getCategoryCalledAttribute();
  var listOfAttributes = [];
  listOfAttributes.push(world.getAttributeCalledName());
  listOfAttributes.push(world.getAttributeCalledShortName());
  listOfAttributes.push(world.getAttributeCalledSummary());
  listOfAttributes.push(world.getAttributeCalledCategory());
  listOfAttributes.push(world.getAttributeCalledUnfiled());
  listOfAttributes.push(world.getAttributeCalledTag());
  for (i in listOfAttributes) {
    item = listOfAttributes[i];
    listOfAssignedNames = item.getNameEntries();
    assertTrue('Every axiomatic attribute has an array of names', dojo.lang.isArray(listOfAssignedNames));
    assertTrue('Every axiomatic attribute has one name assigned', listOfAssignedNames.length == 1);
    nameEntry = listOfAssignedNames[0];
    assertTrue('Every axiomatic attribute has a name which is an entry', (nameEntry instanceof orp.model.Entry));
    assertTrue('Every entry can be displayed as a string', dojo.lang.isString(nameEntry.getDisplayString()));
    assertTrue('Every axiomatic attribute is in the category "Attribute"', item.isInCategory(categoryCalledAttribute));
    var uuid = item.getUuid();
    assertTrue('Every axiomatic attribute has a UUID', (uuid instanceof orp.uuid.Uuid));
    assertTrue('getItemFromUuid() returns the right attribute', (world.getItemFromUuid(uuid) == item));
  }
  
  var listOfCategories = [];
  listOfCategories.push(world.getCategoryCalledAttribute());
  listOfCategories.push(world.getCategoryCalledCategory());
  listOfCategories.push(world.getCategoryCalledType());
  for (i in listOfCategories) {
    item = listOfCategories[i];
    listOfAssignedNames = item.getNameEntries();
    assertTrue('Every axiomatic category has an array of names', dojo.lang.isArray(listOfAssignedNames));
    assertTrue('Every axiomatic category has one name assigned', listOfAssignedNames.length == 1);
    nameEntry = listOfAssignedNames[0];
    assertTrue('Every axiomatic category has a name which is entry', (nameEntry instanceof orp.model.Entry));
    assertTrue('Every entry can be displayed as a string', dojo.lang.isString(nameEntry.getDisplayString()));
  }
  
  var listOfTypes = [];
  listOfTypes.push(world.getTypeCalledText());
  listOfTypes.push(world.getTypeCalledNumber());
  listOfTypes.push(world.getTypeCalledDate());
  listOfTypes.push(world.getTypeCalledCheckMark());
  listOfTypes.push(world.getTypeCalledUrl());
  listOfTypes.push(world.getTypeCalledItem());
  listOfTypes.push(world.getTypeCalledConnection());
  for (i in listOfTypes) {
    item = listOfTypes[i];
    listOfAssignedNames = item.getNameEntries();
    assertTrue('Every axiomatic type has an array of names', dojo.lang.isArray(listOfAssignedNames));
    assertTrue('Every axiomatic type has one name assigned', listOfAssignedNames.length == 1);
    nameEntry = listOfAssignedNames[0];
    assertTrue('Every axiomatic type has a name which is entry', (nameEntry instanceof orp.model.Entry));
    assertTrue('Every entry can be displayed as a string', dojo.lang.isString(nameEntry.getDisplayString()));
  }
}

function testImportMethodsWithDuplicateUuid() {
  var caughtError = false;
  try {
    var item = world.importItem("00001000-ce7f-11d9-8cd5-0011113ae5d6");
  } catch (error) {
    caughtError = true;
  }
  assertTrue("We can't import an item with a duplicate UUID", caughtError);
}

function testImportMethods() {
  var attributeCalledName = world.getAttributeCalledName();
  
  var caughtError = false;
  try {
    world.beginTransaction();
    var item = world.importItem("00000001-ce7f-11d9-8888-0011113ae5d6");
    var entry = world.importEntry({
      uuid: "00000002-ce7f-11d9-8888-0011113ae5d6",
      item: item,
      attribute: attributeCalledName,
      value: "My new item!" });
    world.endTransaction();
  } catch (error) {
    throw error;
    caughtError = true;
  }
  assertTrue("We can import an item with a unique UUID", !caughtError);
}

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
