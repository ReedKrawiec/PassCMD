"use strict";
/// <reference path="../typings/index.d.ts" />
const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");
class alphaDataBase {
    constructor(location) {
        this.internal_location = location;
        this.loadDB();
    }
    loadDB() {
        let this_reference = this;
        mkdirp.sync(path.dirname(this_reference.internal_location));
        if (fs.existsSync(this_reference.internal_location))
            this.internal_obj = JSON.parse(fs.readFileSync(this_reference.internal_location, "utf-8"));
        else
            this.internal_obj = {};
    }
    makeTable(name) {
        if (!this.tableExists(name))
            this.internal_obj[name] = [];
        else {
            throw Error("Table already exists.");
        }
        return this;
    }
    deleteTable(name) {
        if (!this.tableExists(name))
            throw Error("Table does not exist");
        delete this.internal_location[name];
        return this;
    }
    tableExists(name) {
        let this_reference = this;
        return (Object.keys(this_reference.internal_obj).indexOf(name) > -1);
    }
    select(input) {
        let this_reference = this;
        if (typeof input === "string") {
            let temp_obj = {};
            temp_obj[input] = _.range(0, this_reference.internal_obj[input].length);
            this.internal_selected_items = temp_obj;
        }
        else if (typeof input === "function") {
            let keys = Object.keys(this_reference.internal_obj);
            let passing_tables = keys.filter(input);
            let temp_obj = {};
            passing_tables.forEach((table_name) => {
                temp_obj[table_name] = _.range(0, this_reference.internal_obj[table_name].length);
                this_reference.internal_selected_items = temp_obj;
            });
        }
        return this;
    }
    where(input) {
        let this_reference = this;
        let keys = Object.keys(this_reference.internal_selected_items);
        keys.forEach((key) => {
            let passing_items = [];
            this_reference.internal_selected_items[key].forEach((index) => {
                let condition = input(this_reference.internal_obj[key][index]);
                if (condition) {
                    passing_items.push(index);
                }
            });
            this_reference.internal_selected_items[key] = passing_items;
        });
        return this;
    }
    getSelected() {
        let this_reference = this;
        let keys = Object.keys(this_reference.internal_selected_items);
        let obj_to_return = [];
        keys.forEach((key) => {
            this_reference.internal_selected_items[key].forEach((val) => {
                obj_to_return.push(this_reference.internal_obj[key][val]);
            });
        });
        return obj_to_return;
    }
    insert(input) {
        let this_reference = this;
        let keys = Object.keys(this_reference.internal_selected_items);
        keys.forEach((key) => {
            this_reference.internal_obj[key].push(input);
        });
        return this;
    }
    edit(func) {
        let this_reference = this;
        let keys = Object.keys(this_reference.internal_selected_items);
        keys.forEach((key) => {
            this_reference.internal_obj[key].forEach(func);
        });
        return this;
    }
    write() {
        let this_reference = this;
        fs.writeFileSync(this_reference.internal_location, JSON.stringify(this_reference.internal_obj));
    }
    deleteItem() {
        let this_reference = this;
        let keys = Object.keys(this_reference.internal_selected_items);
        keys.forEach((key) => {
            for (let a = this_reference.internal_obj[key].length; a > 0; a--) {
                if (this_reference.internal_selected_items[key].indexOf(a - 1) > -1) {
                    this_reference.internal_obj[key].splice(a - 1, a);
                }
            }
        });
        return this;
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = alphaDataBase;
//# sourceMappingURL=alphadata.js.map