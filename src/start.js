import express from 'express'
import 'express-async-errors'
import logger from 'loglevel'
import {getRoutes} from './routes'

function startServer({port = process.env.PORT} = {}) {
  const app = express()

  app.use('/api', getRoutes())

  app.use(errorMiddleware)

  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      logger.info(`Listening on port ${server.address().port}`)
      const originalClose = server.close.bind(server)
      server.close = () => {
        return new Promise((resolveClose) => {
          originalClose(resolveClose)
        })
      }
      setupCloseOnExit(server)
      resolve(server)
    })
  })
}

function errorMiddleware(error, req, res, next) {
  if (res.headersSent) {
    next(error)
  } else {
    logger.error(error)
    res.status(500)
    res.json({
      message: error.message,
      // we only add a `stack` property in non-production environments
      ...(process.env.NODE_ENV === 'production' ? null : {stack: error.stack}),
    })
  }
}

function setupCloseOnExit(server) {
  // thank you stack overflow
  // https://stackoverflow.com/a/14032965/971592
  async function exitHandler(options = {}) {
    await server
      .close()
      .then(() => {
        logger.info('Server successfully closed')
      })
      .catch((e) => {
        logger.warn('Something went wrong closing the server', e.stack)
      })
    // eslint-disable-next-line no-process-exit
    if (options.exit) process.exit()
  }

  // do something when app is closing
  process.on('exit', exitHandler)

  // catches ctrl+c event
  process.on('SIGINT', exitHandler.bind(null, {exit: true}))

  // catches "kill pid" (for example: nodemon restart)
  process.on('SIGUSR1', exitHandler.bind(null, {exit: true}))
  process.on('SIGUSR2', exitHandler.bind(null, {exit: true}))

  // catches uncaught exceptions
  process.on('uncaughtException', exitHandler.bind(null, {exit: true}))
}

export {startServer}
