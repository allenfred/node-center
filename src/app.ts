import * as createError from 'http-errors';
import * as express from 'express';
import * as cors from 'cors';
import * as csrf from 'csurf';
import * as cookieParser from 'cookie-parser';
import * as morgan from 'morgan';
import logger from './util/logger';
import * as compression from 'compression';

const app = express();
const csrfProtection = csrf({ cookie: true });

import apiRouter from './routes/index';

export class App {
  public app: express.Application;
  constructor(AppConfig: any = {}) {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRouter();
    this.initializeErrorHandling();
  }

  public listen(): void {
    this.app.listen(process.env.PORT, () => {
      logger.info(`🚀 Server ready at http://localhost:${process.env.PORT}`);
    });
  }

  public getServer(): express.Application {
    return this.app;
  }

  /**
   * Set up Middleware
   *
   */
  private initializeMiddlewares(): void {
    this.app.set('json escape', true);
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
    this.app.use(cookieParser());
    this.app.use(compression());

    this.app.use(
      morgan((tokens, req, res) => {
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
      }),
    );
  }

  /**
   * Set up Error Handling
   *
   */
  private initializeErrorHandling(): void {
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
  private initializeRouter(): void {
    this.app.get('/csrftoken', csrfProtection, (req, res) => {
      res.status(200).json({ csrfToken: req.csrfToken() });
    });

    this.app.use('/api', apiRouter);
    // define the health check api
    this.app.get('/api/', (req, res) => {
      res.send('OK');
    });
  }
}
