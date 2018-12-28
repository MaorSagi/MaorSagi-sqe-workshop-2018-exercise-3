
import $ from 'jquery';
import * as flowchart from 'flowchart.js';
import {convert} from './code-analyzer';

let cond_idx;
let op_idx;
let str;
let flow_idx;

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        document.getElementById('Outputholder').innerHTML = '';
        let codeToConvert = $('#codePlaceholder').val();
        let args = $('#argsPlaceholder').val();
        let program_flow = convert(codeToConvert,args);
        cond_idx=0;op_idx=0;str='';flow_idx=1;
        let diagram = flowchart.parse(construct_chart(program_flow.concat({string:'End'})));
        diagram.drawSVG('Outputholder',get_settings());});
});


const get_lable_idx=(str,lbl)=>{
    let idx = str.indexOf(lbl);
    str = str.substring(idx,str.length);

    idx += str.indexOf(':')+1;
    return idx;
};


const push_tokens = (start,tokens,list) =>{
    let j;
    for(j=start;j<tokens.length;j++)
        list.push(tokens[j]);
};


const lables_list_construct =(arr)=>{
    let i;let list = [];
    for(i=0;i<arr.length;i++) {
        let idx1 = arr[i].indexOf('(');
        let tokens = arr[i].split('->');
        if (idx1 > 0) {
            if(i==arr.length-1)
                push_tokens(1,tokens,list);
            else list.push(tokens[1]);
        }
        else {
            push_tokens(0,tokens,list);
        }
    }
    return list;
};



const set_numbers= (str,arrows_str) => {
    let split = arrows_str.split('\n');
    let lables_list = lables_list_construct(split);
    /*    if(!lables_list.includes('e'))
        lables_list=lables_list.concat('e');*/
    let i;
    for(i=0;i<lables_list.length;i++) {
        let lable_idx = get_lable_idx(str, lables_list[i] + '=>');
        str = str.substring(0, lable_idx) + ' (' + (flow_idx++) + ')\n' + str.substring(lable_idx, str.length);
    }
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
    while (i < arr.length && !arr[i].hasOwnProperty('test') && arr[i]['string']!='End' ) {
        text += arr[i]['string'] + '\n';
        i++;
    }
    str += (op + '=>operation: ' + text+flag);
    arrows_str+='->'+op;
    if(typeof (out)!='undefined')
        arrows_str+=out;
    return recursive_construct(arr.slice(i),arrows_str,flag);
};

const handle_true_while = (arrows_str,cond,null_op,flag,rest,out,arr_element) =>{
    arrows_str+='\n'+cond+'(yes,right)';
    arrows_str=recursive_construct(arr_element['body'],arrows_str,flag,undefined);
    arrows_str+='->'+null_op;
    arrows_str+='\n'+cond+'(no)';
    arrows_str=recursive_construct([],arrows_str,flag,rest);
    if(typeof (out)!='undefined')
        arrows_str+=out;
    return arrows_str;
};
const handle_false_while = (arrows_str,cond,null_op,flag,rest,out,arr_element) =>{
    arrows_str+='\n'+cond+'(no,right)';
    arrows_str=recursive_construct(arr_element['body'],arrows_str,'|rejected\n',undefined);
    arrows_str+='->'+null_op;
    arrows_str+='->'+cond+'\n'+cond+'(yes)';
    arrows_str=recursive_construct([],arrows_str,flag,rest);
    if(typeof (out)!='undefined')
        arrows_str+=out;
    return arrows_str;
};

const handle_true_if = (arrows_str,cond,flag,rest,out,arr_element) =>{
    arrows_str+='->'+cond+'\n'+cond+'(no,right)';
    arrows_str=recursive_construct(arr_element['dif'],arrows_str,'|rejected\n',rest);
    if(typeof (out)!='undefined')
        arrows_str+=out;
    arrows_str+='\n'+cond+'(yes)';
    arrows_str=recursive_construct(arr_element['dit'],arrows_str,flag,rest);
    if(typeof (out)!='undefined')
        arrows_str+=out;
    return arrows_str;
};
const handle_false_if = (arrows_str,cond,flag,rest,out,arr_element) =>{
    arrows_str+='->'+cond+'\n'+cond+'(yes,right)';
    arrows_str=recursive_construct(arr_element['dit'],arrows_str,'|rejected\n',rest);
    if(typeof (out)!='undefined')
        arrows_str+=out;
    arrows_str+='\n'+cond+'(no)';
    arrows_str=recursive_construct(arr_element['dif'],arrows_str,flag,rest);
    if(typeof (out)!='undefined')
        arrows_str+=out;
    return arrows_str;
};

const handle_while = (arr,i,arrows_str,flag,out) => {
    let rest = recursive_construct(arr.slice(1),'',flag);
    /*if(typeof (out)!='undefined')
        rest+=out;*/
    let null_op=gen_op();
    str += (null_op+'=>operation: NULL'+flag);
    let cond=gen_cond();
    str += (cond+'=>condition: '  + arr[i]['string']+flag);
    arrows_str+='->'+null_op+'->'+cond;
    if(arr[i]['test']){
        arrows_str=handle_true_while(arrows_str,cond,null_op,flag,rest,out,arr[i]);
    }
    else{
        arrows_str=handle_false_while(arrows_str,cond,null_op,flag,rest,out,arr[i]);
    }
    return arrows_str;
};


const handle_if = (arr,i,arrows_str,flag,out) => {
    let cond=gen_cond();
    str += (cond+'=>condition: '  + arr[i]['string']+flag);
    let rest = recursive_construct(arr.slice(1),'',flag);
    /*if(typeof (out)!='undefined')
        rest+=out;*/
    if(arr[i]['test']){
        arrows_str=handle_true_if(arrows_str,cond,flag,rest,out,arr[i]);
    }
    else{
        arrows_str=handle_false_if(arrows_str,cond,flag,rest,out,arr[i]);
    }
    return arrows_str;
};



const base_case =(arrows_str,out) => {
    if(typeof (out)!='undefined')
        arrows_str+=out;
    return arrows_str;
};



const recursive_construct = (arr,arrows_str,flag,out) => {
    if(arr.length==0){
        return base_case(arrows_str,out);
    }
    if(arr[0]['string']=='End')
        return arrows_str+'->e';

    if (!arr[0].hasOwnProperty('test')) {
        return handle_not_if(arr,0,arrows_str,flag,out);
    }
    else{
        if(arr[0].hasOwnProperty('body'))
            return handle_while(arr,0,arrows_str,flag,out);
        else return handle_if(arr,0,arrows_str,flag,out);
    }
};


const construct_chart = (arr) => {
    str +='st=>start: Start\n';
    let arrows_str='st';
    arrows_str=recursive_construct(arr,arrows_str,'|future\n');
    str += 'e=>end: End\n';
    return set_numbers(str,arrows_str);
};


