import express from 'express'

function getMathRoutes() {
  const router = express.Router()
  router.get('/add', add)
  router.get('/subtract', subtract)
  return router
}

async function add(req, res) {
  const sum = Number(req.query.a) + Number(req.query.b)
  res.send(sum.toString())
}

async function subtract(req, res) {
  const difference = Number(req.query.a) - Number(req.query.b)
  res.send(difference.toString())
}

export {getMathRoutes}
