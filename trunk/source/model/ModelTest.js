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
 
var ModelTestVars = null;

function setUp() {
  ModelTestVars = {};
}

function testLoginLogout() {
  var world = new World();
  var listOfUsers;
  var loginSuccess;
  
  listOfUsers = world.getUsers();
  assertTrue("Initially, there's only an axiomatic user", listOfUsers.length == 1);
  assertTrue('Nobody is logged in', world.getCurrentUser() === null);

  var janesPassword = "jane's password";
  var userJane = world.newUser("Jane Doe", janesPassword);  
  listOfUsers = world.getUsers();
  assertTrue("Now there are two users", listOfUsers.length == 2);
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
  
  world.logout();
}
  

function testAccessorsForAxiomaticItems() {
  var key;
  var item;
  var world = new World();
  var listOfAssignedNames;
  var nameValue;
  
  var listOfAttributes = [];
  listOfAttributes.push(world.getAttributeCalledName());
  listOfAttributes.push(world.getAttributeCalledShortName());
  listOfAttributes.push(world.getAttributeCalledSummary());
  listOfAttributes.push(world.getAttributeCalledCategory());
  for (key in listOfAttributes) {
    item = listOfAttributes[key];
    listOfAssignedNames = item.getName();
    assertTrue('Every axiomatic attribute has an array of names', Util.isArray(listOfAssignedNames));
    assertTrue('Every axiomatic attribute has one name assigned', listOfAssignedNames.length == 1);
    nameValue = listOfAssignedNames[0];
    assertTrue('Every axiomatic attribute has a name which is value', (nameValue instanceof Value));
    assertTrue('Every value can be displayed as a string', Util.isString(nameValue.getDisplayString()));
  }
  
  var listOfCategories = [];
  listOfCategories.push(world.getCategoryCalledAttribute());
  listOfCategories.push(world.getCategoryCalledCategory());
  for (key in listOfCategories) {
    item = listOfCategories[key];
    listOfAssignedNames = item.getName();
    assertTrue('Every axiomatic category has an array of names', Util.isArray(listOfAssignedNames));
    assertTrue('Every axiomatic category has one name assigned', listOfAssignedNames.length == 1);
    nameValue = listOfAssignedNames[0];
    assertTrue('Every axiomatic category has a name which is value', (nameValue instanceof Value));
    assertTrue('Every value can be displayed as a string', Util.isString(nameValue.getDisplayString()));
  }
}

  
function testAdditionsAndRetrievals() {
  var world = new World();
  var nameAttribute = world.getAttributeCalledName();
  
  var janesPassword = "jane's password";
  var listOfCharacters = null;
  var listOfValues = null;
  var listOfAttributes = null;
  var worldRetrievalFilter = null;
  var hasAll;
  
  var tZero = new Date();
  var userJane = world.newUser("Jane Doe", janesPassword);
  world.login(userJane, janesPassword);

  var characterAttribute = world.newAttribute("Characters");
  var starWars = world.newItem("Star Wars");
  var luck = starWars.addAttributeValue(characterAttribute, "Luck Skywalker");
  var c3po = starWars.addAttributeValue(characterAttribute, "C3PO");
  var r2d2 = starWars.addValue("R2D2");
  assertTrue('"Star Wars" has not been deleted', !starWars.hasBeenDeleted());
  assertTrue('"R2D2" has not been deleted', !r2d2.hasBeenDeleted());
  assertTrue('"R2D2" has not been replaced', !r2d2.hasBeenReplaced());

  listOfCharacters = starWars.getValuesForAttribute(characterAttribute);
  hasAll = true;
  hasAll = hasAll &&  Util.isObjectInSet(luck, listOfCharacters);
  hasAll = hasAll &&  Util.isObjectInSet(c3po, listOfCharacters);
  assertTrue('"Star Wars" has characters: luck, c3po', hasAll);
  assertTrue('Exactly 2 characters in the star wars', listOfCharacters.length == 2);

  listOfValues = starWars.getValues();
  hasAll = true;
  hasAll = hasAll &&  Util.isObjectInSet(luck, listOfCharacters);
  hasAll = hasAll &&  Util.isObjectInSet(c3po, listOfCharacters);
  hasAll = hasAll &&  Util.isObjectInSet(r2d2, listOfValues);
  assertTrue('"Star Wars" has values: luck, c3po, r2d2', hasAll);  
  
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
  hasAll = true;
  hasAll = hasAll &&  Util.isObjectInSet(nameAttribute, listOfAttributes);
  hasAll = hasAll &&  Util.isObjectInSet(characterAttribute, listOfAttributes);
  assertTrue('"Star Wars" has all 5 expected attributes', hasAll);
  
  worldRetrievalFilter = world.getRetrievalFilter();
  assertTrue('Default retrieval filter is "last edit wins"', worldRetrievalFilter == World.RETRIEVAL_FILTER_LAST_EDIT_WINS);
  
  var luke = starWars.replaceValue(luck, "Luke Skywalker");
  var previousValue = luke.getPreviousValue();
  assertTrue('"Luke" has the previous version "Luck"', previousValue !== null);

  world.logout();
  
  var passwordForChris = "Kringlishous!";
  var userChris = world.newUser("Chris Kringle", passwordForChris);
  world.login(userChris, passwordForChris);

  r2d2 = starWars.replaceValueWithAttributeValue(r2d2, characterAttribute, "R2D2");
  var hasR2d2;
  
  listOfCharacters = starWars.getValuesForAttribute(characterAttribute);
  hasR2d2 = Util.isObjectInSet(r2d2, listOfCharacters);
  assertTrue('Chris sees R2D2 as a character', hasR2d2);
  
  world.logout();
}


function tearDown() {
  ModelTestVars = null;
}

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
