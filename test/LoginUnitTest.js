const should = require('should');
const userdb = require('../lib/userdb.js');

describe('check account existence', ()=>{
    it('The account or password is either wrong.',done=>{
        const input = {
            account: 'nekoneko',
            password: '12345678'
        };
        userdb.GetAccountCheck('account', input, (err, data)=>{
            data.should.equal(undefined);
        });
        done();
    })
    it('The account or password is either wrong.',done=>{
        let input = {
            account: 'nekone',
            password: 'ss12345678'
        }
        userdb.GetAccountCheck('account', input, (err, data)=>{
            data.should.equal(undefined);
        })
        done()
    })
    it('The account exists.',done=>{
        let input = {
            account: 'nekoneko',
            password: 'ss12345678'
        }
        userdb.GetAccountCheck('account', input, (err, data)=>{
            data.should.be.an.instanceOf(Object).and.have.property('account','nickname','password','cellphone','email','photo');
        })
        done()
    })
})
