# APIContactImporter

CSV bulk contact importer for inserting CRM records into a Brightpearl account. Capable of uploading ~1000 contacts 
per minute.

In addition to the usual validation performed by the Brightpearl API each contact MUST have a unique accountCode. Even 
though accountCode cannot be inserted via the API it is still needed to avoid duplicate uploads.

This is an NPM app tested only on Windows.

Setup:

+ Insert CSVs into /spreadsheets directory
+ Create a private app in you Brightpearl account
+ Open the /config/default.json file and insert your private app credentials
+ Adjust the column config in /config/default.json to map columns to address & contact fields. See API docs for field info.

Usage:

+ Trial run to verify config - npm run import
+ Push contacts to Brightpearl - npm run import push

+ See all uploaded IDs - npm run ids
+ See the ID for a given accountCode - npm run id {CODE}
+ Delete all imported accountCodes (for reupload) - npm run clear

+ Output a sample CSV file - node generate.js {MIN_CODE} {MAX_CODE}
