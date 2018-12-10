/*
  Protocol is:

  Devices:

  GET /devices -> List of devices
  PUT /device/:index -> Send command to device, as json, possible commands: on, off, color, ...
  Color requires parameter, i.e
  {
    "command": "color",
    "paramter": [255,0,255]
  }

  Areas:

  GET /areas -> List of rooms
  PUT /area/:index -> Send command to all devices in a area
*/

const app = require('express')()
const config = require('./config')
const ledble = require('ledble')

// ledble shim for testing
/*
const ledble = {
  Bulb: () => Promise.resolve({
      turn_on: () => { console.log('turn_on'); return Promise.resolve(null) },
      turn_off: () => { console.log('turn_off'); return Promise.resolve(null) },
      set_color: (r,g,b) => { console.log("set_color", r, g, b); return Promise.resolve(null) },
      set_effect: (effect, speed) => { console.log("set_effect", effect, speed); return Promise.resolve(null) },
      set_brightness: (value) =>  { console.log("set_brightness", value); return Promise.resolve(null) }
  })
}
*/

app.use(require('body-parser').json())
app.use(require('cors')())

// delay middleware
app.use((req, res, next) => setTimeout(next,250))

// auth middleware
app.use((req, res, next) => {
  if(!config.password) {
    next()
    return
  }
  const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
  const [,password] = new Buffer(b64auth, 'base64').toString().split(':')
  if(password === config.password) {
    next()
    return
  }
  res.set('WWW-Authenticate', 'Basic realm="password required"').status(401).send('not authorized')
})

const device_command = async (index, command, args) => {
  const device = config.devices[index].device
  switch(command) {
    case 'on':
      return await device.turn_on()
    case 'off':
      return await device.turn_off()
    case 'color':
      return await device.set_color(args[0], args[1], args[2])
    case 'effect':
      return await device.set_effect(args[0], args[1])
    case 'warmwhite':
      return await device.set_brightness(args[0])
    default:
      throw new Error('command not supported')
  }
}

app.get('/devices', (req, res) => {
  res.json(config.devices.map((d,i) => ({ 
      index: i,
      name: d.name,
      address: d.address,
      caps: d.caps
  })))
})

app.put('/device/:index', async (req, res) => {
  try {
    await device_command(Number(req.params.index), req.body.command, req.body.args)
    res.json({
      status: 'ok'
    })
  }
  catch (error) {
    console.error(error)
    res.status(503).json({
      status: 'error',
      error: error
    })
  }
})

app.get('/areas', (req, res) => {
  res.json(config.areas.map((a,i) => ({
    index: i,
    name: a.name,
    devices: a.devices.map((d,di) => ({
      index: di,
      name: config.devices[d].name,
      address: config.devices[d].address,
      caps: config.devices[d].caps
    }))
  })))
})

app.put('/area/:index', async (req, res) => {
  try {
    for(let di of config.areas[Number(req.params.index)].devices) {
      await device_command(di, req.body.command, req.body.args)
    }
    res.json({
      status: 'ok'
    })
  }
  catch (error) {
    console.error(error)
    res.status(503)
    res.json({
      status: 'error',
      error: error
    })
  }
})

const init = async () => {
  for(let device of config.devices) {
    try {
      // TODO: check type and differend libs
      device.device = await ledble.Bulb(device.address)
    }
    catch (error) {
      console.error('could not init device', device, error)
    }
  }
  app.listen(config.port, () => { console.log('server running', config.port) })
}

init()
