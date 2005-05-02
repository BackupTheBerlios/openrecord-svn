=================================
Experimental Data Model Framework
=================================

This directory, named "model", contains 8 or 10 JavaScript classes.  Together these JavaScript classes form an experimental data model framework.  

This isn't a finished product, just a sort of experimental prototype, or maybe an extreme programming "spike solution".  Right now this is still a work in progress.  The code doesn't run yet, it doesn't pass its unit tests, and it isn't as clean and tidy as I would like it to be.  But all the pieces are in place, and there's enough detail here to give you a good sense of what this solution would look like.


---------------------------------
Terminology
---------------------------------
Here's a quick overview of the terminology and concepts...

Item -- items have attribute values
Value -- an attribute value attached to an item
  
Entry -- the abstract superclass for Item and Value
Ordinal -- keeps track of where an Entry should appear in a list
Vote -- keeps track of who thinks an Entry should be replaced/deleted
Record -- an Item, Value, Ordinal, or Vote -- things that have to be recorded

World -- a set of items, like the "OpenAgenda" world or the "CoolChaser" world
Server -- server-side code to run queries and deliver items to the browser
VirtualServer -- client-side proxy, by which a World talks to a Server
StubVirtualServer -- a simple VirtualServer which doesn't even talk to a Server
BigLumpVirtualServer -- a simple VirtualServer that transfers data in big lumps


---------------------------------
Client API
---------------------------------
Here's a quick overview of the Data Model API that's available for people who are writing view code which allows users to view and edit items.

Item methods --------------------

  item.addAttributeValue()      --- change to .addEntryForAttribute() ?
  item.addValue()               --- change to .addEntry() ?
  item.replaceValue()           --- change to .replaceEntry() ?
  item.replaceValueWithAttributeValue()
  
  item.getAttributes()
  item.getValuesForAttribute()  --- change to .getEntriesForAttribute() ?
  item.getValues()              --- change to .getEntries() ?
  
  item.getDisplayName()
  item.getName()                --- change to .getNameEntries() ?
  item.getShortName()           --- change to .getShortNameEntries() ?
  
  item.isInCategory()
  item.reorderBetween()
  
  item.hasBeenDeleted()
  item.voteToDelete()
  item.voteToRetain()
  
  item.addObserver()
  item.removeObserver()

  
Value methods ------------------- 

  value.hasBeenReplaced()
  value.getPreviousValue()
  value.getAttribute()
  value.getItem()
  value.getContentData()

  
World methods ------------------- 

  world.login()
  world.logout()
  
  world.getUsers()
  world.getCurrentUser()       --- change to .getLoggedInUser() ?
  world.newUser()
  
  world.newItem()
  world.newAttribute()
  world.newCategory()
  world.newQueryForItemsByCategory()
  world.newQueryForSpecificItems()
  world.getListOfItemsInCategory()     --- change to getItemsInCategory() ?
  world.getListOfResultItemsForQuery() --- change to getResultItemsForQuery() ?
  world.setItemToBeIncludedInQueryResultList()
  world.removeListObserver()
  world.addItemObserver()
  world.removeItemObserver()
  
  world.beginTransaction()
  world.endTransaction()

  

---------------------------------
Alternative Terminology Ideas
---------------------------------
Item ----- example: a book called "The Hobbit"
  Object
  Record

Attribute ----- examples: "Author", "Publication Date"
  Property
  Aspect
  Field
  
Kind ----- deprecated
  Table
  Class
  
Value ----- example: "1938"
  Assignement
  Datum
  AttributeValue
  Aspect
  
Data ----- example: "1938"
  Value
  Datum

Relationship ----- example: "hobbit.author <--> tolkien.books"
  Item Reference
  Reference
  Link
  Connection
  Yoke
  Relation
  Bond
  Attachment
  Arrow

WatchList
  ListOfItems
  LiveList
  
ObservableQuery
  Query
  
World
  Corpus
  Archive
  
Spare words
  Axiom
  Axiomatic Item
  Assignement
  Aspect
  Datum
  Entry
  Version
  Revision
  Corpus
 
