var cachedRequest = require('./cachedRequest');
var async = require('async');
var _ = require('underscore');
var employeeService = require('./employeeService');

var employeeUrl = process.env.ANSATTLISTE_URL;
var employees = {};

function employeeParams(url) {
    return {
        url: employeeUrl + url,
        json: true
    };
}

function fetchEmployeesFromDatabase(callback) {
    employeeService.all(function(error, employees){
        if(error) callback(error);
        else callback(null, employees);
    });
}

function fetchEmployeesFromAnsattListeService(callback) {
    cachedRequest(employeeParams('/all'), function(error, response, employeesResponse) {
        if (error) {
            return console.log(error);
        }

        var all = employeesResponse.map(function(employee) {
            var id = employee.Id;

            return function(callback) {
                cachedRequest(employeeParams('/employee/'+id), function(error, response, body) {
                    callback(error, body[0]);
                });
            };
        });

        async.parallel(all, function(error, employeesResponse) {
            console.log('done');
            employeeService.store(employeesResponse, function(error){
                if(error) callback(error);
            });
            employeesResponse.forEach(function(employee) {
                employees[employee.Name] = employee;
            });
        });
    });
}

function all() {
    fetchEmployeesFromDatabase(function(error, dbEmployees) {
        if (!error && dbEmployees.length > 0) {
            console.log("Employees found in database");
            dbEmployees.forEach(function(employee) { employees[employee.Name] = employee; });
        }
        else {
            console.log("Employees not found in database, getting from web service");
            fetchEmployeesFromAnsattListeService();
        }
    });
}

function get(name) {
    if (employees[name]) return employees[name];

    return _.find(employees, function(ansatt) {
        var matches = _.intersection(name.split(" "), ansatt.Name.split(" "));
        return matches.length >= 2;
    });
}

module.exports = {
    all: all,
    get: get
};
