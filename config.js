module.exports = {
  port: 4444,
  password: null,
  devices: [
    {
      name: 'Couchlight',
      address: 'e8:eb:11:0e:bf:73',
      caps: [ 'power', 'color', 'effect' ],
      type: 'ledlble'
    },
    {
      name: 'Beamerlight',
      address: 'e8:eb:11:0f:8a:4c',
      caps: [ 'power', 'color', 'effect' ],
      type: 'ledlble'
    },
    {
      name: 'Monumentlight',
      address: 'ff:ff:97:02:3a:c8',
      caps: [ 'power', 'color', 'effect', 'warmwhite' ],
      type: 'ledlble'
    }
  ],
  areas: [
    {
      name: 'Wohnzimmer',
      devices: [0,1,2]
    },
    {
      name: 'Leinwandseite',
      devices: [1,2]
    }
  ]
}