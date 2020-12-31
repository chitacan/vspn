const admin = require('firebase-admin')

const base64sa = process.env.FIREBASE_SERVICE_ACCOUNT
const databaseURL = process.env.FIREBASE_DB_URL
const serviceAccount = JSON.parse(Buffer.from(base64sa, 'base64').toString('utf-8'))

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL
})

function get(req, res) {
  if (!req.query.requestId) {
    return res.status(400).send('"requestId" required')
  }

  const vspn = admin.database().ref('vspn')
  vspn.child('runs').child(req.query.requestId).once('value')
    .then(snapshot => {
      const val = snapshot.val()
      res.status(200).json(val === null ? {status: 'requested'} : val)
    })
    .catch(e => {
      console.error(e)
      res.status(400).send(e)
    })
}

function post(req, res) {
  if (!req.body) {
    return res.status(400).send('invalid body')
  }
  if (!req.body.requestId) {
    return res.status(400).send('cannot find required body "requestId"')
  }
  if (!req.body.status) {
    return res.status(400).send('cannot find required body "status"')
  }

  const {status, requestId} = req.body

  const vspn = admin.database().ref('vspn')
  vspn.child('runs').child(requestId).update({status})
    .then(() => {
      res.status(200).send('ok')
    })
    .catch(e => {
      console.error(e)
      res.status(400).send(e)
    })
}

module.exports = (req, res) => {
  if (req.method === 'GET') {
    return get(req, res)
  } else if (req.method === 'POST') {
    return post(req, res)
  } else {
    return res.status(400).end()
  }
}
