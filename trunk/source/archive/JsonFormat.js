/*****************************************************************************
 JsonFormat.js

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
// Provides and Requires
// -------------------------------------------------------------------
dojo.provide("orp.archive.JsonFormat");


// -------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------
/**
 * The JsonFormat class knows some basic things about our
 * JSON repository format.  JsonFormat serves as the base
 * class for the JsonSerializer and JsonDeserializer.
 *
 * @scope    public instance constructor
 */
orp.archive.JsonFormat = function() {
	// no need to do anything
};


// -------------------------------------------------------------------
// Public methods
// -------------------------------------------------------------------

/**
 * Returns a string, containing the JavaScript "object literal"
 * fragment needed as the header for new repositories.
 *
 * @scope    public instance method
 * @return   A JSON fragment used for initializing new repositories.
 */
orp.archive.JsonFormat.prototype.getRepositoryHeader = function() {
	var text = '{ "format": "' + orp.archive.JsonFormat.FILE_FORMAT.FORMAT_2005_JUNE_CHRONOLOGICAL_LIST + '", \n';
	text +=    '  "records": [\n';
	text +=    '  // =======================================================================\n';
	text +=    '  { "Transaction": [ ]\n';
	text +=    '  }';
	return text;
};


/**
 * Returns a string, containing the JavaScript "object literal" fragment
 * needed to match the header string returned by getRepositoryHeader().
 *
 * @scope    public instance method
 * @return   A JSON fragment used for initializing new repositories.
 */
orp.archive.JsonFormat.prototype.getRepositoryFooter = function() {
	return " ] }";
};


// -------------------------------------------------------------------
// Public constants
// -------------------------------------------------------------------

orp.archive.JsonFormat.FILE_FORMAT = {
	FORMAT_2005_JUNE_CHRONOLOGICAL_LIST: "2005_JUNE_CHRONOLOGICAL_LIST" };

orp.archive.JsonFormat.JSON_MEMBER = {
	FORMAT: "format",
	RECORDS: "records",
	TYPE: "type",
	VALUE: "value",
	UUID: "uuid",
	USER: "user",
	PASSWORD: "password",
	ITEM_CLASS: "Item",
	ENTRY_CLASS: "Entry",
	VOTE_CLASS: "Vote",
	ORDINAL_CLASS: "Ordinal",
	USER_CLASS: "User",
	TRANSACTION_CLASS: "Transaction",
	ATTRIBUTE: "attribute",
	PREVIOUS_VALUE: "previousEntry",
	RECORD: "record",
	ITEM: "item",
	RETAIN_FLAG: "retainFlag",
	ORDINAL_NUMBER: "value" };


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
