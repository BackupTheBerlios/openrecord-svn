/*****************************************************************************
 CsvParser.js
 
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
dojo.provide("orp.util.CsvParser");
dojo.require("dojo.lang.*");
dojo.require("orp.util.Util");
dojo.require("orp.lang.Lang");


// -------------------------------------------------------------------
// Dependencies, expressed in the syntax that JSLint understands:
/*global Util  */
// -------------------------------------------------------------------


/**
 * The CsvParser class knows how to read CSV input and parse it into
 * its component lines and fields.  "CSV" stands for Comma Separated 
 * Value.  For a quick overview of the CSV file format, see:
 *   http://www.creativyst.com/Doc/Articles/CSV/CSV01.htm
 *
 * @scope    public instance constructor
 */
orp.util.CsvParser = function() {
};


/**
 * Given a string containing CSV records, this method parses
 * the string and returns a data structure containing the parsed
 * content.  The data structure we return is an array of length
 * R, where R is the number of rows (lines) in the CSV data.  The 
 * return array contains one sub-array for each CSV line, and each 
 * sub-array contains C string values, where C is the number of 
 * columns in the CSV data.
 * 
 * For example, given this CSV string as input:
 * <pre>
 *   "Title, Year, Producer \n Alien, 1979, Ridley Scott \n Blade Runner, 1982, Ridley Scott"
 * </pre>
 * We will return this data structure:
 * <pre>
 *   [["Alien", "1979", "Ridley Scott"],  ["Blade Runner", "1982", "Ridley Scott"]]
 * </pre>
 *
 * @scope    public instance method
 * @param    csvData    A string containing CSV records. 
 * @return   Returns an array containing sub-arrays containing strings.
 */
orp.util.CsvParser.prototype.getStringValuesFromCsvData = function(csvData) {
  orp.lang.assertType(csvData, String);
  
  var lineEndingCharacters = new RegExp("\r\n|\n|\r");
  var leadingWhiteSpaceCharacters = new RegExp("^\\s+",'g');
  var trailingWhiteSpaceCharacters = new RegExp("\\s+$",'g');
  var doubleQuotes = new RegExp('""','g');
  var listOfOutputRecords = [];
  
  var listOfInputLines = csvData.split(lineEndingCharacters);
  var firstLine = true;
  for (var i in listOfInputLines) {
    var singleLine = listOfInputLines[i];
    if ((!firstLine) && (singleLine.length > 0)) {
      var listOfFields = singleLine.split(',');
      var j = 0;
      while (j < listOfFields.length) {
        var space_field_space = listOfFields[j];
        var field_space = space_field_space.replace(leadingWhiteSpaceCharacters, ''); // trim leading whitespace
        var field = field_space.replace(trailingWhiteSpaceCharacters, ''); // trim trailing whitespace
        var firstChar = field.charAt(0);
        var lastChar = field.charAt(field.length - 1);
        var secondToLastChar = field.charAt(field.length - 2);
        var thirdToLastChar = field.charAt(field.length - 3);
        if ((firstChar == '"') && 
            ((lastChar != '"') || 
             ((lastChar == '"') && (secondToLastChar == '"') && (thirdToLastChar != '"')) )) {
          if (j+1 === listOfFields.length) {
            alert("The last field in record " + i + " is corrupted:\n" + field);
            return null;
          }
          var nextField = listOfFields[j+1];
          listOfFields[j] = field_space + ',' + nextField;
          listOfFields.splice(j+1, 1); // delete element [j+1] from the list
        } else {
          if ((firstChar == '"') && (lastChar == '"')) {
            field = field.slice(1, (field.length - 1)); // trim the " characters off the ends
            field = field.replace(doubleQuotes, '"');   // replace "" with "
          }
          listOfFields[j] = field;
          j += 1;
        }
      }
      listOfOutputRecords.push(listOfFields);
    }
    firstLine = false;
  }
  return listOfOutputRecords;
};


// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------
