/*****************************************************************************
 UtilTest.js
 
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
 
var UtilTestVars = null;

function setUp() {
  UtilTestVars = {};
  UtilTestVars.theHobbit = "The Hobbit";
}

function testSimplestCase() {
  assertTrue("This is true", true);
}

function testTypeCheckingMethods() {
  assertTrue('"The Hobbit" is a string', Util.isString("The Hobbit"));
  assertFalse('"The Hobbit" is not a number', Util.isNumber("The Hobbit"));
  assertFalse('"The Hobbit" is not numeric', Util.isNumeric("The Hobbit"));
  assertFalse('"The Hobbit" is not a boolean', Util.isBoolean("The Hobbit"));
  assertFalse('"The Hobbit" is not an object', Util.isObject("The Hobbit"));
  assertFalse('"The Hobbit" is not an array', Util.isArray("The Hobbit"));
  assertFalse('"The Hobbit" is not a hash table', Util.isHashTable("The Hobbit"));
}

function testMethodsThatOperateOnSets() {
  var aTinySet = [];
  var theHobbit = UtilTestVars.theHobbit;
  assertFalse('"The Hobbit" is not in an empty set', Util.isObjectInSet(theHobbit, aTinySet));
  assertTrue('"The Hobbit" can be added to an empty set', Util.addObjectToSet(theHobbit, aTinySet));
  assertTrue('"The Hobbit" is in the set after being added', Util.isObjectInSet(theHobbit, aTinySet));
  assertTrue('"The Hobbit" can be removed from a set it is in', Util.removeObjectFromSet(theHobbit, aTinySet));
  assertFalse('"The Hobbit" is no longer in a set it was removed from', Util.isObjectInSet(theHobbit, aTinySet));
  assertFalse('"The Hobbit" can not be removed twice', Util.removeObjectFromSet(theHobbit, aTinySet));

  var setNumber2 = [123, "456", 78.9, new Date(), theHobbit];
  assertTrue('"The Hobbit" is in setNumber2', Util.isObjectInSet(theHobbit, setNumber2));
  assertTrue('78.9 is in setNumber2', Util.isObjectInSet(78.9, setNumber2));
  assertTrue('78.9 and "The Hobbit" is in setNumber2', Util.areObjectsInSet([78.9, theHobbit], setNumber2));
  assertTrue('All members of setNumber2 are in setNumber2', Util.areObjectsInSet(setNumber2, setNumber2));
  
}

function testEncryptionMethods() {
  var longString = "When in the course of human events: d41d8cd98f00b204e9800998ecf8427e";
  assertTrue('md5 of "" is correct', (Util.hex_md5("") == "d41d8cd98f00b204e9800998ecf8427e"));
  assertTrue('md5 of "iggy" is correct', (Util.hex_md5("iggy") == "0e026f55a72c0861a93e750c2a5427b1"));
  assertTrue('md5 of longString is correct', (Util.hex_md5(longString) == "4d694e03af399831c6f0c1f1bcc2fc93"));
}

function testGet64bitArrayFromFloat() {
  var x = Math.pow(2, 63) + Math.pow(2, 15);
  var result = Uuid._get64bitArrayFromFloat(x);
  assertTrue("result[0] == 0x8000", result[0] === 0x8000);
  assertTrue("result[1] == 0x0000", result[1] === 0x0000);
  assertTrue("result[2] == 0x0000", result[2] === 0x0000);
  assertTrue("result[3] == 0x8000", result[3] === 0x8000);
  
  var date = new Date();
  x = date.valueOf();
  result = Uuid._get64bitArrayFromFloat(x);
  var reconstructedFloat = result[0];
  reconstructedFloat *= 0x10000;
  reconstructedFloat += result[1];
  reconstructedFloat *= 0x10000;
  reconstructedFloat += result[2];
  reconstructedFloat *= 0x10000;
  reconstructedFloat += result[3];
  
  assertTrue("reconstructedFloat === x", reconstructedFloat === x);
}

function testAddTwo64bitArrays() {
  var a = [0x0000, 0x0000, 0x0000, 0x0001];
  var b = [0x0FFF, 0xFFFF, 0xFFFF, 0xFFFF];
  var result = Uuid._addTwo64bitArrays(a, b);
  assert(result[0] === 0x1000);
  assert(result[1] === 0x0000);
  assert(result[2] === 0x0000);
  assert(result[3] === 0x0000);
  
  a = [0x4000, 0x8000, 0x8000, 0x8000];
  b = [0x8000, 0x8000, 0x8000, 0x8000];
  result = Uuid._addTwo64bitArrays(a, b);
  assert(result[0] === 0xC001);
  assert(result[1] === 0x0001);
  assert(result[2] === 0x0001);
  assert(result[3] === 0x0000);
  
  a = [7, 6, 2, 5];
  b = [1, 0, 3, 4];
  result = Uuid._addTwo64bitArrays(a, b);
  assert(result[0] === 8);
  assert(result[1] === 6);
  assert(result[2] === 5);
  assert(result[3] === 9);  
}  

function testMultiplyTwo64bitArrays() {
  var a = [     0, 0x0000, 0x0000, 0x0003];
  var b = [0x1111, 0x1234, 0x0000, 0xFFFF];
  var result = Uuid._multiplyTwo64bitArrays(a, b);
  assert(result[0] === 0x3333);
  assert(result[1] === 0x369C);
  assert(result[2] === 0x0002);
  assert(result[3] === 0xFFFD);
  
  a = [0, 0, 0, 5];
  b = [0, 0, 0, 4];
  result = Uuid._multiplyTwo64bitArrays(a, b);
  assert(result[0] === 0);
  assert(result[1] === 0);
  assert(result[2] === 0);
  assert(result[3] === 20);  
  
  a = [0, 0, 2, 5];
  b = [0, 0, 3, 4];
  result = Uuid._multiplyTwo64bitArrays(a, b);
  assert(result[0] === 0);
  assert(result[1] === 6);
  assert(result[2] === 23);
  assert(result[3] === 20);  
}  

function subtestOnUuid(uuid) {
  assertTrue('UUIDs have 36 characters', (uuid.length == 36));

  var validCharacters = "0123456789abcedfABCDEF-";
  var character;
  var position;
  for (var i = 0; i < 36; ++i) {
    character = uuid.charAt(i);
    position = validCharacters.indexOf(character);
    assertTrue('UUIDs have only valid characters', (position != -1));
  }
  
  var arrayOfParts = uuid.split("-");
  assertTrue('UUIDs have 5 sections separated by 4 hyphens', (arrayOfParts.length == 5));
  assertTrue('Section 0 has 8 characters', (arrayOfParts[0].length == 8));
  assertTrue('Section 1 has 4 characters', (arrayOfParts[1].length == 4));
  assertTrue('Section 2 has 4 characters', (arrayOfParts[2].length == 4));
  assertTrue('Section 3 has 4 characters', (arrayOfParts[3].length == 4));
  assertTrue('Section 4 has 8 characters', (arrayOfParts[4].length == 12));
  
  var section3 = arrayOfParts[3];
  var hex3 = parseInt(section3, Uuid.HEX_RADIX);
  var binaryString = hex3.toString(2);
  // alert("section3 = " + section3 + "\n binaryString = " + binaryString);
  assertTrue('section 3 has 16 bits', binaryString.length == 16);
  assertTrue("first bit of section 3 is 1", binaryString.charAt(0) == '1');
  assertTrue("second bit of section 3 is 0", binaryString.charAt(1) == '0');
  
}

function testMethodsForWorkingWithRandomUuids() {
  var uuid1 = Uuid.generateRandomUuid();
  var uuid2 = Uuid.generateRandomUuid();
  // alert(uuid1 + "\n" + uuid2);
  subtestOnUuid(uuid1);
  subtestOnUuid(uuid2);
  
  var arrayOfParts = uuid1.split("-");
  var section2 = arrayOfParts[2];
  assertTrue('Section 2 starts with a 4', (section2.charAt(0) == "4"));
  
  assertTrue("uuid1 != uuid2", uuid1 != uuid2);
}

function testMethodsForWorkingWithTimeBasedUuids() {
  var uuid1 = Uuid.generateTimeBasedUuid();
  var uuid2 = Uuid.generateTimeBasedUuid();
  var uuid3 = Uuid.generateTimeBasedUuid();
  
  subtestOnUuid(uuid1);
  subtestOnUuid(uuid2);
  subtestOnUuid(uuid3);

  assertTrue("uuid1 != uuid2", uuid1 != uuid2);
  assertTrue("uuid2 != uuid3", uuid1 != uuid2);
  
  var arrayOfParts = uuid1.split("-");
  var section2 = arrayOfParts[2];
  assertTrue('Section 2 starts with a 1', (section2.charAt(0) == "1"));  

  var section4 = arrayOfParts[4];
  var firstChar = section4.charAt(0);
  var hexFirstChar = parseInt(firstChar, Uuid.HEX_RADIX);
  binaryString = hexFirstChar.toString(2);
  var firstBit;
  if (binaryString.length == 4) {
    firstBit = binaryString.charAt(0);
  } else {
    firstBit = '0';
  }
  // alert("firstChar = " + firstChar + "\n as number = " + hexFirstChar + 
  //      "\n in binary = " + binaryString + "\n first bit = " + firstBit);
  assertTrue("first bit of section 4 is 1", firstBit == '1');

  var uuid4 = Uuid.generateTimeBasedUuid("123456789ABC");
  subtestOnUuid(uuid4);
  arrayOfParts = uuid4.split("-");
  section4 = arrayOfParts[4];
  assertTrue('Section 4 = pseudoNode input', section4 == "123456789ABC");

  /* 
  // Old code that Brian wrote to try to get a sense of how
  // many UUIDs we can create in a single millisecond 
  var array = [];
  var now = new Date();
  var then = new Date();
  while (now.valueOf() == then.valueOf()) {
    then = new Date();
  }
  array.push(Uuid.generateTimeBasedUuid());
  array.push(Uuid.generateTimeBasedUuid());
  array.push(Uuid.generateTimeBasedUuid());
  array.push(Uuid.generateTimeBasedUuid());
  array.push(Uuid.generateTimeBasedUuid());
  array.push(Uuid.generateTimeBasedUuid());
  array.push(Uuid.generateTimeBasedUuid());
  array.push(Uuid.generateTimeBasedUuid());
  array.push(Uuid.generateTimeBasedUuid());
  array.push(Uuid.generateTimeBasedUuid());
  array.push(Uuid.generateTimeBasedUuid());
  array.push(Uuid.generateTimeBasedUuid());
  array.push(Uuid.generateTimeBasedUuid());
  array.push(Uuid.generateTimeBasedUuid());
  array.push(Uuid.generateTimeBasedUuid());
  array.push(Uuid.generateTimeBasedUuid());
  array.push(Uuid.generateTimeBasedUuid());
  array.push(Uuid.generateTimeBasedUuid());
  array.push(Uuid.generateTimeBasedUuid());
  array.push(Uuid.generateTimeBasedUuid());
  array.push(Uuid.generateTimeBasedUuid());
  array.push(Uuid.generateTimeBasedUuid());
  array.push(Uuid.generateTimeBasedUuid());
  array.push(Uuid.generateTimeBasedUuid());
  alert(array[0] + "\n" + 
        array[1] + "\n" + 
        array[2] + "\n" + 
        array[3] + "\n" + 
        array[4] + "\n" + 
        array[5] + "\n" + 
        array[6] + "\n" + 
        array[7] + "\n" + 
        array[8] + "\n" + 
        array[9] + "\n" + 
        array[10] + "\n" + 
        array[11] + "\n" + 
        array[12] + "\n" + 
        array[13] + "\n" + 
        array[14] + "\n" + 
        array[15] + "\n" + 
        array[16] + "\n" + 
        array[17] + "\n" + 
        array[18] + "\n" + 
        array[19] + "\n");
  */
}

function tearDown() {
  test = null;
}

// -------------------------------------------------------------------
// End of file
// -------------------------------------------------------------------