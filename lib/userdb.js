var {google} = require('googleapis');
const fs = require('fs');


//module.exports.initializeAuth2 = initializeAuth2;
module.exports.GetAccountCheck = GetAccountCheck;
module.exports.GetRegisterCheck = GetRegisterCheck;
module.exports.AddSheetData = AddSheetData;
module.exports.GetSheetData = GetSheetData;
module.exports.UpdateSheetData = UpdateSheetData;

// function initializeAuth2(){
//     var oAuth2Client;
//     const promise = new Promise((resolve, reject)=>{
//         console.log("promise");
//         resolve();
//     })
//     .then(()=>{ 
//         return new Promise((resolve, reject)=>{
//             fs.readFile('./lib/client_secret.json', (err, content) => {
//                 const {client_secret, client_id, redirect_uris} = JSON.parse(content).installed;
//                 oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]); 
//                 resolve();
//             });
//         });
//     })
//     .then(()=>{
//         fs.readFile('./lib/token.json', (err, token) => {
//             if (err) console.log('token fail.');
//             oAuth2Client.setCredentials(JSON.parse(token));
//             return oAuth2Client;
//         });
//     })
// }


//transfer data in sheet into data object array(ok)
function getSheetInfo(sheetList) {
    //--------------create the format of Json-------------------------
    var headers = sheetList[0];                //form the key of obj
    var sheet_data = [];
    
    //match key:value
    for (j = 1; j < sheetList.length ; j++) {
        var temp = {};
        for(k = 0; k < headers.length; k++)
            temp[headers[k]] = sheetList[j][k];
        //insert data into array
        sheet_data.push(temp);
    }
    return sheet_data;
}

//used to search object of input matching(OK)
function getDataSearch(sheet_data,input) {
    console.log("getDataSearch");
    console.log(input);
    if (input != "ALL") {
      var count=0;
      var input_keys = Object.keys(input);
      var result = [];
      for(i = 0; i < Object.keys(sheet_data).length; i++){
        count=0;
        for(j = 0; j < input_keys.length; j++){
          if(sheet_data[i][input_keys[j]] == input[input_keys[j]])
            count++;
        }
        if(count == Object.keys(input).length)
          result.push(sheet_data[i]);
      }                                       
  
      if( result.length != 0)
        return result;
      else
        return undefined;
    } else {
      return sheet_data;
    }
}

function GetAccountCheck(WorksheetName, input, callback) {
    var error;
    var AccountInfo;
    var CheckResult = undefined;

    var oAuth2Client;
    if (typeof input !== 'object' || typeof input.account !== 'string' || typeof input.password !== 'string' ) {
        error = "opt wrong";
        console.log(typeof input !== 'object' || typeof input.account !== 'string' || typeof input.password !== 'string' );
        return callback( error, CheckResult);
    }
    const promise = new Promise((resolve, reject)=>{
        console.log("promise");
        resolve();
    })
    .then(()=>{ 
        return new Promise((resolve, reject)=>{
            fs.readFile('./lib/client_secret.json', (err, content) => {
                const {client_secret, client_id, redirect_uris} = JSON.parse(content).installed;
                oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]); 
                resolve();
            });
        });
    })
    .then(()=>{
        return new Promise((resolve, reject)=>{
            fs.readFile('./lib/token.json', (err, token) => {
                if (err) console.log('token fail.');
                oAuth2Client.setCredentials(JSON.parse(token));
                resolve();
            });
        });
        
    })
    .then(()=>{
        //console.log(oAuth2Client);
        const sheets = google.sheets({version: 'v4', auth:oAuth2Client});
        sheets.spreadsheets.values.get({
            spreadsheetId: '1gIjR-904U28cabkxRobneDv8JWk6eIHn4EaN1Y7gJbY',
            range: WorksheetName,
          },(err, res) => {
            if (err) return callback(err, CheckResult);
            const rows = res.data.values;
            AccountInfo = getSheetInfo(rows);
            /* check account exist or not .....*/
            CheckResult = getDataSearch(AccountInfo,input);
            callback(err, CheckResult[0]);
          });
    });
}
  
