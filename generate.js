var _ = require('lodash');

if (process.argv.length < 4) {
    console.error("Account code min & max arguments required");
    process.exit(1);
}

var min = parseInt(process.argv[2]);
var max = parseInt(process.argv[3]);

var salutations = ["Mr.", "Mrs.", "Miss.", "Ms.", "Dr.", "Sir.", "REV", ""];
var firstNames = ["Dave", "Fred", "Jenny", "Uma", "Primrose", "Eve", "Ruby",
    "Pete", "Lucy", "Nick", "Bob", "Bill", "Claire", "Jo", "Amy", "Vicky",
    "Yvonne", "Zara", "Wilbur", "Valerie", "Geoff", "Kirstin", "Sian", "Tom",
    "John", "Will", "Scott", "Henry", "Adam", "Chris", "Kornie", "Albert",
    "Mike", "James", "Andy", "Gary", "Steve", "Mary", "Annette", "Pippa",
    "Cara", "Sarah",  "Eva", "Danielle", "Justin", "Kieran", "Liam",
    "Patrick", "Shane", "William", "Patty", "Siaban", "Natalie", "Suzy",
    "Justine"];
var lastNames = ["Smith", "Jones", "Brown", "Davis", "Green", "Church", "Hastings",
    "Holding", "Lloyd", "Peters", "Jenkins", "Parkinson", "Mustard", "Wells",
    "Adams", "O'Shae", "Carrick", "Holmes", "Rogers", "Nelson", "Johnson", "Dixon",
    "Grant", "Mitchell", "Kingston", "Thomas", "Press", "Tanner", "Todd", "Cross"];
var organisations = [" Ltd", " Corp", " & Sons", " Supplies", " Inc", "GmbH",
    "'s Pizzas", "'s Wheels", " Stuff", " n Ting", " Garden Centre", " Booze", "",
    " Tools", " Books", " Fashion", " Wholesale", " Retail", " Exchange"];
var placeNames = ["New", "Good", "Queen", "Camel", "Square", "Green", "Happy",
    "North", "South", "East", "West", "River", "High", "Squire", "Meadow",
    "Hot", "Chip", "Wim", "Bourne", "Forest", "Tree", "Lower", "Victory",
    "Round", "Brick"];
var streets = [" St", " Street", " Road", " Rd", " Drive", " Lane"];
var suburbs = ["ton", "ville", " Market", "cliffe", " Forest", "don", "mouth",
    "mead", " Park", "ham"];
var cities = [" Town", " City"];
var states = ["shire"];
var countries = ["USA", "NZL", "PRT", "SAU", "MEX", "DEU"];

console.log('Code,Email address,Company,First name,Last name,Telephone,Telephone 2,Salutation,Mobile,Fax,Bank account,Bank sort,Bank name,Swift code,IBAN,Street,Suburb,City,State,Postcode,Country,Title,Status,Memo,Note text,Note date,Website,Owner,Email 2,Newsletter,Nominal code,Tax code,Credit limit,Credit days');

_.each(_.range(min, max), function(n){

    var choose = _.sample;

    var code = "CODE" + n;
    var salutation = choose(salutations);
    var firstName = choose(firstNames);
    var lastName = choose(lastNames);
    var email = (firstName + "." + lastName + "@email.com").toLowerCase();
    var company = choose([choose([choose(firstNames), choose(lastNames), choose(placeNames)]) + choose(organisations), ""]);
    var telephone = _.random(11111111, 99999999);
    var telephone2 = _.random(11111111, 99999999);
    var fax = _.random(11111111, 99999999);
    var website = company == "" ? "" : "https://www." + company.toLowerCase().replace(/[^\w]+/, '').replace(' ', '') + ".com";

    var street = _.random(1, 99) + " " + choose(placeNames) + choose(streets);
    var suburb = choose(placeNames) + choose(suburbs);
    var city = choose(placeNames) + choose(cities);
    var state = choose(placeNames) + choose(states);
    var postcode = city.substr(0, 2).toUpperCase() + _.random(1111, 9999);
    var country = choose(countries);

    var row = [];
    _.times(34, function(){
        row.push("");
    });

    // Code,Email address,Company,First name,Last name,
    // Telephone,Telephone 2,Salutation,Mobile,Fax,
    // Bank account,Bank sort,Bank name,Swift code,
    // IBAN,Street,Suburb,City,State,Postcode,Country,
    // Title,Status,Memo,Note text,Note date,Website,
    // Owner,Email 2,Newsletter,Nominal code,Tax code,Credit limit,Credit days

    row[0] = code;
    row[1] = email;
    row[2] = company;
    row[3] = firstName;
    row[4] = lastName;
    row[5] = telephone;
    row[6] = telephone2;
    row[7] = salutation;
    row[9] = fax;
    row[15] = street;
    row[16] = suburb;
    row[17] = city;
    row[18] = state;
    row[19] = postcode;
    row[20] = country;
    row[26] = website;

    var s = row.join(',');

    console.log(s);
});