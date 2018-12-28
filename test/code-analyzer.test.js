import assert from 'assert';
import * as esprima from 'esprima';
import * as escodegen from 'escodegen';
import {convert,unary_expression_handler,exchange,handle_array} from '../src/js/code-analyzer';



const array_to_string =(arr) =>{
    let str='[';
    let i;
    for(i=0;i<arr.length;i++)
        str+=to_string(arr[i]);
    return str+']';
};

const object_to_string =(obj) =>{
    let str='{';
    let i;
    let prop_set = Object.getOwnPropertyNames(obj);
    for(i=0;i<prop_set.length;i++){
        str+=to_string(obj[prop_set[i]]);}
    return str+'}';
};

const to_string = (element) => {
    let str='';
    if(Array.isArray(element))
        str+=array_to_string(element);
    else if(element instanceof Object)
        str+=object_to_string(element);

    else
        str+=element.toString();
    return str;

};




describe('CFG', () => {
    it('Test 1:', () => {
        assert.equal(to_string(convert('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' + '    let b = a + y;\n' +
            '    let c = 0;\n' +'    \n' +
            '    if (b < z) {\n' + '        c = c + 5;\n' +
            '    } else if (b < z * 2) {\n' + '        c = c + x + 5;\n' +
            '    } else {\n' + '        c = c + z + 5;\n' +
            '    }\n' + '    \n' + '    return c;\n' +
            '}\n','1, 2, 3')),to_string([{string: 'a = x + 1'},{string: 'b = x + 1 + y'},
            {string: 'c = 0'},{string: 'b < z',test:false,dit: [{string: 'c = c + 5'}],dif:
                    [{string: 'b < z * 2', test: true, dit: [{string: 'c = c + x + 5'}], dif: [{string: 'c = c + z + 5'}]}]
            },{string: 'return c'}]));});

});


describe('CFG', () => {
    it('Test 2:', () => {
        assert.equal(to_string(convert('function foo(x, y, z){\n' +
            '   let a = x + 1;\n' +'   let b = a + y;\n' +
            '   let c = 0;\n' +'   \n' + '   while (a < z) {\n' + '       c = a + b;\n' +
            '       z = c * 2;\n' +'       a++;\n' +'   }\n' + '   \n' + '   return z;\n' +
            '}','1, 2, 3'))
        ,to_string([{string: 'a = x + 1'},{string: 'b = x + 1 + y'},{string: 'c = 0'},{string: 'a < z', test: true,
            body:[ {string: 'c = a + b'}, {string: 'z = c * 2'},{string: 'a++'}]},{string: 'return z'}]));});



});


describe('CFG', () => {
    it('Test 3:', () => {
        assert.equal(to_string(convert('let a=3;\n' +
            'function foo(x) { \n' +            'x=a;\n' +
            'while(x<5){\n' +            'x=x+1;\n' +            'a=5;\n' +
            '}\n' +            '}','1')) ,to_string([{string: 'a = 3'}, {string: 'x = a'},{string: 'x < 5', test: true,
            body:[{string: 'x = x + 1'},{string: 'a = 5'} ]}]));});

    it('Test 4:', () => {
        assert.equal(to_string(convert('function foo(x, y) {\n' +
            '    if (x < -1) {\n' +
            '        y = M[0];\n' +            '    } else {\n' +
            '        x = M[0];\n' +            '    }\n' +
            '}','1, 2')) ,to_string([{string: 'x < -1',test: false, dit:[{string: 'y = M[0]'}], dif:[{string: 'x = M[0]'}]}]));});

});


describe('CFG', () => {
    it('Test 5:', () => {
        assert.equal(to_string(convert('let a=1\n' +
            'a=3;\n' + 'function foo() {\n' +
            'let b;\n' +'b=2;\n' +'if(a<b){\n' + 'return;}\n' +'else{a++;}\n' +
            '}','')),to_string([{string: 'a = 1'},{string: 'a = 3'},{string: 'b'},{string: 'b = 2'},
            {string: 'a < b', test: false, dit:[{string: 'return'}],dif:[{string: 'a++'}]}]));});

    it('Test 6:', () => {
        assert.equal(to_string(convert('function foo() {\n' +
            'let a=[1,2,[]];\n' +
            'if(a[0]==1)\n' +
            'return a[0];\n' +
            '}','')) ,to_string([{string: 'a = [1,2,[]]'},{string: 'a[0] == 1', test: true, dit:[{string: 'return a[0]'}],dif:[]}]));});

});

describe('CFG', () => {

    it('Test 7:', () => {
        assert.equal(to_string(unary_expression_handler({'type': 'UnaryExpression','operator': '-',
            'argument': { 'type': 'Identifier','name': 'a' }, 'prefix': true },[{var:'a',val:{ 'type': 'Literal', 'value': 1, 'raw': '1'
        }}],-1)) ,to_string({'type': 'UnaryExpression', 'operator': '-', 'argument': { 'type': 'Literal', 'value': 1,
            'raw': '1'  }, 'prefix': true}));});

});



describe('CFG', () => {
    it('Test 8:', () => {
        assert.equal(exchange('x<1+x','x','1'),'1<1+1');});

    it('Test 9:', () => {
        assert.equal(exchange(exchange('x+y-x^2','x','3'),'y','2'),'3+2-3^2');});

    it('Test 10:', () => {
        assert.equal(handle_array(escodegen.generate(esprima.parseScript('M=[1,2,[1,2,3]]')['body'][0]['expression'])),'M = [1,2,[1,2,3]]');});

});