function GetRegisterCheck(WorksheetName,input,callback){
    var input_keys = Object.keys(input);
    var AccountInfo = [];
    var oAuth2Client;
    const promise = new Promise((resolve, reject)=>{
        console.log("promise");
        resolve();
    })
    .then(()=>{ 
        return new Promise((resolve, reject)=>{
            fs.readFile('./lib/client_secret.json', (err, content) => {
                const {client_secret, client_id, redirect_uris} = JSON.parse(content).installed;
                oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]); 
                resolve();
            });
        });
    })
    .then(()=>{
        return new Promise((resolve, reject)=>{
            fs.readFile('./lib/token.json', (err, token) => {
                if (err) console.log('token fail.');
                oAuth2Client.setCredentials(JSON.parse(token));
                resolve();
            });
        });
    })
    .then(()=>{
        //console.log(oAuth2Client);
        const sheets = google.sheets({version: 'v4', auth:oAuth2Client});
        sheets.spreadsheets.values.get({
            spreadsheetId: '1gIjR-904U28cabkxRobneDv8JWk6eIHn4EaN1Y7gJbY',
            range: WorksheetName,
          },(err, res) => {
            if ( err )  return callback(err, CheckResult);
            const rows = res.data.values;
            AccountInfo = getSheetInfo(rows);
            
            for(i = 0; i <= Object.keys(input).length; i++){
              for(j = 0;j < Object.keys(AccountInfo).length; j++){
                if(AccountInfo[j][input_keys[i]] == input[input_keys[i]])
                  return  callback(err , input_keys[i]);
              }
            }
            return  callback(err, undefined);
          });
    });
}
function GetSheetData(WorksheetName,target,key,callback){
    var start = new Date().getTime();
    var database = [];        //return
    var sheet_data = []; 
    var oAuth2Client;
    const promise = new Promise((resolve, reject)=>{
        console.log("promise");
        resolve();
    })
    .then(()=>{ 
        return new Promise((resolve, reject)=>{
            fs.readFile('./lib/client_secret.json', (err, content) => {
                const {client_secret, client_id, redirect_uris} = JSON.parse(content).installed;
                oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]); 
                resolve();
            });
        });
    })
    .then(()=>{
        return new Promise((resolve, reject)=>{
            fs.readFile('./lib/token.json', (err, token) => {
                if (err) console.log('token fail.');
                oAuth2Client.setCredentials(JSON.parse(token));
                var end = new Date().getTime();
                console.log("access "+ (end - start)/1000+'秒內');
                resolve();
            });
        });
    })
    .then(()=>{
        //console.log(oAuth2Client);
        const sheets = google.sheets({version: 'v4', auth:oAuth2Client});
        sheets.spreadsheets.values.get({
            spreadsheetId: '1gIjR-904U28cabkxRobneDv8JWk6eIHn4EaN1Y7gJbY',
            range: WorksheetName,
          },(err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            const rows = res.data.values;
            sheet_data = getSheetInfo(rows);
            //according to target,find the corresponding object
            var content = getDataSearch(sheet_data,target);
            //record the value of object.key
            var temp = [] ;
  
            var j = 0;
            var each_term = []; 
        
            //sperate data from object.key value by ","
            if(typeof content !== 'undefined'){
                for(k = 0; k < key.length; k++){
                //initialize
                j = 0;
                each_term = [];
                temp = [];

                for(t = 0; t < content.length; t++)
                    temp.push(content[t][key[k]]);
                console.log(temp);
                for(i = 0;i < temp.length; i++){
                    j = 0;
                    for(s = 0;s <= temp[i].length; s++){
                        if((temp[i][s] == '|')||( s == temp[i].length)){
                            each_term.push( temp[i].substring(j,s));
                            j = s + 1;
                        }
                    }
                }
                database.push(each_term);
            }
            console.log('database:   '+database);
            var end = new Date().getTime();
            console.log("finish "+ (end - start)/1000+'秒內');
            return  callback(err,database);  //return array
        }else{
            return  callback(err, 'undefined');
        }
            
        });
    })
    .catch((error)=>{
        console.log(error);
    })
}

