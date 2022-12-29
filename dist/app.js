"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const createError = require("http-errors");
const express = require("express");
const cors = require("cors");
const csrf = require("csurf");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const logger_1 = require("./util/logger");
const compression = require("compression");
const app = express();
const csrfProtection = csrf({ cookie: true });
const index_1 = require("./routes/index");
class App {
    constructor(AppConfig = {}) {
        this.app = express();
        this.initializeMiddlewares();
        this.initializeRouter();
        this.initializeErrorHandling();
    }
    listen() {
        this.app.listen(process.env.PORT, () => {
            logger_1.default.info(`🚀 Server ready at http://localhost:${process.env.PORT}`);
        });
    }
    getServer() {
        return this.app;
    }
    /**
     * Set up Middleware
     *
     */
    initializeMiddlewares() {
        this.app.set('json escape', true);
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: false }));
        this.app.use(cookieParser());
        this.app.use(compression());
        this.app.use(morgan((tokens, req, res) => {
            return [
                tokens.method(req, res),
                tokens.url(req, res),
                tokens.status(req, res),
                'query:' + JSON.stringify(req.query),
                'body:' + JSON.stringify(req.body),
                '-',
                tokens['response-time'](req, res),
                'ms',
            ].join(' ');
        }));
    }
    /**
     * Set up Error Handling
     *
     */
    initializeErrorHandling() {
        // catch 404 and forward to error handler
        this.app.use((req, res, next) => {
            next(createError(404));
        });
        // error handler
        this.app.use((err, req, res, next) => {
            // set locals, only providing error in development
            res.locals.message = err.message;
            res.locals.error = req.app.get('env') === 'development' ? err : {};
            // render the error page
            res.status(err.status || 500);
            res.render('error');
        });
    }
    /**
     * Set up Routing
     *
     */
    initializeRouter() {
        this.app.get('/csrftoken', csrfProtection, (req, res) => {
            res.status(200).json({ csrfToken: req.csrfToken() });
        });
        this.app.use('/api', index_1.default);
        // define the health check api
        this.app.get('/api/', (req, res) => {
            res.send('OK');
        });
    }
}
exports.App = App;
//# sourceMappingURL=app.js.map