/*****************************************************************************
 TimingTest.js
 
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

// Results from running this test circa Sept 2005, using Brian's Dell Inspiron 9300:
//  0   microseconds for EMPTY_LOOP
//  6.0 microseconds for ARRAY_CREATION
//  4.4 microseconds for OBJECT_CREATION
//  4.3 microseconds for OBJECT_CREATION_WITH_STRINGS
//  2.9 microseconds for DATE_CREATION
//  1.3 microseconds for METHOD_CALL
//  1.1 microseconds for GLOBAL_VARIABLE_LOOKUP
//  0.7 microseconds for DATE_VALUEOF
//  7.5 microseconds for TEST_TYPE_ONE_BOX
//  5.9 microseconds for TEST_TYPE_TWO_BOX

// Results from running this test circa May 2005, using Brian's Dell Dimension 4600:
//  0   microseconds for EMPTY_LOOP
// 16   microseconds for ARRAY_CREATION
// 15   microseconds for OBJECT_CREATION
// 14   microseconds for OBJECT_CREATION_WITH_STRINGS
// 11   microseconds for DATE_CREATION
//  2.3 microseconds for METHOD_CALL
//  1.3 microseconds for GLOBAL_VARIABLE_LOOKUP
//  1.2 microseconds for DATE_VALUEOF
// 16    microseconds for ENTRY_COMPAREORDINALS

// Results from a different test program circa May 2005, using Brian's Dell Dimension 4600:
//  0.78 microseconds to create a new Array:   var a = [x, y];
//  0.59 microseconds to create a new Object:  var o = {here: x, there: y};
//  0.59 microseconds to create a new Object:  var o = {"here": x, "there": y};
//  0.49 microseconds to create a new Date:    var d = new Date();
//  0.18 microseconds to call a global method: noop();
//  0.15 microseconds to look up a global:     ModelTestVars = null;
//  0.06 microseconds to call Date.valueOf:    var foo = now.valueOf();
//  0.88 microseconds to call compareOrdinals: var foo = Entry.compareOrdinals(e1, e2);

var TEST_EMPTY_LOOP = "EMPTY_LOOP";
var TEST_ARRAY_CREATION = "ARRAY_CREATION";
var TEST_OBJECT_CREATION = "OBJECT_CREATION";
var TEST_OBJECT_CREATION_WITH_STRINGS = "OBJECT_CREATION_WITH_STRINGS";
var TEST_DATE_CREATION = "DATE_CREATION";
var TEST_METHOD_CALL = "METHOD_CALL";
var TEST_GLOBAL_VARIABLE_LOOKUP = "GLOBAL_VARIABLE_LOOKUP";
var TEST_DATE_VALUEOF = "DATE_VALUEOF";
// var TEST_ENTRY_COMPAREORDINALS = "ENTRY_COMPAREORDINALS";
var TEST_TYPE_ONE_BOX = "TYPE_ONE_BOX";
var TEST_TYPE_TWO_BOX = "TYPE_TWO_BOX";

// -------------------------------------------------------------------
// setUp and tearDown
// -------------------------------------------------------------------

function setUp() {
  dojo.hostenv.setModulePrefix("dojo", "../../../dojo/dojo-rev1759/src");
  dojo.hostenv.setModulePrefix("orp", "../../../../source");
  dojo.require("orp.util.Util");
}

function tearDown() {
}

// -------------------------------------------------------------------
// Test functions
// -------------------------------------------------------------------

function testTimes() {
  var testName;
  var hashTableOfOperationsPerMillisecondKeyedByTestName = {};
  hashTableOfOperationsPerMillisecondKeyedByTestName[TEST_EMPTY_LOOP] = null;
  hashTableOfOperationsPerMillisecondKeyedByTestName[TEST_ARRAY_CREATION] = null;
  hashTableOfOperationsPerMillisecondKeyedByTestName[TEST_OBJECT_CREATION] = null;
  hashTableOfOperationsPerMillisecondKeyedByTestName[TEST_OBJECT_CREATION_WITH_STRINGS] = null;
  hashTableOfOperationsPerMillisecondKeyedByTestName[TEST_DATE_CREATION] = null;
  hashTableOfOperationsPerMillisecondKeyedByTestName[TEST_METHOD_CALL] = null;
  hashTableOfOperationsPerMillisecondKeyedByTestName[TEST_GLOBAL_VARIABLE_LOOKUP] = null;
  hashTableOfOperationsPerMillisecondKeyedByTestName[TEST_DATE_VALUEOF] = null;
  // hashTableOfOperationsPerMillisecondKeyedByTestName[TEST_ENTRY_COMPAREORDINALS] = null;
  hashTableOfOperationsPerMillisecondKeyedByTestName[TEST_TYPE_ONE_BOX] = null;
  hashTableOfOperationsPerMillisecondKeyedByTestName[TEST_TYPE_TWO_BOX] = null;
  for (testName in hashTableOfOperationsPerMillisecondKeyedByTestName) {
    var opsPerMS = getOpsPerMS(testName);
    hashTableOfOperationsPerMillisecondKeyedByTestName[testName] = opsPerMS;
  }
  var resultMessage = "";
  for (testName in hashTableOfOperationsPerMillisecondKeyedByTestName) {
    var opsPerMS = hashTableOfOperationsPerMillisecondKeyedByTestName[testName];
    var emptyLoopsPerMS = hashTableOfOperationsPerMillisecondKeyedByTestName[TEST_EMPTY_LOOP];
    var microSecondsPerEmptyLoop = 1000 / emptyLoopsPerMS;
    var microSecondsPerOperationGross = 1000 / opsPerMS;
    var microSecondsPerOperationNet = microSecondsPerOperationGross - microSecondsPerEmptyLoop;
    resultMessage += microSecondsPerOperationNet.toFixed(1) + " microseconds for " + testName + "\n";
  }
  
  alert(resultMessage);
}

function noop() {
  return 0;
}

function getOpsPerMS(inTestName) {

  var numberOfMillisecondsWorthOfTrials = 500;
  var operationsPerForLoopIteration = 10;
  var numberOfForLoopIterations = 5;
  var operationsPerWhileLoopIteration = numberOfForLoopIterations * operationsPerForLoopIteration;
  var totalOperations = 0;
  
/*
  if (inTestName == TEST_ENTRY_COMPAREORDINALS) {
    var world = {};
    world.getCurrentUser = function () { return this; };
    var e1 = new orp.model.Entry();
    var e2 = new orp.model.Entry();
    e1._Entry(world, 1);
    e2._Entry(world, 2);
    e1._initializeEntry();
    e2._initializeEntry();
  }
*/
  var start = new Date();
  var startMS = start.valueOf();
  var nowMS = startMS;
  var i;
  var now;
  var foo;
  
  while (nowMS == startMS) {
    now = new Date();
    nowMS = now.valueOf();
  }
  
  startMS = nowMS;
  
  while ((nowMS - startMS) < numberOfMillisecondsWorthOfTrials) {
    if (inTestName == TEST_EMPTY_LOOP) {
      for (i = 0; i < numberOfForLoopIterations; i += 1) {
        // empty: do nothing
      }
    }
    if (inTestName == TEST_ARRAY_CREATION) {
      for (i = 0; i < numberOfForLoopIterations; i += 1) {
        foo = [nowMS, startMS];
        foo = [nowMS, startMS];
        foo = [nowMS, startMS];
        foo = [nowMS, startMS];
        foo = [nowMS, startMS];
        foo = [nowMS, startMS];
        foo = [nowMS, startMS];
        foo = [nowMS, startMS];
        foo = [nowMS, startMS];
        foo = [nowMS, startMS];
      }
    }
    if (inTestName == TEST_OBJECT_CREATION) {
      for (i = 0; i < numberOfForLoopIterations; i += 1) {
        foo = {now: nowMS, start: startMS};
        foo = {now: nowMS, start: startMS};
        foo = {now: nowMS, start: startMS};
        foo = {now: nowMS, start: startMS};
        foo = {now: nowMS, start: startMS};
        foo = {now: nowMS, start: startMS};
        foo = {now: nowMS, start: startMS};
        foo = {now: nowMS, start: startMS};
        foo = {now: nowMS, start: startMS};
        foo = {now: nowMS, start: startMS};
      }
    }
    if (inTestName == TEST_OBJECT_CREATION_WITH_STRINGS) {
      for (i = 0; i < numberOfForLoopIterations; i += 1) {
        foo = {"now": nowMS, "start": startMS};
        foo = {"now": nowMS, "start": startMS};
        foo = {"now": nowMS, "start": startMS};
        foo = {"now": nowMS, "start": startMS};
        foo = {"now": nowMS, "start": startMS};
        foo = {"now": nowMS, "start": startMS};
        foo = {"now": nowMS, "start": startMS};
        foo = {"now": nowMS, "start": startMS};
        foo = {"now": nowMS, "start": startMS};
        foo = {"now": nowMS, "start": startMS};
      }
    }
    if (inTestName == TEST_DATE_CREATION) {
      for (i = 0; i < numberOfForLoopIterations; i += 1) {
        foo = new Date();
        foo = new Date();
        foo = new Date();
        foo = new Date();
        foo = new Date();
        foo = new Date();
        foo = new Date();
        foo = new Date();
        foo = new Date();
        foo = new Date();
      }
    }
    if (inTestName == TEST_METHOD_CALL) {
      for (i = 0; i < numberOfForLoopIterations; i += 1) {
        foo = noop();
        foo = noop();
        foo = noop();
        foo = noop();
        foo = noop();
        foo = noop();
        foo = noop();
        foo = noop();
        foo = noop();
        foo = noop();
      }
    }
    if (inTestName == TEST_GLOBAL_VARIABLE_LOOKUP) {
      for (i = 0; i < numberOfForLoopIterations; i += 1) {
        foo = TEST_EMPTY_LOOP;
        foo = TEST_EMPTY_LOOP;
        foo = TEST_EMPTY_LOOP;
        foo = TEST_EMPTY_LOOP;
        foo = TEST_EMPTY_LOOP;
        foo = TEST_EMPTY_LOOP;
        foo = TEST_EMPTY_LOOP;
        foo = TEST_EMPTY_LOOP;
        foo = TEST_EMPTY_LOOP;
        foo = TEST_EMPTY_LOOP;
      }
    }
    if (inTestName == TEST_DATE_VALUEOF) {
      for (i = 0; i < numberOfForLoopIterations; i += 1) {
        foo = now.valueOf();
        foo = now.valueOf();
        foo = now.valueOf();
        foo = now.valueOf();
        foo = now.valueOf();
        foo = now.valueOf();
        foo = now.valueOf();
        foo = now.valueOf();
        foo = now.valueOf();
        foo = now.valueOf();
      }
    }
/*
    if (inTestName == TEST_ENTRY_COMPAREORDINALS) {
      for (i = 0; i < numberOfForLoopIterations; i += 1) {
        foo = Entry.compareOrdinals(e1, e2);
        foo = Entry.compareOrdinals(e1, e2);
        foo = Entry.compareOrdinals(e1, e2);
        foo = Entry.compareOrdinals(e1, e2);
        foo = Entry.compareOrdinals(e1, e2);
        foo = Entry.compareOrdinals(e1, e2);
        foo = Entry.compareOrdinals(e1, e2);
        foo = Entry.compareOrdinals(e1, e2);
        foo = Entry.compareOrdinals(e1, e2);
        foo = Entry.compareOrdinals(e1, e2);
      }
    }
 */
    if (inTestName == TEST_TYPE_ONE_BOX) {
      for (i = 0; i < numberOfForLoopIterations; i += 1) {
        foo = new shapes.TypeOneBox(10, 10);
        foo = new shapes.TypeOneBox(10, 10);
        foo = new shapes.TypeOneBox(10, 10);
        foo = new shapes.TypeOneBox(10, 10);
        foo = new shapes.TypeOneBox(10, 10);
        foo = new shapes.TypeOneBox(10, 10);
        foo = new shapes.TypeOneBox(10, 10);
        foo = new shapes.TypeOneBox(10, 10);
        foo = new shapes.TypeOneBox(10, 10);
        foo = new shapes.TypeOneBox(10, 10);
      }
    }
    if (inTestName == TEST_TYPE_TWO_BOX) {
      for (i = 0; i < numberOfForLoopIterations; i += 1) {
        foo = new shapes.TypeTwoBox(10, 10);
        foo = new shapes.TypeTwoBox(10, 10);
        foo = new shapes.TypeTwoBox(10, 10);
        foo = new shapes.TypeTwoBox(10, 10);
        foo = new shapes.TypeTwoBox(10, 10);
        foo = new shapes.TypeTwoBox(10, 10);
        foo = new shapes.TypeTwoBox(10, 10);
        foo = new shapes.TypeTwoBox(10, 10);
        foo = new shapes.TypeTwoBox(10, 10);
        foo = new shapes.TypeTwoBox(10, 10);
      }
    }
    now = new Date();
    nowMS = now.valueOf();
    totalOperations += operationsPerWhileLoopIteration;
  }
     