//increase data into sheet(ok)
function AddSheetData(WorksheetName,input){
    var input_keys = Object.keys(input);  
    //get the key of input to gain the value
    var values = new Array();
    for(var i = 0; i < input_keys.length; i++){
        values.push(input[input_keys[i]]);
    }
    var resource = {
        majorDimension: "ROWS",
        values: [values]
    };
    const promise = new Promise((resolve, reject)=>{
        console.log("promise");
        resolve();
    })
    .then(()=>{ 
        return new Promise((resolve, reject)=>{
            fs.readFile('./lib/client_secret.json', (err, content) => {
                const {client_secret, client_id, redirect_uris} = JSON.parse(content).installed;
                oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]); 
                resolve();
            });
        });
    })
    .then(()=>{
        return new Promise((resolve, reject)=>{
            fs.readFile('./lib/token.json', (err, token) => {
                if (err) console.log('token fail.');
                oAuth2Client.setCredentials(JSON.parse(token));
                resolve();
            });
        });
    })
    .then(()=>{
        //console.log(oAuth2Client);
        const sheets = google.sheets({version: 'v4', auth:oAuth2Client});

        const request = {
            spreadsheetId: '1gIjR-904U28cabkxRobneDv8JWk6eIHn4EaN1Y7gJbY',
            range: WorksheetName,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: resource
        };
        sheets.spreadsheets.values.append(request, (err, result) => {
            if (err) return console.log('The API returned an error: ' + err);
        });
    })
}
//increase data into sheet(ok)
function UpdateSheetData(WorksheetName, olddata, newdata){
    var input_keys = Object.keys(olddata);  
    //get the key of input to gain the value
    var values = new Array();
    for(var i = 0; i < input_keys.length; i++){
        values.push(newdata[input_keys[i]]);
    }
    const promise = new Promise((resolve, reject)=>{
        console.log("promise");
        resolve();
    })
    .then(()=>{ 
        return new Promise((resolve, reject)=>{
            fs.readFile('./lib/client_secret.json', (err, content) => {
                const {client_secret, client_id, redirect_uris} = JSON.parse(content).installed;
                oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]); 
                resolve();
            });
        });
    })
    .then(()=>{
        return new Promise((resolve, reject)=>{
            fs.readFile('./lib/token.json', (err, token) => {
                if (err) console.log('token fail.');
                oAuth2Client.setCredentials(JSON.parse(token));
                resolve();
            });
        });
    })
    .then(()=>{
        //console.log(oAuth2Client);
        const sheets = google.sheets({version: 'v4', auth:oAuth2Client});
        sheets.spreadsheets.values.get({
            spreadsheetId: '1gIjR-904U28cabkxRobneDv8JWk6eIHn4EaN1Y7gJbY',
            range: WorksheetName,
        },(err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            const rows = res.data.values;

            var oldvalues = new Array();
            for(var i = 0; i < input_keys.length; i++){
                oldvalues.push(olddata[input_keys[i]]);
            }
            console.log(oldvalues);
            var replaceindex = rows.findIndex((item) => item.every((val, index) => val === oldvalues[index]))+1;
            console.log(replaceindex);

            var data = new Array();
            var temp = {};
            values.forEach((element,idx) => {
                temp = {};
                if(element != oldvalues[idx]){
                    temp['range'] = WorksheetName + '!' + String.fromCharCode(65+idx) + replaceindex;
                    temp['majorDimension'] = 'ROWS';
                    temp['values'] = [[element]];
                    data.push(temp);
                }
            });
            console.log(data);
            var request = {
                spreadsheetId: '1gIjR-904U28cabkxRobneDv8JWk6eIHn4EaN1Y7gJbY',
                resource: {
                    valueInputOption: 'USER_ENTERED',
                    data: data
                }
            };
            sheets.spreadsheets.values.batchUpdate(request, (err, result) => {
                if (err) return console.log('The API returned an error: ' + err);
            });
        });
    })
}