/*****************************************************************************
 JsonSerializer.js

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
dojo.provide("orp.archive.JsonSerializer");
dojo.require("orp.archive.JsonFormat");
dojo.require("orp.archive.TextEncoding");
dojo.require("orp.archive.StubArchive");    // FIXME: we should try to remove this dependency
dojo.require("orp.model.Transaction");
dojo.require("orp.util.DateValue");


// -------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------
/**
 * The JsonSerializer class knows how to take records in our
 * model and serialize them into a JSON string representation.
 * The service that the JsonSerializer class provides the
 * inverse of what the JsonDeserializer class provides.
 *
 * @scope    public instance constructor
 * @param    archive    The orp.archive.StubArchive instance that this serializer is working for.
 */
orp.archive.JsonSerializer = function(archive) {
	orp.archive.JsonFormat.call(this);
	this._archive = archive;  // FIXME: we should try to remove this dependency on orp.archive.StubArchive
};

dojo.inherits(orp.archive.JsonSerializer, orp.archive.JsonFormat);  // makes JsonSerializer be a subclass of JsonFormat


// -------------------------------------------------------------------
// Public methods
// -------------------------------------------------------------------

/**
 * Returns a big string, containing JavaScript "object literal"
 * representations of all of the records in a Transaction.
 *
 * @scope    public instance method
 * @param    transaction    An orp.model.Transaction object.
 * @return   A JSON string literal, representing the records in the transaction.
 */
orp.archive.JsonSerializer.prototype.serializeToString = function(transaction) {
	orp.lang.assert(transaction instanceof orp.model.Transaction);

	var indent = "  ";
	var listOfRecords = transaction.getRecords();
	if (!listOfRecords || listOfRecords.length === 0) {
		return "";
	}

	if (listOfRecords.length == 1) {
		return this._getJsonStringRepresentingRecords(listOfRecords, indent);
	} else {
		indent = "    ";
		var listOfStrings = [];
		listOfStrings.push("  // =======================================================================\n");
		listOfStrings.push('  { "' + orp.archive.JsonFormat.JSON_MEMBER.TRANSACTION_CLASS + '": [\n');
		var content = this._getJsonStringRepresentingRecords(transaction.getRecords(), indent);
		listOfStrings.push(content);
		listOfStrings.push('  ]\n');
		listOfStrings.push('  }');

		var finalString = listOfStrings.join("");
		return finalString;
	}
};


// -------------------------------------------------------------------
// Private methods
// -------------------------------------------------------------------

/**
 * Returns a big string, containing JavaScript "object literal"
 * representations of the records.
 *
 * @scope    private instance method
 * @param    listOfRecords    A list of the records to include in the JSON string.
 * @param    indent    Optional. A string of spaces to prepend to each line.
 * @return   A JSON string literal, representing the records.
 */
