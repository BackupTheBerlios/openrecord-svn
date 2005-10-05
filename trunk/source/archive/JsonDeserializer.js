/*****************************************************************************
 JsonDeserializer.js
 
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
dojo.provide("orp.archive.JsonDeserializer");
dojo.require("orp.archive.TextEncoding");
dojo.require("orp.archive.StubArchive");      // FIXME: we should try to remove this dependency
dojo.require("orp.archive.Bootstrapper");
dojo.require("orp.util.DateValue");
dojo.require("orp.lang.Lang");


// -------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------
/**
 * The JsonDeserializer class knows how to take a JSON string 
 * representing data model records and deserialize them back into 
 * records in the in-memory model.  The service that the 
 * JsonDeserializer class provides the inverse of what the 
 * JsonSerializer class provides.
 *
 * @scope    public instance constructor
 * @param    bootstrapper    The orp.archive.StubArchive instance that this serializer is working for.
 */
orp.archive.JsonDeserializer = function(bootstrapper) {
  this._bootstrapper = bootstrapper;
};


// -------------------------------------------------------------------
// Public methods
// -------------------------------------------------------------------

/**
 * Given a JSON string containing a serialized representation of data
 * model records, this method reads the string and creates corresponding
 * records.
 *
 * @scope    private instance method
 * @param    jsonString    A JSON string containing serialized records. 
 */
orp.archive.JsonDeserializer.prototype.deserializeFromString = function(jsonString) {
  var dehydratedRecords = null;
  dehydratedRecords = eval("(" + jsonString + ")");
  
  orp.lang.assertType(dehydratedRecords, Object);
  var recordFormat = dehydratedRecords[orp.archive.StubArchive.JSON_MEMBER.FORMAT];
  orp.lang.assert(recordFormat == orp.archive.StubArchive.JSON_FORMAT.FORMAT_2005_JUNE_CHRONOLOGICAL_LIST);
  var listOfRecords = dehydratedRecords[orp.archive.StubArchive.JSON_MEMBER.RECORDS];
  orp.lang.assertType(listOfRecords, Array);
  
  this._rehydrateRecords(listOfRecords);
};


// -------------------------------------------------------------------
// Private methods
// -------------------------------------------------------------------

/**
 * Returns the bootstrapper object we were provided with in our constructor.
 *
 * @scope    private instance method
 * @return   The bootstrapper object we were given in our constructor.
 */
orp.archive.JsonDeserializer.prototype._getBootstrapper = function() {
  return this._bootstrapper;
};


/**
 * Given a dehydrated list of records, rehydrates each of the records.
 *
 * @scope    private instance method
 * @param    listOfDehydratedRecords    A list of dehydrated records. 
 */
