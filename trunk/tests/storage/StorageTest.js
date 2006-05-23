/*****************************************************************************
 StorageTest.js

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
var pathToTrunkDirectoryFromThisDirectory   = "../..";
var repositoryName = "FakeRepository";
var repositoryDirectoryName = "repositories";
var fileUrl;
var saver;

// -------------------------------------------------------------------
// setUp and tearDown
// -------------------------------------------------------------------

function setUp() {
	dojo.setModulePrefix("dojo", "../../dojo/src"); // relative to testRunner.html
	dojo.setModulePrefix("orp", "../../../source"); // relative to dojo.js
	dojo.require("orp.util.Util");
	dojo.require("orp.storage.FileProtocolStorage");
	dojo.require("orp.storage.HttpProtocolStorage");

	utilAssertReportedError = false;
	orp.util.setErrorReportCallback(errorReporter)

	var isHttp = (window.location.protocol == "http:");
	saver = isHttp? new orp.storage.HttpProtocolStorage(repositoryName, repositoryDirectoryName, pathToTrunkDirectoryFromThisDirectory)
								: new orp.storage.FileProtocolStorage(repositoryName, repositoryDirectoryName, pathToTrunkDirectoryFromThisDirectory);

	// Examples of what window.location.pathname should look like:
	// for http: protocol: /openrecord/trunk/source/model/TestRepositoryWriting.html
	// for file: protocol on a Mac: /Libraries/.../openrecord/trunk/source/model/TestRepositoryWriting.html
	// for file: protocol on a PC:  /C:/Documents and Settings/.../source/model/TestRepositoryWriting.html
	var thisUrl = window.location.pathname;
	var arrayOfPathComponents = thisUrl.split('/');
	arrayOfPathComponents.pop();
	var thisDirectory = arrayOfPathComponents.join('/'); //e.g. /openrecord/trunk/source/model

	// fileUrl must specify a file /repositories/*.json relative to the trunk directory, because
	// that's where FileSaver and HttpSaver will write
	fileUrl = thisDirectory + '/' + pathToTrunkDirectoryFromThisDirectory
													+ '/' + repositoryDirectoryName
													+ '/' + repositoryName + ".json";
}

function tearDown() {
	assertFalse(utilAssertReportedError);
}


// -------------------------------------------------------------------
// Test functions
// -------------------------------------------------------------------

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
// Helper functions
// -------------------------------------------------------------------

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
	var contents = dojo.hostenv.getText(fileUrl);
	for (var i = 0; contents != expectedContents && i < 5; ++i) {
		waitASecond();
		contents = dojo.hostenv.getText(fileUrl);
	}
	return (contents == expectedContents);
}

function fileHasExpectedSubstring(expectedSubstring) {
	var contents = dojo.hostenv.getText(fileUrl);
	for (var i = 0; contents.indexOf(expectedSubstring) == -1 && i < 5; ++i) {
		waitASecond();
		contents = dojo.hostenv.getText(fileUrl);
	}
	return (contents.indexOf(expectedSubstring) != -1);
}


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
