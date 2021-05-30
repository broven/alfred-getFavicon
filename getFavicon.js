const { default: axios } = require('axios');
const favicon = require('favicon');
const lodash = require('lodash');
const alfy = require('alfy');
/**
 * hostname
 * url
 */
/** 
 {  "[rerun]" : 1, // 自动重新运行的延时
     "items": [
    {
        ["uid"]: "desktop", // item id
        "title": "Desktop",
        ["subtitle"]: "~/Desktop"
        "arg": "~/Desktop", // 往下传的参数
          "icon": {         // 图标
            "type": "fileicon",
            "path": "~/Desktop"
        }
        [valid]: true | false // 是否可用
        [type]: ""default" | "file" | "file:skipcheck" ",
        [match]: STRING     // 如果传了这个， 那么就不用title， 用这个来匹配用
        ["autocomplete"]: "Desktop",
      
    }
]}
**/

const alwaysResolve = (p) => (...args) => new Promise(res => p(...args).then(response => [null, res(response)]).catch(err => res([err, null])));

const promiseWrapper = (fn) => (...args) => new Promise((res, rej) => {
    fn(...args, (err, response) => {
        if (err) { 
            rej(err);
        }
        res(response);
    })
})

const request = (metaInfo) => new Promise((res, rej) => {
    const [method, templateUrl, fn] = metaInfo;
    axios[method.toLowerCase()](templateUrl).then(response => {
        if (+response.status === 200) {
            res(fn(response));
        }
    }).catch(rej)
});



const main = (inputUrl) => {
    let hostname;
    try {
        const urlObj = new URL(inputUrl);
        hostname = urlObj.hostname
    } catch(_e) {
        const item = [{
            title: "wait a valid url",
            subtitle: "wait a valid url"
        }]
        alfy.output(item);
        return;
    }
    const getFaviconFns = [
        alwaysResolve(promiseWrapper(favicon))(inputUrl),
        alwaysResolve(request)(['GET'
            , `https://besticon-demo.herokuapp.com/allicons.json?formats=png&url=${hostname}`
            , (response) => lodash.get(response, 'data.icons', []).filter(item => item.format.toLowerCase().indexOf('png') !== -1).map(i => i.url)]),
        // alwaysResolve(request(['GET', `https://www.google.com/s2/favicons?sz=256&domain_url=${hostname}`, (r) => console.log(r.data) ]))()
    ]
    Promise.all(getFaviconFns).then(res => {
        const flatRes = lodash.flattenDeep(res);
        const item = flatRes.map(url => {
            return {
                title: url,
                arg: url,
            }
        });
        alfy.output(item);
    }).catch(err => {
    })
}

const [_, __, inputUrl] = process.argv;
try{
    main(inputUrl)
} catch(e) {
    const item = [{
        title: 'workflow Error!',
        subtitle: 'please see alfred debug log, and report to me'
    }]
    alfy.output(item)
}



