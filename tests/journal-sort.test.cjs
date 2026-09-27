const test=require('node:test'),assert=require('node:assert/strict');
const {sortDiary,diarySortOrders}=require('../journal-core.js');
const fixtures=[
 {id:'a',title:'Alpha',rating:2,date:'2026-01-01',year:'1990'},
 {id:'b',title:'Beta',rating:5,date:'2026-09-27',year:'2020'},
 {id:'c',title:'Charlie',rating:null,date:'',watchedDateUnknown:true,year:''}
];
const ids=rows=>rows.map(r=>r.id);
const expected={
 'watched-desc':['b','a','c'],'watched-asc':['a','b','c'],
 'rating-desc':['b','a','c'],'rating-asc':['a','b','c'],
 'title-asc':['a','b','c'],'title-desc':['c','b','a'],
 'year-desc':['b','a','c'],'year-asc':['a','b','c']
};
for(const order of diarySortOrders)test(`Film deck sort: ${order}`,()=>assert.deepEqual(ids(sortDiary(fixtures,order)),expected[order]));
test('Sorting never changes private records or the original order',()=>{
 const rows=fixtures.map(r=>Object.freeze({...r,note:'Private synthetic thought',posterURL:'https://example.invalid/poster.jpg'}));
 Object.freeze(rows);const before=JSON.stringify(rows);
 for(const order of diarySortOrders){const sorted=sortDiary(rows,order);assert.notEqual(sorted,rows);assert.ok(sorted.every(r=>rows.includes(r)));}
 assert.equal(JSON.stringify(rows),before);
});
test('Missing or invalid ratings, watch dates and release years remain last in both directions',()=>{
 const bad=[{id:'x',title:'X',rating:0,date:'2026-02-30',year:'abcd'},{id:'y',title:'Y',rating:3.2,date:'not-a-date',year:'1800'},{id:'z',title:'Z',rating:'5',date:'2026-09-27',watchedDateUnknown:true,year:''},{id:'n',title:'N',rating:NaN,date:undefined,year:null}];
 for(const field of ['watched','rating','year'])for(const dir of ['asc','desc'])assert.deepEqual(ids(sortDiary([...bad,fixtures[0]],`${field}-${dir}`)),['a','n','x','y','z']);
});
test('Equal values use case-insensitive title and ID ties consistently',()=>{
 const a={id:'b',title:'alpha',rating:4,date:'2026-09-27',year:'2000'},b={...a,id:'a',title:'Alpha'},c={...a,id:'c',title:'Beta'};
 for(const order of ['watched-desc','rating-asc','year-desc','title-asc'])assert.deepEqual(ids(sortDiary([c,a,b],order)),['a','b','c']);
});
test('Invalid saved sort mode safely uses recent watches; leap dates work',()=>{
 assert.deepEqual(ids(sortDiary(fixtures,'invalid')),expected['watched-desc']);
 assert.deepEqual(ids(sortDiary([{id:'bad',title:'A',date:'2025-02-29'},{id:'leap',title:'B',date:'2024-02-29'}],'watched-asc')),['leap','bad']);
 assert.deepEqual(sortDiary([]),[]);
});