orp.archive.JsonSerializer.prototype._getJsonStringRepresentingRecords = function(listOfRecords, indent) {
	indent = indent || "";
	var i;
	var listOfStrings = [];
	var firstContentRecord = true;
	var itemDisplayNameSubstring;
	var entryDisplayNameSubstring;
	var listOfUsers = null;
	var commentString;
	var generateComments = false;
	var JSON_MEMBER = orp.archive.JsonFormat.JSON_MEMBER;

	if (!generateComments) {
		indent = "";
	}

	for (i in listOfRecords) {
		var record = listOfRecords[i];
		if (firstContentRecord) {
			firstContentRecord = false;
		} else {
			listOfStrings.push(',\n');
		}
		if (generateComments) {
			listOfStrings.push(indent + '// -----------------------------------------------------------------------\n');
		}

		if (record instanceof orp.model.Item) {
			var item = record;
			if (generateComments) {
				listOfStrings.push(indent + '// ' + this._getTypedDisplayStringForItem(item) + '\n');
				listOfStrings.push(indent + '//           by (' + this._truncateString(item.getUserstamp().getDisplayString()) + ')');
				listOfStrings.push(' on (' + orp.util.DateValue.getStringMonthDayYear(item.getCreationDate()) + ')\n');
			}
			if (!this._jsonFragmentForItemPrefix) {
				this._jsonFragmentForItemPrefix = indent + '{ "' + JSON_MEMBER.ITEM_CLASS + '": ';
				this._jsonFragmentForItemPrefix += '{ "' + JSON_MEMBER.UUID + '": ';
			}
			listOfStrings.push(this._jsonFragmentForItemPrefix);
			listOfStrings.push(item._getUuidInQuotes());
			listOfStrings.push(' } }');

			if (!listOfUsers) {
				listOfUsers = this._archive.getUsers();
			}
			if (orp.util.isObjectInSet(item, listOfUsers)) {
				var user = item;
				var password = this._archive.getAuthenticationInfoForUser(user);
				var passwordString = "null";
				if (password) {
					passwordString = '"' + password + '"';
				}
				listOfStrings.push(',\n');
				if (generateComments) {
					listOfStrings.push(indent + '// -----------------------------------------------------------------------\n');
					listOfStrings.push(indent + '// ' + this._getTypedDisplayStringForItem(user) + '\n');
				}
				listOfStrings.push(indent + '{ "' + JSON_MEMBER.USER_CLASS + '": ' + '{\n');
				listOfStrings.push(indent + '         "' + JSON_MEMBER.USER + '": ' + user._getUuidInQuotes() + ',\n');
				listOfStrings.push(indent + '     "' + JSON_MEMBER.PASSWORD + '": ' + passwordString + ' }\n');
				listOfStrings.push(indent + '}');
			}
		}

		if (record instanceof orp.model.Vote) {
			var vote = record;
			entryDisplayNameSubstring = this._getTypedDisplayStringForItem(vote.getContentRecord());
			var deleteVsRetainString = vote.getRetainFlag() ? "RETAIN" : "DELETE";
			if (generateComments) {
				listOfStrings.push(indent + '// vote to ' + deleteVsRetainString + " " + entryDisplayNameSubstring + '\n');
			}
			listOfStrings.push(indent + '{ "' + JSON_MEMBER.VOTE_CLASS + '": ' + '{\n');
			listOfStrings.push(indent + '         "' + JSON_MEMBER.UUID + '": ' + vote._getUuidInQuotes() + ',\n');
			listOfStrings.push(indent + '       "' + JSON_MEMBER.RECORD + '": ' + vote.getContentRecord()._getUuidInQuotes() + ',\n');
			listOfStrings.push(indent + '   "' + JSON_MEMBER.RETAIN_FLAG + '": "' + vote.getRetainFlag() + '"');
			listOfStrings.push('  }\n');
			listOfStrings.push(indent + '}');
		}

		if (record instanceof orp.model.Ordinal) {
			var ordinal = record;
			entryDisplayNameSubstring = this._getTypedDisplayStringForItem(ordinal.getContentRecord());
			if (generateComments) {
				listOfStrings.push(indent + '// ordinal # ' + ordinal.getOrdinalNumber() + " for " + entryDisplayNameSubstring + '\n');
			}
			listOfStrings.push(indent + '{ "' + JSON_MEMBER.ORDINAL_CLASS + '": ' + '{' + '\n');
			listOfStrings.push(indent + '         "' + JSON_MEMBER.UUID + '": ' + ordinal._getUuidInQuotes() + ',\n');
			listOfStrings.push(indent + '       "' + JSON_MEMBER.RECORD + '": ' + ordinal.getContentRecord()._getUuidInQuotes() + ',\n');
			listOfStrings.push(indent + '        "' + JSON_MEMBER.ORDINAL_NUMBER + '": "' + ordinal.getOrdinalNumber() + '"');
			listOfStrings.push('  }\n');
			listOfStrings.push(indent + '}');
		}

		if (record instanceof orp.model.Entry) {
			var entry = record;
			var entryType = entry.getType();
			var typeUuid = entryType.getUuid();
			// var entryString = "";
			if (generateComments) {
				listOfStringsForEntry = [];
			} else {
				listOfStringsForEntry = listOfStrings;
			}
			listOfStringsForEntry.push(indent + '{ "' + JSON_MEMBER.ENTRY_CLASS + '": ' + '{\n');
			listOfStringsForEntry.push(indent + '         "' + JSON_MEMBER.UUID + '": ' + entry._getUuidInQuotes() + ',\n');
			var previousEntry = entry.getPreviousEntry();
			if (previousEntry) {
				listOfStringsForEntry.push(indent + '"' + JSON_MEMBER.PREVIOUS_VALUE + '": ' + previousEntry._getUuidInQuotes() + ',\n');
			}
			listOfStringsForEntry.push(indent + '         "' + JSON_MEMBER.TYPE + '": "' + typeUuid.toString() + '",\n');
			if (generateComments) {
				commentString = "";
			}
			if (typeUuid.toString() == orp.model.World.UUID.TYPE_CONNECTION) {
				var pairOfItems = entry.getItem();
				var firstItem = pairOfItems[0];
				var secondItem = pairOfItems[1];
				listOfStringsForEntry.push(indent + '         "' + JSON_MEMBER.ITEM + '": [' + firstItem._getUuidInQuotes() + ', ' + secondItem._getUuidInQuotes() + '],\n');
				var pairOfAttributes = entry.getAttribute();
				var firstAttribute = pairOfAttributes[0];
				var secondAttribute = pairOfAttributes[1];
				listOfStringsForEntry.push(indent + '    "' + JSON_MEMBER.ATTRIBUTE + '": [' + firstAttribute._getUuidInQuotes() + ', ' + secondAttribute._getUuidInQuotes() + ']');
				if (generateComments) {
					commentString += indent + '// ' + this._getTypedDisplayStringForItem(firstItem);
					commentString += ".(" + this._truncateString(firstAttribute.getDisplayString("???")) + ")";
					commentString += " = " + this._getTypedDisplayStringForItem(secondItem) + "\n";
					commentString += indent + '// ' + this._getTypedDisplayStringForItem(secondItem);
					commentString += ".(" + this._truncateString(secondAttribute.getDisplayString("???")) + ")";
					commentString += " = " + this._getTypedDisplayStringForItem(firstItem) + "\n";
				}
			} else {
				var attribute = entry.getAttribute();
				// if (!(attribute instanceof orp.model.Item)) {
				//   alert(entry + "\n" + attribute);
				// }
				listOfStringsForEntry.push(indent + '    "' + JSON_MEMBER.ATTRIBUTE + '": ' + attribute._getUuidInQuotes() + ',\n');
				listOfStringsForEntry.push(indent + '         "' + JSON_MEMBER.ITEM + '": ' + entry.getItem()._getUuidInQuotes() + ',\n');
				var contentData = entry.getValue();

				var valueString = null;
				var valueComment = null;
				switch (typeUuid.toString()) {
					case orp.model.World.UUID.TYPE_NUMBER:
						valueString = '"' + contentData + '"';
						if (generateComments) {valueComment = contentData;}
						break;
					case orp.model.World.UUID.TYPE_TEXT:
						valueString = '"' + orp.archive.TextEncoding.encodeText(contentData) + '"';
						if (generateComments) {valueComment = '"' + this._truncateString(contentData) + '"';}
						break;
					case orp.model.World.UUID.TYPE_DATE:
						valueString = '"' + contentData.toString() + '"';
						if (generateComments) {valueComment = valueString;}
						break;
					case orp.model.World.UUID.TYPE_ITEM:
						valueString = contentData._getUuidInQuotes();
						if (generateComments) {valueComment = this._getTypedDisplayStringForItem(contentData);}
						break;
					default:
						orp.lang.assert(false, "no such type: " + entryType.getDisplayString());
				}
				listOfStringsForEntry.push(indent + '        "' + JSON_MEMBER.VALUE + '": ' + valueString);
				if (generateComments) {
					commentString += indent + '// ' + this._getTypedDisplayStringForItem(entry.getItem());
					commentString += ".(" + this._truncateString(attribute.getDisplayString("???")) + ")";
					commentString += " = " + valueComment + "\n";
				}
			}
			if (generateComments) {
				commentString += indent + '//           by (' + this._truncateString(entry.getUserstamp().getDisplayString()) + ')';
				commentString += ' on (' + orp.util.DateValue.getStringMonthDayYear(entry.getCreationDate()) + ')\n';
				listOfStrings.push(commentString);
				for (var j in listOfStringsForEntry) {
					listOfStrings.push(listOfStringsForEntry[j]);
				}
			}
			listOfStrings.push('  }\n');
			listOfStrings.push(indent + '}');
		}
	}

	var finalString = listOfStrings.join("");
	return finalString;
};


