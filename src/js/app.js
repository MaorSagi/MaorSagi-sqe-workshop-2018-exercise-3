
import $ from 'jquery';
import * as flowchart from 'flowchart.js';
import {convert} from './code-analyzer';

let cond_idx;
let op_idx;
let str;
let flow_idx=1;

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        document.getElementById('Outputholder').innerHTML = '';
        let codeToConvert = $('#codePlaceholder').val();
        let args = $('#argsPlaceholder').val();
        let program_flow = convert(codeToConvert,args);
        cond_idx=0;op_idx=0;str='';
        let diagram = flowchart.parse(construct_chart(program_flow));
        diagram.drawSVG('Outputholder',get_settings());});
});



const set_numbers= (str,arrows_str) => {
    console.log(arrows_str);
    return str+arrows_str;
};


const get_settings=()=>({
    'x': 20,
    'y': 0,
    'line-width': 3,
    'line-length': 50,
    'text-margin': 10,
    'font-size': 14,
    'font-color': 'black',
    'line-color': 'black',
    'element-color': 'black',
    'fill': 'white',
    'yes-text': 'True',
    'no-text': 'False',
    'flowstate' : {
        'future' : { 'fill' : '#99ff99'}
    }
});


const gen_op = () => ('op'+(++op_idx));
const gen_cond = () => ('cond'+(++cond_idx));


const handle_not_if = (arr,i,arrows_str,flag,out) => {
    let op = gen_op();
    let text = '';
    while (i < arr.length && !arr[i].hasOwnProperty('test') ) {
        text += arr[i]['string'] + '\n';
        i++;
    }
    str += (op + '=>operation: ' + text+flag);
    arrows_str+='->'+op;
    if(typeof (out)!='undefined')
        arrows_str+=out;
    return recursive_construct(arr.slice(i),arrows_str,flag);
}


const handle_while = (arr,i,arrows_str,flag,out) => {

    let rest = recursive_construct(arr.slice(1),'',flag);
    if(typeof (out)!='undefined')
        rest+=out;
    let null_op=gen_op();
    str += (null_op+'=>operation: NULL'+flag);
    let cond=gen_cond();
    str += (cond+'=>condition: '  + arr[i]['string']+flag);
    arrows_str+='->'+null_op+'->'+cond;
    if(arr[i]['test']){
        arrows_str+='\n'+cond+'(yes,right)';
        arrows_str=recursive_construct(arr[i]['body'],arrows_str,flag,undefined);
        arrows_str+='->'+null_op;
        arrows_str+='\n'+cond+'(no)';
        arrows_str=recursive_construct([],arrows_str,flag,rest);
        if(typeof (rest)!='undefined')
            arrows_str+=rest;

    }
    else{
        arrows_str+='\n'+cond+'(no,right)';
        arrows_str=recursive_construct(arr[i]['body'],arrows_str,'|rejected\n',undefined);
        arrows_str+='->'+null_op;
        arrows_str+='->'+cond+'\n'+cond+'(yes)';
        arrows_str=recursive_construct([],arrows_str,flag,rest);
        if(typeof (out)!='undefined')
            arrows_str+=out;

    }
    return arrows_str;
};


const handle_if = (arr,i,arrows_str,flag,out) => {
    let cond=gen_cond();
    str += (cond+'=>condition: '  + arr[i]['string']+flag);
    let rest = recursive_construct(arr.slice(1),'',flag);
    if(typeof (out)!='undefined')
        rest+=out;
    if(arr[i]['test']){
        arrows_str+='->'+cond+'\n'+cond+'(yes)';
        arrows_str=recursive_construct(arr[i]['dit'],arrows_str,flag,rest);
        if(typeof (out)!='undefined')
            arrows_str+=out;
        arrows_str+='\n'+cond+'(no,right)';
        arrows_str=recursive_construct(arr[i]['dif'],arrows_str,'|rejected\n',rest);
        if(typeof (out)!='undefined')
            arrows_str+=out;

    }
    else{
        arrows_str+='->'+cond+'\n'+cond+'(yes,right)';
        arrows_str=recursive_construct(arr[i]['dit'],arrows_str,'|rejected\n',rest);
        if(typeof (out)!='undefined')
            arrows_str+=out;
        arrows_str+='\n'+cond+'(no)';
        arrows_str=recursive_construct(arr[i]['dif'],arrows_str,flag,rest);
        if(typeof (out)!='undefined')
            arrows_str+=out;
    }
    return arrows_str;
};


const recursive_construct = (arr,arrows_str,flag,out) => {
    if(arr.length==0) {
        if(typeof (out)!='undefined')
            arrows_str+=out;
        return arrows_str;
    }
    let i=0;
    if (!arr[i].hasOwnProperty('test')) {
        return handle_not_if(arr,i,arrows_str,flag,out);
    }
    else{
        if(arr[i].hasOwnProperty('body'))
            return handle_while(arr,i,arrows_str,flag,out);
        else return handle_if(arr,i,arrows_str,flag,out);
    }
};


const construct_chart = (arr) => {
    str +='st=>start: Start\n';
    let arrows_str='st';
    arrows_str=recursive_construct(arr,arrows_str,'|future\n');
    arrows_str+='->e';
    str += 'e=>end: End\n'
    return set_numbers(str,arrows_str);
};


