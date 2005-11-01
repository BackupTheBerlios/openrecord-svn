/*****************************************************************************
 DirectoryReadingTest.js
 
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

// -------------------------------------------------------------------
// setUp and tearDown
// -------------------------------------------------------------------

function setUp() {
  dojo.hostenv.setModulePrefix("dojo", "../../../dojo/dojo-rev1759/src");
  dojo.hostenv.setModulePrefix("orp", "../../../../source");
  dojo.require("orp.storage.directoryList");
  dojo.require("orp.util.Util");
  orp.storage.PATH_TO_TRUNK_DIRECTORY_FROM_WINDOW_LOCATION = "../..";
  orp.storage.PATH_TO_WINDOW_LOCATION_FROM_TRUNK_DIRECTORY = "tests/storage";
}

function tearDown() {
}

// -------------------------------------------------------------------
// Test functions
// -------------------------------------------------------------------

function testGetDirListWithSuffix() {
  var dirList = orp.storage.getDirList("directory_1/subdirectory_1", "js");
  assertTrue("List should include 'javascript_file_1.js'.", orp.util.isObjectInSet("javascript_file_1.js", dirList));
  assertTrue("List should include 'javascript_file_2.js'.", orp.util.isObjectInSet("javascript_file_2.js", dirList));
  assertTrue("List should include exactly two files.", dirList.length == 2);
}

function testGetDirListWithoutSuffix() {
  var dirList = orp.storage.getDirList("directory_1/subdirectory_1");
  assertTrue("List should include 'suffixless_file_1'.", orp.util.isObjectInSet("suffixless_file_1", dirList));
  assertTrue("List should include 'javascript_file_2.js'.", orp.util.isObjectInSet("javascript_file_2.js", dirList));
  assertTrue("List should include 'text_file_1.txt'.", orp.util.isObjectInSet("text_file_1.txt", dirList));
  var expectedNumberOfFiles = 6;
  if (orp.util.isObjectInSet(".svn", dirList)) {
    expectedNumberOfFiles += 1;
  }
  assertTrue("List should include the expected number of files.", dirList.length == expectedNumberOfFiles);
}

function testGetDirListForMissingDir() {
  var exceptionCaught = false;
  try {
    var dirList = orp.storage.getDirList("nonexistent");
  }
  catch (exception) {
    exceptionCaught = true;
  }
  assertTrue("Exception should have been caught.", exceptionCaught);    
}

// -------------------------------------------------------------------
// Helper functions
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
