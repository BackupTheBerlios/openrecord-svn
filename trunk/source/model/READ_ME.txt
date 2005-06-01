================================================================
Data Model Framework
================================================================
 Copyright rights relinquished under the Creative Commons  
 Public Domain Dedication:
    http://creativecommons.org/licenses/publicdomain/
----------------------------------------------------------------

This directory, named "model", contains 8 or 10 JavaScript classes.  Together these JavaScript classes form the data model framework.  


---------------------------------
Terminology
---------------------------------
Here's a quick overview of the terminology and concepts...

Item -- items can have values assigned to their attributes
Entry -- a value that has been assigned to an attribute of an item
value -- the literal value held in an Entry, or a reference value held in an Entry

IdentifiedRecord -- the abstract superclass for Item and Entry
Ordinal -- keeps track of where an IdentifiedRecord should appear in a list
Vote -- keeps track of who thinks an IdentifiedRecord should be replaced/deleted
Record -- an Item, Value, Ordinal, or Vote -- things that have to be recorded

World -- a set of items, like the "OpenAgenda" world or the "CoolChaser" world
Server -- server-side code to run queries and deliver items to the browser
VirtualServer -- client-side proxy, by which a World talks to a Server
StubVirtualServer -- a simple VirtualServer which doesn't even talk to a Server
DeltaVirtualServer -- a VirtualServer that transfers changed data in incremental deltas


---------------------------------
Client API
---------------------------------
Here's a quick overview of the Data Model API that's available for people who are writing view code which allows users to view and edit items.

Item methods --------------------

  item.addEntryForAttribute() 
  item.addEntry()
  item.replaceEntry()
  item.replaceEntryWithEntryForAttribute()
  
  item.getAttributes()
  item.getEntriesForAttribute()
  item.getEntries()
  
  item.getDisplayName()
  item.getNameEntries()
  item.getShortNameEntries()
  
  item.isInCategory()
  item.reorderBetween()
  
  item.hasBeenDeleted()
  item.voteToDelete()
  item.voteToRetain()
  
  item.addObserver()
  item.removeObserver()

  
Entry methods ------------------- 

  entry.getValue()
  entry.getAttribute()
  entry.getItem()
  entry.getDisplayString()

  entry.reorderBetween()

  entry.hasBeenReplaced()
  entry.getPreviousEntry()
  entry.hasBeenDeleted()

  entry.voteToDelete()
  entry.voteToRetain()

  
World methods ------------------- 

  world.login()
  world.logout()
  
  world.getUsers()
  world.getCurrentUser()
  world.newUser()
  
  world.newItem()
  world.newAttribute()
  world.newCategory()
  world.newQueryForItemsByCategory()
  world.newQueryForSpecificItems()
  
  world.getItemsInCategory()
  world.getResultItemsForQuery() 
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
  
Category ----- examples: "Book", "Movie", "Person"
  Tag
  
Entry ----- example: ("1938" is the value of the attribute "Publication Date" for the item "The Hobbit")
  Assignment
  Datum
  AttributeValue
  Aspect
  
Value ----- example: "1938"
  Data
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
  Assignment
  Aspect
  Datum
  Entry
  Version
  Revision
  Corpus
 
