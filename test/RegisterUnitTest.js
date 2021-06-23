const should = require('should');
const userdb = require('../lib/userdb');

describe('Register function', ()=>{
    it('The account has already extisted.', done=>{
        let input = {
            acocunt: 'nekoneko'
        };
        userdb.GetRegisterCheck('account', input, (err, data)=>{
            (typeof target).should.not.be.equal('undefined');
        })
        done();
    })
    it('Register success.', done=>{
        let input = {
            acocunt: 'nekone'
        };
        userdb.GetRegisterCheck('account', input, (err, data)=>{
            (typeof target).should.be.equal('undefined');
        })
        done();
    })
})