orp.archive.JsonDeserializer.prototype._rehydrateRecords = function(listOfDehydratedRecords) {
  var key;
  var itemUuid;
  var item;
  var contentRecordUuid;
  var contentRecord;
  var JSON_MEMBER = orp.archive.StubArchive.JSON_MEMBER;
  var bootstrapper = this._getBootstrapper();
  var world = bootstrapper.getWorld();

  for (key in listOfDehydratedRecords) {
    var dehydratedRecord = listOfDehydratedRecords[key];

    var dehydratedTransaction = dehydratedRecord[JSON_MEMBER.TRANSACTION_CLASS];
    if (dehydratedTransaction) {
      var listOfRecordsInTransaction = dehydratedTransaction;
      this._rehydrateRecords(listOfRecordsInTransaction);
    } else {
      var dehydratedItem = dehydratedRecord[JSON_MEMBER.ITEM_CLASS];
      var dehydratedUser = dehydratedRecord[JSON_MEMBER.USER_CLASS];
      var dehydratedVote = dehydratedRecord[JSON_MEMBER.VOTE_CLASS];
      var dehydratedOrdinal = dehydratedRecord[JSON_MEMBER.ORDINAL_CLASS];
      var dehydratedEntry = dehydratedRecord[JSON_MEMBER.ENTRY_CLASS];
        
      if (dehydratedItem) {
        itemUuid = dehydratedItem[JSON_MEMBER.UUID];
        item = bootstrapper.getItemFromUuidOrBootstrapItem(itemUuid);
        bootstrapper.addRecordToChronologicalList(item);
      }
      
      if (dehydratedUser) {
        var userUuid = dehydratedUser[JSON_MEMBER.USER];
        var userPasswordHash = dehydratedUser[JSON_MEMBER.PASSWORD];
        var user = bootstrapper.getItemFromUuidOrBootstrapItem(userUuid);
        bootstrapper.addUserToListOfUsers(user, userPasswordHash);
      }
      
      if (dehydratedVote) {
        var voteUuid = dehydratedVote[JSON_MEMBER.UUID];
        var retainFlagString = dehydratedVote[JSON_MEMBER.RETAIN_FLAG];
        var retainFlag = null;
        if (retainFlagString == "true") {
          retainFlag = true;
        }
        if (retainFlagString == "false") {
          retainFlag = false;
        }
        orp.lang.assert(retainFlag !== null);
        contentRecordUuid = dehydratedVote[JSON_MEMBER.RECORD];
        contentRecord = bootstrapper.getContentRecordFromUuid(contentRecordUuid);
        var vote = new orp.model.Vote(world, voteUuid, contentRecord, retainFlag);
        bootstrapper.addRecordToChronologicalList(vote);
      }
      
      if (dehydratedOrdinal) {
        var ordinalUuid = dehydratedOrdinal[JSON_MEMBER.UUID];
        var ordinalNumber = dehydratedOrdinal[JSON_MEMBER.ORDINAL_NUMBER];
        contentRecordUuid = dehydratedOrdinal[JSON_MEMBER.RECORD];
        contentRecord = bootstrapper.getContentRecordFromUuid(contentRecordUuid);
        var ordinal = new orp.model.Ordinal(world, ordinalUuid, contentRecord, ordinalNumber);
        bootstrapper.addRecordToChronologicalList(ordinal);
      }
      
      if (dehydratedEntry) {
        var entryUuid = dehydratedEntry[JSON_MEMBER.UUID];
        var entry = bootstrapper.getEntryFromUuidOrBootstrapEntry(entryUuid);
        var previousEntryUuid = dehydratedEntry[JSON_MEMBER.PREVIOUS_VALUE];
        var previousEntry = null;
        if (previousEntryUuid) {
          previousEntry = bootstrapper.getEntryFromUuidOrBootstrapEntry(previousEntryUuid);
        }
 
        var dataTypeUuid = dehydratedEntry[JSON_MEMBER.TYPE];
        var dataType = bootstrapper.getItemFromUuidOrBootstrapItem(dataTypeUuid);
        
        if (dataTypeUuid == orp.model.World.UUID.TYPE_CONNECTION) {
          var listOfItemUuids = dehydratedEntry[JSON_MEMBER.ITEM];
          var firstItemUuid = listOfItemUuids[0];
          var secondItemUuid = listOfItemUuids[1];
          var firstItem = bootstrapper.getItemFromUuidOrBootstrapItem(firstItemUuid);
          var secondItem = bootstrapper.getItemFromUuidOrBootstrapItem(secondItemUuid);

          var listOfAttributeUuids = dehydratedEntry[JSON_MEMBER.ATTRIBUTE];
          var firstAttributeUuid = listOfAttributeUuids[0];
          var secondAttributeUuid = listOfAttributeUuids[1];
          var firstAttribute = bootstrapper.getItemFromUuidOrBootstrapItem(firstAttributeUuid);
          var secondAttribute = bootstrapper.getItemFromUuidOrBootstrapItem(secondAttributeUuid);
          
          var pairOfItems = [firstItem, secondItem];
          var pairOfAttributes = [firstAttribute, secondAttribute];
          entry._rehydrate(pairOfItems, pairOfAttributes, null, previousEntry, dataType);
        } else {
          itemUuid = dehydratedEntry[JSON_MEMBER.ITEM];
          item = bootstrapper.getItemFromUuidOrBootstrapItem(itemUuid);
          var attributeUuid = dehydratedEntry[JSON_MEMBER.ATTRIBUTE];
          var attribute = null;
          if (attributeUuid) {
            attribute = bootstrapper.getItemFromUuidOrBootstrapItem(attributeUuid);
          } else {
            orp.lang.assert(false); // the attributeUuid should always be there
          }
          var rawData = dehydratedEntry[JSON_MEMBER.VALUE];
          var finalData = null;
          switch (dataTypeUuid) {
            case orp.model.World.UUID.TYPE_ITEM:
              finalData = bootstrapper.getItemFromUuidOrBootstrapItem(rawData);
              break;
            case orp.model.World.UUID.TYPE_TEXT:
              finalData = orp.archive.TextEncoding.decodeText(rawData);
              break;
            case orp.model.World.UUID.TYPE_NUMBER:
              finalData = parseFloat(rawData);
              break;
            case orp.model.World.UUID.TYPE_DATE:
              finalData = new orp.util.DateValue(rawData);
              // if (!finalData.isValid()) {
              //   alert(rawData + " " + finalData);
              // }
              orp.lang.assert(finalData.isValid());
              break;
            default:
              orp.lang.assert(false, 'Unknown data type while _rehydrating()');
          }
          entry._rehydrate(item, attribute, finalData, previousEntry, dataType);
        }
        bootstrapper.addRecordToChronologicalList(entry);
      }
      
    }
  }
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
