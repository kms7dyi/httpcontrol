/*
  Protocol is:

  Bulbs:

  GET /bublbs -> List of bulbs
  PUT /bulb/:index -> Send command to bulb, as json, possible commands: on, off, color.
  Color requires parameter, i.e
  {
    "command": "color",
    "paramter": [255,0,255]
  }

  Rooms:

  GET /rooms -> List of rooms
  PUT /room/:index -> Send command to all bulbs in a room
*/


const app = require('express')()
const ledlble = require('ledble')

app.use(require('body-parser').json())

const BULBS = [
  {
    name: 'Couchlight',
    address: 'e8:eb:11:0e:bf:73'
  },
  {
    name: 'Beamerlight',
    address: 'e8:eb:11:0f:8a:4c'
  },
  {
    name: 'Monumentlight',
    address: 'ff:ff:97:02:3a:c8'
  }
]

const ROOMS = [
  {
    name: 'Wohnzimmer',
    bulbs: [0,1,2]
  }
]

const bulb_command = async (index, command, args) => {
  const device = BULBS[index].device
  switch(command) {
    case 'on':
      device.turn_on()
      break
    case 'off':
      device.turn_off()
      break
    case 'color':
      device.set_color(args[0], args[1], args[2])
      break
    default:
      throw new Error('command not supported')
  }
}

app.get('/bulbs', (req, res) => {
  res.json(BULBS.map((b,i) => ({ 
      index: i,
      name: b.name,
      address: b.address
  })))
})

app.put('/bulb/:index', async (req, res) => {
  try {
    await bulb_command(Number(req.params.index), req.body.command, req.body.arguments)
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

app.get('/rooms', (req, res) => {
  res.json(ROOMS.map((r,i) => ({
    index: i,
    name: r.name,
    bulbs: r.bulbs.map((b,bi) => ({
      index: bi,
      name: BULBS[b].name,
      address: BULBS[b].address
    }))
  })))
})

app.put('/room/:index', async (req, res) => {
  try {
    for(let bi of ROOMS[Number(req.params.index)].bulbs) {
      await bulb_command(bi, req.body.command, req.body.arguments)
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
  for(let bulb of BULBS) {
    try {
      bulb.device = await ledlble.Bulb(bulb.address)
    }
    catch (err) {
      console.error('could not init led', bulb, err)
    }
  }
  app.listen(3000, () => { console.log('server running') })
}

init()