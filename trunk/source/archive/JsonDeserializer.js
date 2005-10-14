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
dojo.require("orp.archive.JsonFormat");
dojo.require("orp.archive.TextEncoding");
dojo.require("orp.archive.ArchiveLoader");
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
 * @param    archiveLoader    The orp.archive.ArchiveLoader instance that this serializer is working for.
 */
orp.archive.JsonDeserializer = function(archiveLoader) {
  orp.archive.JsonFormat.call(this);
  this._archiveLoader = archiveLoader;
};

dojo.inherits(orp.archive.JsonDeserializer, orp.archive.JsonFormat);  // makes JsonDeserializer be a subclass of JsonFormat


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
  
  // See the _rehydrateRecords() method for a note on what "dehydratedRecords" means.
  var dehydratedRecords = null;
  dehydratedRecords = eval("(" + jsonString + ")");
  
  orp.lang.assertType(dehydratedRecords, Object);
  var recordFormat = dehydratedRecords[orp.archive.JsonFormat.JSON_MEMBER.FORMAT];
  orp.lang.assert(recordFormat == orp.archive.JsonFormat.FILE_FORMAT.FORMAT_2005_JUNE_CHRONOLOGICAL_LIST);
  var listOfRecords = dehydratedRecords[orp.archive.JsonFormat.JSON_MEMBER.RECORDS];
  orp.lang.assertType(listOfRecords, Array);
  
  this._rehydrateRecords(listOfRecords);
};


// -------------------------------------------------------------------
// Private methods
// -------------------------------------------------------------------

/**
 * Returns the archiveLoader object we were provided with in our constructor.
 *
 * @scope    private instance method
 * @return   The archiveLoader object we were given in our constructor.
 */
orp.archive.JsonDeserializer.prototype._getArchiveLoader = function() {
  return this._archiveLoader;
};


/**
 * Given a dehydrated list of records, rehydrates each of the records.
 *
 * A note on terminology: For the time being, we're using the term "dehydrated" 
 * to refer to records in an itermediate stage of the deserialization process.
 * When the records are represented as a text string, either in memory or
 * in a file, we say that the records have been "serialized".  When the
 * records are represented as instances of orp.model.Record (and its 
 * subclasses, like orp.model.Item and orp.model.Entry), we say that the
 * records have been completely "deserialized" or "revived".  Between the two 
 * stages, the records pass through a "dehydrated" state, where they are 
 * represented as "anonymous JavaScript objects".  
 * 
 * For example:
 * <pre>
 *   serializedBox = "({length: 4, width: 5})";
 *   dehydratedBox = eval(serializedBox);
 *   revivedBox = new orp.model.Box(dehydratedBox.length, dehydratedBox.width);
 * </pre>
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
  var JSON_MEMBER = orp.archive.JsonFormat.JSON_MEMBER;
  var archiveLoader = this._getArchiveLoader();
  var world = archiveLoader.getWorld();

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
        item = archiveLoader.getItemFromUuidOrBootstrapItem(itemUuid);
        archiveLoader.addRecordToChronologicalList(item);
      }
      
      if (dehydratedUser) {
        var userUuid = dehydratedUser[JSON_MEMBER.USER];
        var userPasswordHash = dehydratedUser[JSON_MEMBER.PASSWORD];
        var user = archiveLoader.getItemFromUuidOrBootstrapItem(userUuid);
        archiveLoader.addUserToListOfUsers(user, userPasswordHash);
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
        contentRecord = archiveLoader.getContentRecordFromUuid(contentRecordUuid);
        var vote = new orp.model.Vote(world, voteUuid, contentRecord, retainFlag);
        archiveLoader.addRecordToChronologicalList(vote);
      }
      
      if (dehydratedOrdinal) {
        var ordinalUuid = dehydratedOrdinal[JSON_MEMBER.UUID];
        var ordinalNumber = dehydratedOrdinal[JSON_MEMBER.ORDINAL_NUMBER];
        contentRecordUuid = dehydratedOrdinal[JSON_MEMBER.RECORD];
        contentRecord = archiveLoader.getContentRecordFromUuid(contentRecordUuid);
        var ordinal = new orp.model.Ordinal(world, ordinalUuid, contentRecord, ordinalNumber);
        archiveLoader.addRecordToChronologicalList(ordinal);
      }
      
      if (dehydratedEntry) {
        var entryUuid = dehydratedEntry[JSON_MEMBER.UUID];
        var entry = archiveLoader.getEntryFromUuidOrBootstrapEntry(entryUuid);
        var previousEntryUuid = dehydratedEntry[JSON_MEMBER.PREVIOUS_VALUE];
        var previousEntry = null;
        if (previousEntryUuid) {
          previousEntry = archiveLoader.getEntryFromUuidOrBootstrapEntry(previousEntryUuid);
        }
 
        var dataTypeUuid = dehydratedEntry[JSON_MEMBER.TYPE];
        var dataType = archiveLoader.getItemFromUuidOrBootstrapItem(dataTypeUuid);
        
        if (dataTypeUuid == orp.model.World.UUID.TYPE_CONNECTION) {
          var listOfItemUuids = dehydratedEntry[JSON_MEMBER.ITEM];
          var firstItemUuid = listOfItemUuids[0];
          var secondItemUuid = listOfItemUuids[1];
          var firstItem = archiveLoader.getItemFromUuidOrBootstrapItem(firstItemUuid);
          var secondItem = archiveLoader.getItemFromUuidOrBootstrapItem(secondItemUuid);

          var listOfAttributeUuids = dehydratedEntry[JSON_MEMBER.ATTRIBUTE];
          var firstAttributeUuid = listOfAttributeUuids[0];
          var secondAttributeUuid = listOfAttributeUuids[1];
          var firstAttribute = archiveLoader.getItemFromUuidOrBootstrapItem(firstAttributeUuid);
          var secondAttribute = archiveLoader.getItemFromUuidOrBootstrapItem(secondAttributeUuid);
          
          var FIXME_OCT_7_2005_EXPERIMENT = true;
          if (FIXME_OCT_7_2005_EXPERIMENT) {
            /* 
            if (entryUuid == "e3320eb0-0c70-11da-beea-000c414ce854") {
              alert("rehydrating Entry e3320eb0-0c70-11da-beea-000c414ce854");
              // alert("dataType: " + dataType.getDisplayString());
            }
            */
            entry._reviveConnection(firstItem, firstAttribute, secondItem, secondAttribute, previousEntry);
          } else {
            var pairOfItems = [firstItem, secondItem];
            var pairOfAttributes = [firstAttribute, secondAttribute];
            entry._revive(pairOfItems, pairOfAttributes, null, previousEntry, dataType);
          }
        } else {
          itemUuid = dehydratedEntry[JSON_MEMBER.ITEM];
          item = archiveLoader.getItemFromUuidOrBootstrapItem(itemUuid);
          var attributeUuid = dehydratedEntry[JSON_MEMBER.ATTRIBUTE];
          var attribute = null;
          if (attributeUuid) {
            attribute = archiveLoader.getItemFromUuidOrBootstrapItem(attributeUuid);
          } else {
            orp.lang.assert(false); // the attributeUuid should always be there
          }
          var rawData = dehydratedEntry[JSON_MEMBER.VALUE];
          var finalData = null;
          switch (dataTypeUuid) {
            case orp.model.World.UUID.TYPE_ITEM:
              finalData = archiveLoader.getItemFromUuidOrBootstrapItem(rawData);
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
          entry._revive(item, attribute, finalData, previousEntry, dataType);
        }
        archiveLoader.addRecordToChronologicalList(entry);
      }
      
    }
  }
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
