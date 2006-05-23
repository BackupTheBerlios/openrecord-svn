/*****************************************************************************
 Record.js

******************************************************************************
 Written in 2005 by
		Brian Douglas Skinner <brian.skinner@gumption.org>
		Mignon Belongie

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
dojo.provide("orp.model.Record");
dojo.require("dojo.uuid.Uuid");
dojo.require("orp.lang.Lang");

// -------------------------------------------------------------------
// Dependencies, expressed in the syntax that JSLint understands:
//
/*global Util  */
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------
/**
 * The Record class serves as an abstract superclass for the classes Vote,
 * Ordinal, and ContentRecord.  ContentRecord is the abstract superclass
 * for Item and Entry.
 *
 * @scope    public instance constructor
 * @param    world    The world that this Record is a part of.
 * @param    uuid    The UUID for this Record.
 */
orp.model.Record = function(world, uuid) {
	if (dojo.lang.isString(uuid)) {
		var uuidString = uuid;
		// uuid = new orp.uuid.TimeBasedUuid(uuidString);
		// orp.lang.assert(uuid instanceof orp.uuid.TimeBasedUuid);
		uuid = new dojo.uuid.Uuid(uuidString);
		orp.lang.assert(uuid instanceof dojo.uuid.Uuid);
	}

	// Unfortunately, we need to treat 'world' and 'uuid' as 'Optional'.
	// I think this constructor is invoked by dojo.inherits() calls
	// (in ContentRecord, Vote, and Ordinal), which do not pass
	// in any values for world and uuid.
	orp.lang.assertTypeForOptionalValue(uuid, dojo.uuid.Uuid);
	orp.lang.assertTypeForOptionalValue(world, orp.model.World);

	this._world = world;
	this._uuid = uuid;

	// Don't create these properties until we know we need them.
	// this._creationTimestamp = null;
	// this._creationUserstamp = null;
};


// -------------------------------------------------------------------
// Simple accessor methods
// -------------------------------------------------------------------

/**
 * Returns the world that this record was created in.
 *
 * @scope    public instance method
 * @return   A world object.
 */
orp.model.Record.prototype.getWorld = function() {
	return this._world;
};


/**
 * Returns the item representing the user who created this record.
 *
 * @scope    public instance method
 * @return   A user item.
 */
orp.model.Record.prototype.getUserstamp = function() {
	if (this._creationUserstamp) {
		return this._creationUserstamp;
	}
	var myPseudonode = this.getUuid().getNode();
	var allUsers = this._world.getUsers();
	for (var key in allUsers) {
		var user = allUsers[key];
		var usersPseudonode = user.getUuid().getNode();
		if (usersPseudonode == myPseudonode) {
			this._creationUserstamp = user;
			return this._creationUserstamp;
		}
	}
	throw new Error("We ran into item or entry that has a UUID which was not created by any known user.  The database may be corrupted.");
};


/**
 * Returns ???.
 *
 * @scope    public instance method
 * @return   ???.
 */
orp.model.Record.prototype.getTimestamp = function() {
	if (!this._creationTimestamp) {
		this._creationTimestamp = this.getCreationDate().valueOf();
	}
	return this._creationTimestamp;
};


/**
 * Returns a Date object with the creation timestamp for this record.
 *
 * @scope    public instance method
 * @return   A Date object.
 */
orp.model.Record.prototype.getCreationDate = function() {
	return this.getUuid().getTimestamp(Date);
};


/**
 * Returns the UUID of the record.
 *
 * @scope    public instance method
 * @return   The UUID of the record.
 */
orp.model.Record.prototype.getUuid = function() {
	return this._uuid;
};


/**
 * Returns a string representation of the UUID of the record.
 *
 * @scope    public instance method
 * @return   A string representing the UUID of the record.
 */
orp.model.Record.prototype.getUuidString = function() {
	return this._uuid.toString();
};


// -------------------------------------------------------------------
// Package/module methods
// -------------------------------------------------------------------

/**
 * Returns a string representation of the UUID of the item, wrapped in
 * quotes.  The return value will always be a 38-character string,
 * where the first and last characters are quotes.  For example:
 *
 * <pre>
 *   "3B12F1DF-5232-1804-897E-917BF397618A"
 * </pre>
 *
 * @scope    protected instance method
 * @return   The record's UUID, as a string, wrapped in quotes.
 */
orp.model.Record.prototype._getUuidInQuotes = function() {
	if (!this._uuidInQuotes) {
		this._uuidInQuotes = '"' + this._uuid.toString() + '"';
	}
	return this._uuidInQuotes;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
