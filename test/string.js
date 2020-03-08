"use strict"

const test = require('jtf')
const typea = require('..')


test('string', t => {

   const { error, data } = typea(String).verify("xxx");

   // console.log(data);

   t.deepEqual('xxx', data, error);

});