import { matchModes, rulesets } from "../constants/matchData.js";
import { stageIdToName } from "../constants/stageData.js";

const bestOf = document.getElementById('ranked-best-of');
const starterList = document.getElementById('ranked-starters');
const counterPickList = document.getElementById('ranked-counters');
const counterPickAmount = document.getElementById('counterpick-amount');
const dsrEnabled = document.getElementById('dsr-enabled');

// Just the map for set length -> best of N
var bestOfSets = {
    1: 1,
    2: 3,
    3: 5,
    4: 7
};

var rankedRules = rulesets[ matchModes['ranked'] ];

console.log(rankedRules);
bestOf.innerHTML = bestOfSets[rankedRules.setLength];

getStageList(starterList, 'starterStagesArr');
getStageList(counterPickList, 'counterPickStagesArr');

counterPickAmount.innerHTML = rankedRules.counterPickBans;

if ( !rankedRules.dsr ) {
	dsrEnabled.style.display = 'none';
}

async function getStageList(stageElement, stageList) {
	var stages = rankedRules[stageList];
	var stageString = '';

	var i = 1;
	console.log(stages.length);
	for ( let stage of stages ) {
		console.log(i);
		stageString += stageIdToName[stage];

		// Formatting
		if ( i < stages.length )
			stageString += ',';

		if ( i == stages.length - 1 ) {
			stageString += ' and '
		} else {
			stageString += ' ';
		}

		i++
	}

	stageElement.innerHTML = stageString.trim();
}