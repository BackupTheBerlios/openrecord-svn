/*****************************************************************************
 CsvParserTest.js
 
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
 
var CsvData = null;


// -------------------------------------------------------------------
// setUp and tearDown
// -------------------------------------------------------------------

function setUp() {
  dojo.setModulePrefix("dojo", "../../dojo/src"); // relative to testRunner.html
  dojo.setModulePrefix("orp", "../../../source"); // relative to dojo.js
  dojo.require("dojo.lang.*");
  dojo.require("orp.util.CsvParser");

  var CsvRecords = ['Title, Year, Producer',
                    '2001: A Space Odyssey, 1968, Stanley Kubrick',
                    '"This is a ""fake"" movie title", 1957, Sidney Lumet',
                    'Alien, 1979, Ridley Scott  ',
                    '"The Sequel to ""Dances With Wolves.""", 1982, Ridley Scott',
                    '"Caine Mutiny, The", 1954, "Dymtryk ""the King"", Edward"',
                    '',
                    ''];
  CsvData = CsvRecords.join('\n');
}

function tearDown() {
  CsvData = null;
}


// -------------------------------------------------------------------
// Test functions
// -------------------------------------------------------------------

function testCsvParser() {
  var csvParser = new orp.util.CsvParser();
  var listOfRecords = csvParser.getStringValuesFromCsvData(CsvData);
  var whiteSpaceCharacters = " \t\n\r";
  
  assertTrue('CsvData has 5 lines', listOfRecords.length == 5);
  for (var i in listOfRecords) {
    var row = listOfRecords[i];
    assertTrue('Each row has 3 fields', row.length == 3);
    for (var j in row) {
      var field = row[j];
      assertTrue('Each field is a string', dojo.lang.isString(field));
      var firstChar = field.charAt(0);
      var lastChar = field.charAt(field.length - 1);
      assertTrue('The first character is not white space', whiteSpaceCharacters.indexOf(firstChar) == -1);
      assertTrue('The last character is not white space', whiteSpaceCharacters.indexOf(lastChar) == -1);
    };
  }
}

/*
function testShapesAccess() {
  dojo.hostenv.setModulePrefix("shapes", "../../../../source/shapes");
  
  dojo.require("shapes.Ship");
  var ship = new shapes.Ship();
  var box1 = new shapes.Box(4, 5); // area == 20
  var box2 = new shapes.Box(5, 6); // area == 30
  ship.addBox(box1);
  ship.addBox(box2);
  assertTrue("The ship has an area of 50.", ship.getArea() == 50);
}
*/


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
