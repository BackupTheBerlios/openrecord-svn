/*****************************************************************************
 RepositoryWritingTest.js
 
******************************************************************************
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

var utilAssertReportedError;
var pathToTrunkDirectory;
var fileName;
var universalFileSaver;
var fileUrl;
var saver;

function errorReporter() {
  utilAssertReportedError = true;
}

function waitASecond() {
  var now = new Date();
  var then = now;
  while (now.valueOf() - then.valueOf() < 1000) {
    now = new Date();
  }
}

function fileHasExpectedContents(expectedContents) {
  var contents = Util.getStringContentsOfFileAtURL(fileUrl);
  for (var i = 0; contents != expectedContents && i < 5; ++i) {
    waitASecond();
    contents = Util.getStringContentsOfFileAtURL(fileUrl);
  }
  return (contents == expectedContents);
}

function setUp() {
  utilAssertReportedError = false;
  Util.setErrorReportCallback(errorReporter)
  
  pathToTrunkDirectoryFromFileSaver       = "../..";
  pathToTrunkDirectoryFromThisDirectory   = "../..";
  pathToTrunkDirectoryFromTestRunner      = "../../../";
  fileName = "FakeRepository";
  var isHttp = window.location.protocol == "http:";
  saver = isHttp? new HttpSaver(pathToTrunkDirectoryFromTestRunner, fileName) 
                : new FileSaver(fileName, pathToTrunkDirectoryFromThisDirectory);

  // fileUrl must specify a file /repositories/*.json relative to the trunk directory, because
  // that's where FileSaver and HttpSaver will write
  if (isHttp) {
    // pathToTrunkDirectoryFromTestRunner is used by HttpSaver only to find the php files.
    var thisUrl = window.location.pathname; //e.g. /openrecord/trunk/source/model/TestRepositoryWriting.html.    
    var arrayOfPathComponents = thisUrl.split('/');
    arrayOfPathComponents.pop();
    var thisDirectory = arrayOfPathComponents.join('/'); //e.g. /openrecord/trunk/source/model
    fileUrl = thisDirectory + '/' + pathToTrunkDirectoryFromThisDirectory + "/repositories/" + fileName + ".json";
  } else {
    fileUrl = saver._getLocalPathFromWindowLocation([pathToTrunkDirectoryFromFileSaver, "repositories", fileName + ".json"]);
  }
}

function tearDown() {
  assertFalse(utilAssertReportedError);
}

function testCreateNewFile() {
  var now = new Date();
  var timestamp = now.toString() + " " + now.valueOf();
  var overwriteIfExists = true;
  saver.writeText(timestamp, overwriteIfExists);
  assertTrue("Contents should be timestamp.", fileHasExpectedContents(timestamp));
}

function testOverwriteFile() {
  var overwriteIfExists = true;
  saver.writeText("123", overwriteIfExists);
  assertTrue("Contents should be '123'.", fileHasExpectedContents('123'));
  var now = new Date();
  var timestamp = now.toString() + " " + now.valueOf();
  saver.writeText(timestamp, overwriteIfExists);
  assertTrue("Contents should be timestamp.", fileHasExpectedContents(timestamp));
}

function testAppendToFile() {
  var now = new Date();
  var timestamp1 = now.toString() + " " + now.valueOf();
  var overwriteIfExists = true;
  saver.writeText(timestamp1, overwriteIfExists);
  assertTrue("Contents should be timestamp1.", fileHasExpectedContents(timestamp1));
  now = new Date();
  var timestamp2 = now.toString() + " " + now.valueOf();
  saver.appendText("\n" + timestamp2);
  var expectedContents = timestamp1 + "\n" + timestamp2;
  assertTrue("Contents should be timestamp1 & timestamp2.", fileHasExpectedContents(expectedContents));
}

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