//  now = new Date();
//  nowMS = now.valueOf();   
//  var elapsedMS = nowMS - startMS;
//  var totalOperations = operationsPerForLoopIteration * numberOfForLoopIterations;
//  var operationsPerMillisecond = totalOperations / elapsedMS;

  var operationsPerMillisecond = totalOperations / numberOfMillisecondsWorthOfTrials;
  return operationsPerMillisecond;  
}

function testBoxConstruction() {
  var boxA = new shapes.TypeOneBox(10, 10);
  var boxB = new shapes.TypeOneBox(10, 10);
  assertTrue("'TypeOneBox' objects each have their own 'getValue' method", boxA.getArea != boxB.getArea);
  
  boxA = new shapes.TypeTwoBox(10, 10);
  boxB = new shapes.TypeTwoBox(10, 10);
  assertTrue("'TypeTwoBox' objects share a common 'getValue' method", boxA.getArea == boxB.getArea);
}

shapes = {
  TypeOneBox: function(width, height) {
    this._width = width;
    this._height = height;
    
    this.getArea = function() {
      // do some busy work
      var foo = [10];
      for (var i in foo) {
        var area = (this._width * this._height);
      }
      return area;
    }
  }
};

shapes.TypeTwoBox = function(width, height) {
  this._width = width;
  this._height = height;
};

shapes.TypeTwoBox.prototype.getArea = function() {
  // do some busy work
  var foo = [10];
  for (var i in foo) {
    var area = (this._width * this._height);
  }
  return area;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
