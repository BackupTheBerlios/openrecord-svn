/*****************************************************************************
 test_dependencies.js

******************************************************************************
 Written in 2005 by
		Brian Douglas Skinner <brian.skinner@gumption.org>

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
	dojo.setModulePrefix("dojo", "../../dojo/src"); // relative to testRunner.html
	dojo.setModulePrefix("orp", "../../../source"); // relative to dojo.js
	dojo.require("orp.storage.Storage");
	dojo.require("orp.storage.FakeStorage");
	dojo.require("orp.storage.FileProtocolStorage");
	dojo.require("orp.storage.HttpProtocolStorage");
	dojo.require("orp.storage.directoryList");
	dojo.require("orp.storage.fileProtocolUtil");
}

function tearDown() {
}


// -------------------------------------------------------------------
// Test functions
// -------------------------------------------------------------------

function testDependencies() {
	assertTrue("orp.lang is defined", ((typeof orp.lang) === 'object'));
	assertTrue("orp.storage is defined", ((typeof orp.storage) === 'object'));
	var i = 0;
	for (var key in orp) {
		++i;
	}
	assertTrue("Only orp.lang and orp.storage are defined", (i === 2));
}

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
