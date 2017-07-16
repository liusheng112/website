'use strict';

// BASE SETUP
// =============================================================================
var fs = require('fs');
var path = require('path');
var mime = require('mime');

var express = require('express'),
    bodyParser = require('body-parser');

var app = express();
app.use(bodyParser());

app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

var env = app.get('env') == 'development' ? 'dev' : app.get('env');
var port = process.env.PORT || 3001;

// IMPORT MODELS
// =============================================================================
var Sequelize = require('sequelize');

// db config
var env = "dev";
var config = require('./mysql/database.json')[env];
var password = config.password ? config.password : null;

// initialize database connection
var sequelize = new Sequelize(config.database, config.user, config.password, {
	dialect: config.driver,
	logging: console.log,
	define: {
		timestamps: false
	}
});

// DOWNLOAD FILE
app.get('/white_paper/:fileName', function (req, res, next) {

	// var file = req.params.file

	var fileName = req.params.fileName;
	var filePath = "./server/files/" + fileName;
	var stats = fs.statSync(filePath);
	if (stats.isFile()) {
		res.set({
			'Content-Type': 'application/octet-stream'
		});
		fs.createReadStream(filePath).pipe(res);
	} else {
		res.end(404);
	}
});

var crypto = require('crypto');
var DataTypes = require("sequelize");

var User = sequelize.define('users', {
	username: DataTypes.STRING,
	password: DataTypes.STRING
}, {
	instanceMethods: {
		retrieveAll: function retrieveAll(onSuccess, onError) {
			User.findAll({}, { raw: true }).success(onSuccess).error(onError);
		},
		retrieveById: function retrieveById(user_id, onSuccess, onError) {
			User.find({ where: { id: user_id } }, { raw: true }).success(onSuccess).error(onError);
		},
		add: function add(onSuccess, onError) {
			var username = this.username;
			var password = this.password;

			var shasum = crypto.createHash('sha1');
			shasum.update(password);
			password = shasum.digest('hex');

			User.build({ username: username, password: password }).save().success(onSuccess).error(onError);
		},
		updateById: function updateById(user_id, onSuccess, onError) {
			var id = user_id;
			var username = this.username;
			var password = this.password;

			var shasum = crypto.createHash('sha1');
			shasum.update(password);
			password = shasum.digest('hex');

			User.update({ username: username, password: password }, { where: { id: id } }).success(onSuccess).error(onError);
		},
		removeById: function removeById(user_id, onSuccess, onError) {
			User.destroy({ where: { id: user_id } }).success(onSuccess).error(onError);
		}
	}
});

// IMPORT ROUTES
// =============================================================================
var router = express.Router();

// on routes that end in /users
// ----------------------------------------------------
router.route('/users')

// create a user (accessed at POST http://localhost:8080/api/users)
.post(function (req, res) {

	var username = req.body.username; //bodyParser does the magic
	var password = req.body.password;

	var user = User.build({ username: username, password: password });

	user.add(function (success) {
		res.json({ message: 'User created!' });
	}, function (err) {
		res.send(err);
	});
})

// get all the users (accessed at GET http://localhost:3001/api/users)
.get(function (req, res) {
	var user = User.build();

	user.retrieveAll(function (users) {
		if (users) {
			res.json(users);
		} else {
			res.send(401, "User not found");
		}
	}, function (error) {
		res.send("User not found");
	});
});

// on routes that end in /users/:user_id
// ----------------------------------------------------
router.route('/users/:user_id')

// update a user (accessed at PUT http://localhost:8080/api/users/:user_id)
.put(function (req, res) {
	var user = User.build();

	user.username = req.body.username;
	user.password = req.body.password;

	user.updateById(req.params.user_id, function (success) {
		console.log(success);
		if (success) {
			res.json({ message: 'User updated!' });
		} else {
			res.send(401, "User not found");
		}
	}, function (error) {
		res.send("User not found");
	});
})

// get a user by id(accessed at GET http://localhost:8080/api/users/:user_id)
.get(function (req, res) {
	var user = User.build();

	user.retrieveById(req.params.user_id, function (users) {
		if (users) {
			res.json(users);
		} else {
			res.send(401, "User not found");
		}
	}, function (error) {
		res.send("User not found");
	});
})

// delete a user by id (accessed at DELETE http://localhost:8080/api/users/:user_id)
.delete(function (req, res) {
	var user = User.build();

	user.removeById(req.params.user_id, function (users) {
		if (users) {
			res.json({ message: 'User removed!' });
		} else {
			res.send(401, "User not found");
		}
	}, function (error) {
		res.send("User not found");
	});
});

// Middleware to use for all requests
router.use(function (req, res, next) {
	// do logging
	console.log('Something is happening.');
	next();
});

// REGISTER OUR ROUTES
// =============================================================================
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);

//# sourceMappingURL=server-compiled.js.map