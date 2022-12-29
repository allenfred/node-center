"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const router = express.Router();
router.use('/', (req, res) => {
    res.send('OK');
});
exports.default = router;
//# sourceMappingURL=index.js.map