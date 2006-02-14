/*****************************************************************************
 SectionViewConstructorTest.js
 
******************************************************************************
 Written in 2005 by Mignon Belongie

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
var rootView;
var categoryCalledPlugin;
var sectionViewDiv;
var sectionItem;
var numAxiomaticPlugins = 4;

MockRootView = function(world) {
  orp.lang.assert(world instanceof orp.model.World);
  this._world = world;
}

MockRootView.prototype.getWorld = function() {
  return this._world;
};

// -------------------------------------------------------------------
// setUp and tearDown
// -------------------------------------------------------------------

function setUp() {
  // This hack is needed so that, for instance, in test_PluginFileWithPreexistingPluginItem,
  // OutlinePlugin2 won't already be present in dojo.hostenv.loadedUris (and hence not reloaded),
  // due to having been loaded earlier in test_CreatedPluginItemIsCorrect.
  dojo.hostenv.loadedUris = [];
  
  dojo.setModulePrefix("dojo", "../../dojo/src"); // relative to testRunner.html
  dojo.setModulePrefix("orp", "../../../source"); // relative to dojo.js
  dojo.require("orp.archive.StubArchive");
  dojo.require("orp.model.World");
  dojo.require("orp.view.SectionView");
  orp.storage.PATH_TO_TRUNK_DIRECTORY_FROM_WINDOW_LOCATION = "../..";
  orp.storage.PATH_TO_WINDOW_LOCATION_FROM_TRUNK_DIRECTORY = "tests/view";

  // This simulates 'reloading' SectionView.js, so that for each test, it will be as if 
  // the constructor had never been called before.
  orp.view.SectionView._ourListOfRegisteredPluginClasses = [];

  var archive = new orp.archive.StubArchive(orp.storage.PATH_TO_TRUNK_DIRECTORY_FROM_WINDOW_LOCATION);
  world = new orp.model.World(archive);
  var annsPassword = "Ann's password";
  var userAnn = world.newUser("Ann Doe", annsPassword);
  world.login(userAnn, annsPassword);
  rootView = new MockRootView(world);
//  alert("dojo.hostenv.getBaseScriptUri() = " + dojo.hostenv.getBaseScriptUri()); 
//  dojo.hostenv.setBaseScriptUri("../../../");
  categoryCalledPlugin = world.getItemFromUuid(orp.view.SectionView.UUID.CATEGORY_PLUGIN_VIEW);
  sectionViewDiv = document.createElement("div");
  sectionItem = world.newItem("FakeSectionItem");
}

function tearDown() {
  delete orp.plugins;
  world.logout();
}

// -------------------------------------------------------------------
// Test functions
// -------------------------------------------------------------------

function test_CorePluginsLoaded() {
  orp.view.PluginView.PATH_TO_PLUGIN_DIRECTORY_FROM_TRUNK = "tests/emptyPluginDir";
  assertTrue2(orp.view.SectionView.getNumPlugins() == 0,                          "orp.view.SectionView.getNumPlugins should return 0.");

  var sectionView = new orp.view.SectionView(rootView, sectionViewDiv, sectionItem);
  assertTrue2(orp.view.SectionView.getNumPlugins() == numAxiomaticPlugins,        "orp.view.SectionView.getNumPlugins should return numAxiomaticPlugins.");

  var sectionView2 = new orp.view.SectionView(rootView, sectionViewDiv, sectionItem);
  assertTrue2(orp.view.SectionView.getNumPlugins() == numAxiomaticPlugins,        "orp.view.SectionView.getNumPlugins should return numAxiomaticPlugins.");
}

function test_PluginFileWithoutPreexistingPluginItem() {
  orp.view.PluginView.PATH_TO_PLUGIN_DIRECTORY_FROM_TRUNK = "tests/nonemptyPluginDir";

  var listOfPluginItemsBefore = world.getItemsInCategory(categoryCalledPlugin);
  assertTrue2(orp.view.SectionView.getNumPlugins() == 0,                          "orp.view.SectionView.getNumPlugins should return 0.");
  assertTrue2(!dojo.lang.inArray(getListOfNamesOfPluginItems(), "Outline2 View"), "List of names of plugin items should not include 'Outline2 View'.");
  assertTrue2(listOfPluginItemsBefore.length == numAxiomaticPlugins,              "List of plugin items should have length = numAxiomaticPlugins.");
  assertTrue2(dojo.lang.isUndefined(orp.plugins),                                 "orp.plugins should be undefined.");

  var sectionView = new orp.view.SectionView(rootView, sectionViewDiv, sectionItem);

  var listOfPluginItemsAfter = world.getItemsInCategory(categoryCalledPlugin);
  assertTrue2(orp.view.SectionView.getNumPlugins() == numAxiomaticPlugins + 1,    "orp.view.SectionView.getNumPlugins should return numAxiomaticPlugins + 1.");
  assertTrue2(dojo.lang.inArray(getListOfNamesOfPluginItems(), "Outline2 View"),  "List of names of plugin items should include 'Outline2 View'.");
  assertTrue2(listOfPluginItemsAfter.length == numAxiomaticPlugins + 1,           "List of plugin items should have length = numAxiomaticPlugins + 1.");
  assertTrue2(!dojo.lang.isUndefined(orp.plugins.OutlinePlugin2),                 "orp.plugins.OutlinePlugin2 should be defined.");

  var sectionView2 = new orp.view.SectionView(rootView, sectionViewDiv, sectionItem);
  
  var listOfPluginItemsAfterTwo = world.getItemsInCategory(categoryCalledPlugin);
  assertTrue2(orp.view.SectionView.getNumPlugins() == numAxiomaticPlugins + 1,    "orp.view.SectionView.getNumPlugins should return numAxiomaticPlugins + 1.");
  assertTrue2(listOfPluginItemsAfterTwo.length == numAxiomaticPlugins + 1,        "List of plugin items should have length = numAxiomaticPlugins + 1.");
}

function test_CreatedPluginItemIsCorrect() {
  orp.view.PluginView.PATH_TO_PLUGIN_DIRECTORY_FROM_TRUNK = "tests/nonemptyPluginDir";

  var listOfPluginItemsBefore = world.getItemsInCategory(categoryCalledPlugin);
  assertTrue2(listOfPluginItemsBefore.length == numAxiomaticPlugins,              "List of plugin items should have length = numAxiomaticPlugins.");

  var sectionView = new orp.view.SectionView(rootView, sectionViewDiv, sectionItem);

  var listOfPluginItemsAfter = world.getItemsInCategory(categoryCalledPlugin);
  assertTrue2(listOfPluginItemsAfter.length == numAxiomaticPlugins + 1,           "List of plugin items should have length = numAxiomaticPlugins + 1.");

  var item = world.getItemFromUuid(orp.plugins.OutlinePlugin2.getPluginItemUuid());
  assertTrue2(item.getDisplayName() == "Outline2 View",                           "item should have name 'Outline2 View'.");
  assertTrue2(getShortName(item) == "Outline2",                                   "item should have short name 'Outline2'.");
  assertTrue2(getClassName(item) == "OutlinePlugin2",                             "item should have class name 'OutlinePlugin2'.");
}

// Here we test the SectionView constructor in the following situation: there is
// an item representing OutlinePlugin2, and a file OutlinePlugin2.js in the plugin
// folder, but class OutlinePlugin2 is undefined.  We'll check that afterwards,
// OutlinePlugin2 is defined.
function test_PluginFileWithPreexistingPluginItem() {
  orp.view.PluginView.PATH_TO_PLUGIN_DIRECTORY_FROM_TRUNK = "tests/nonemptyPluginDir";

  // This is orp.plugins.OutlinePlugin2.UUID, but at this point of the test, orp.plugins.OutlinePlugin2 is undefined.
  knownUuid = "99a09d90-598a-11da-87ac-c103016080e1";

  var item = world.importItem(knownUuid);
  world.importEntry({uuid: "99a187f0-598a-11da-87ac-c103016080e1",
                     item: item,
                     attribute: world.getAttributeCalledName(),
                     value: "Outline2 View" });
  world.importEntry({uuid: "99a24b40-598a-11da-87ac-c103016080e1",
                     item: item,
                     attribute: world.getAttributeCalledShortName(),
                     value: "Outline2" });
  world.importEntry({uuid: "99a335a0-598a-11da-87ac-c103016080e1",
                     item: item,
                     attribute: world.getAttributeCalledClassName(),
                     value: "OutlinePlugin2" });
  world.importEntry({uuid: "99a3f8f0-598a-11da-87ac-c103016080e1",
                     item: item,
                     attribute: world.getAttributeCalledCategory(),
                     inverseAttribute: world.getAttributeCalledItemsInCategory(),
                     value: world.getItemFromUuid(orp.view.SectionView.UUID.CATEGORY_PLUGIN_VIEW) });

  assertTrue2(dojo.lang.isUndefined(orp.plugins),                                 "orp.plugins should be undefined.");

  var sectionView = new orp.view.SectionView(rootView, sectionViewDiv, sectionItem);

  assertTrue2(!dojo.lang.isUndefined(orp.plugins.OutlinePlugin2),                 "orp.plugins.OutlinePlugin2 should be defined.");
  assertTrue2(orp.plugins.OutlinePlugin2.getPluginItemUuid() == knownUuid,        "getPluginItemUuid should return the UUID of the preexisting item.");
  assertTrue2(orp.view.SectionView.getNumPlugins() == numAxiomaticPlugins + 1,    "orp.view.SectionView.getNumPlugins should return numAxiomaticPlugins + 1.");

  var sectionView2 = new orp.view.SectionView(rootView, sectionViewDiv, sectionItem);

  assertTrue2(orp.view.SectionView.getNumPlugins() == numAxiomaticPlugins + 1,    "orp.view.SectionView.getNumPlugins should return numAxiomaticPlugins + 1.");
}

function testPluginItemWithMissingPluginFile() {
  orp.view.PluginView.PATH_TO_PLUGIN_DIRECTORY_FROM_TRUNK = "tests/emptyPluginDir";

  //Make a plugin item for class BogusPlugin that doesn't have a corresponding file BogusPlugin.js in the plugin directory.
  var bogusPluginItem = world.newItem("BogusPluginItem");
  bogusPluginItem.addEntry({attribute: world.getAttributeCalledClassName(),
                           value: "BogusPlugin"});
  var categoryCalledPluginView = world.getItemFromUuid(orp.view.SectionView.UUID.CATEGORY_PLUGIN_VIEW);
  bogusPluginItem.assignToCategory(categoryCalledPluginView);

  var exceptionCaught = false;
  try {
    var sectionView = new orp.view.SectionView(rootView, sectionViewDiv, sectionItem);
  }
  catch (exception) {
    exceptionCaught = true;
  }
  assertTrue("Exception should have been caught.", exceptionCaught);    
}

// -------------------------------------------------------------------
// Helper functions
// -------------------------------------------------------------------

assertTrue2 = function(assertion, comment) {
  assertTrue(comment, assertion);
}

function getListOfNamesOfPluginItems() {
  var listOfPluginItems = world.getItemsInCategory(categoryCalledPlugin);
  var listOfNamesOfPluginItems = [];
  dojo.lang.map(listOfPluginItems, listOfNamesOfPluginItems, function(x){this.push(x.getDisplayName())});
  return listOfNamesOfPluginItems;
}

function getShortName(item) {
  return item.getSingleEntryFromAttribute(world.getAttributeCalledShortName()).getDisplayString();
}

function getClassName(item) {
  return item.getSingleEntryFromAttribute(world.getAttributeCalledClassName()).getDisplayString();
}

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
