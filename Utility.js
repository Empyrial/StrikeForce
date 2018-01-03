fs = require('fs');
ncsv = require('csv');

chars = require('./characters.json');
heroes = require('./M3HeroSheet.json');

var content = fs.readFileSync('./data.csv', { encoding: 'binary' });

p = require('papaparse');

var finalObject = {}

var Lines = {};

var csvdata = p.parse(content, {header: true, step: function(results, parser) {
    if(results.data[0].id.startsWith('ID_ABILITY')&&(results.data[0].id.endsWith('NAME')||results.data[0].id.endsWith('DESC'))) {
        if(!results.data[0].id.includes('FICTIONAL')){
            Lines[results.data[0].id]=results.data[0].translation;
        }
    } 
}});

AddAbility = function(hero, name) {
    var Ability = []
    var levels = (name === 'passive')?5:7;
    for(var i = 1; i<=levels; i++){
        var desc = "ID_ABILITY_"+hero.toUpperCase()+"_"+name.toUpperCase()+"_"+i+"_DESC";
        if(Lines.hasOwnProperty(desc)){
            Ability[i-1]=Lines[desc];
        }else{
            console.log("DEBUG: No Desc for level %i, using %s instead", i, Ability[i-2])
            Ability[i-1]=Ability[i-2];
        }
    }
    for(var i = 1; i<=levels; i++){
        Ability[i-1] = parseAbilityString(Ability[i-1], i, hero);
    }
    return Ability
}

parseAbilityString = function(string, level, hero) {
    var reg = /\{(.+?)\}/
    var newstring = ''
    var match = reg.exec(string)
    while (match != null) {
        newstring = string.replace(/\{(.+?)\}/, getDataForElement(match[1],hero, level))
        match = reg.exec(newstring)
        string = newstring
    }
    return string
}

getDataForElement = function(ele, hero, level) {
    var string = ele.replace(/\.action\./g, '.actions.')
    var objectPropArray = string.split('.')

    var dobj = chars.Data[hero]
    objectPropArray.shift()
    objectPropArray.forEach(function (pobj) {
    dobj = tempmethod(dobj, pobj, level)
    })
    var final
    if (Array.isArray(dobj)) {
    final = dobj[level - 1]
    } else {
    final = dobj
    }
    return final
}

tempmethod = function (dobj, pobj, level) {
    var step
    (isNaN(parseInt(pobj))) ? step = pobj : step = parseInt(pobj)
    if (dobj.hasOwnProperty(step)) {
      return dobj[step]
    } else {
      if (['p', 't', 'f'].includes(step)) {
        console.log('DEBUG: ' + step + ' is p, t, or f.  Need to apply level on %o', dobj)
        if(!isNaN(parseInt(dobj))){
            console.log("DEBUG: Parseint returned true for %o", dobj)
            return dobj
        }
        if(Array.isArray(dobj)){
            if(dobj.length===1){
                dobj = dobj[0];
            }else{
                dobj = dobj[level - 1];
            }
        }
        if (dobj.hasOwnProperty(step)) {
          return dobj[step]
        }
      }
      console.log('%o does not have ' + step + ' property.  Might be an issue.  Returning', dobj)
      return dobj
    }
  }

  console.log(Lines);
  
  Object.keys(heroes).forEach(Hero => {
      var h = {}
      h["Name"] = heroes[Hero].Display_Name;
      h["Playable"] = heroes[Hero].blacklist_mode;
      h["traits"] = chars.Data[Hero].traits;
      h["basic"] = AddAbility(Hero, "basic");
      h["special"] = AddAbility(Hero, "special");
      h["passive"] = AddAbility(Hero, "passive");
      if(chars.Data[Hero].hasOwnProperty('ultimate')){
          h["ultimate"] = AddAbility(Hero, "ultimate");
      }
      finalObject[heroes[Hero].id] = h;
  });
  
  var json = JSON.stringify(finalObject);
  
  fs.writeFile('test.json', json, 'utf8');