/**
 * Given an item, this method returns a string with a description of the item.
 *
 * Here are some example of what the returned strings look like:
 * <pre>
 *   "(Food: Cupcake)"
 *   "(Attribute: Height)"
 *   "(Category: Food)"
 *   "(Category: Things with names that have hundreds of let...)"
 *   "(Banana)"
 *   "()"
 * </pre>
 *
 * @scope    private instance method
 * @param    item    Any item (or entry).
 * @return   A string with a description of the item.
 */
orp.archive.JsonSerializer.prototype._getTypedDisplayStringForItem = function(item) {
	var returnString = "(";
	if (item) {
		if (item instanceof orp.model.Item) {
			var category = item.getFirstCategory();
			if (category) {
				returnString += this._truncateString(category.getDisplayString("???")) + ": ";
			}
			returnString += this._truncateString(item.getDisplayString("???"));
		}
		if (item instanceof orp.model.Entry) {
			returnString += "Entry";
		}
	}
	returnString += ")";
	return returnString;
};


/**
 * Given a string, returns a copy of the string that is less than
 * 80 characters long.
 *
 * @scope    private instance method
 * @param    string    A string that may need truncating.
 * @return   A string that is no longer than 80 characters long.
 */
orp.archive.JsonSerializer.prototype._truncateString = function(string) {
	var maxLength = 80;
	var ellipsis = "...";
	var returnString = "";
	if (string.length > maxLength) {
		returnString = (string.substring(0, (maxLength - ellipsis.length)) + ellipsis);
	} else {
		returnString = string;
	}
	return orp.archive.TextEncoding.encodeText(returnString);
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
