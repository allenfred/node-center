"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose = require('mongoose');
const username = 'dev';
const password = 'qazwsx123';
// HK server
const host = '8.210.170.98';
const port = '27017';
const db = 'okex';
function connect() {
    return __awaiter(this, void 0, void 0, function* () {
        yield mongoose.connect(`mongodb://${username}:${password}@${host}:${port}/${db}`, {
            useNewUrlParser: true,
        });
    });
}
exports.default = connect;
//# sourceMappingURL=connection.js.map