const MongoClient = require('mongodb').MongoClient;
const http = require('http');
 
// Connection URL
const url = 'mongodb://localhost:27017';
 
// Database Name
const dbName = 'chef';
 
// Use connect method to connect to the server
MongoClient.connect(url, function(err, client) {
  console.log("Connected successfully to server");
 
  const db = client.db(dbName);

  db.collection('recipes', function(err, collection) {
    const server = http.createServer(function(req, res) {
        if (req.method === 'POST') {
            // Handle post info...
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString(); // convert Buffer to string
            });
            req.on('end', () => {
                try {
                    const jsonObj = JSON.parse(body);

                    if (jsonObj && typeof jsonObj === 'object') {
                        collection.insertOne(jsonObj, (err, resObj) => {
                            if (err) {
                                throw err;
                            }

                            res.end(JSON.stringify(resObj.ops[0]));
                        });
                    } else {
                        throw new Error('could not parse json');
                    }
                } catch(e) {
                    console.error('error reading post body >', e);
                    res.end('{"error": true}');
                }
            });
        } else {
            res.end('hi there');
        }
    });
    
    server.listen(3100);

    console.log('server is listening on 3100');
  });
});

