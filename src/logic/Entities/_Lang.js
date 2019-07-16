const Response = require(__dirname + '/_Response'),
	fs = require('fs');

const site = {
};

const server = {
};

class Lang{
	
	static async getLang(lang){
		
		if(server[lang] && Object.keys(server[lang]).length > 0)
			return server[lang];
		
		return new Promise( (resolve, reject) => {
			fs.readFile(`${__dirname}/../langs/${lang}.json`, (err, data) => {
				if (err){
					console.log(err);
					server[lang] = {};
				}else{
					server[lang] = JSON.parse(data);
				}
				resolve(server[lang]);
			})
		});
	}
	
	static async listLangs(){
		return new Promise( (resolve, reject) => {
			fs.readdir(`${__dirname}/../langs/`, (err, files) => {
				if(err)
					console.log(err);
				else{
					resolve(files || []);
				}
			});
		});
	}
	
}
module.exports = Lang;