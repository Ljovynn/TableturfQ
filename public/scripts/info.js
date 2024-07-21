import { matchModes, rulesets } from "../constants/matchData.js";
import { stageIdToName } from "../constants/stageData.js";

const bestOf = document.getElementById('ranked-best-of');
const starterList = document.getElementById('ranked-starters');
const counterPickList = document.getElementById('ranked-counters');
const counterPickAmount = document.getElementById('counterpick-amount');
const dsrEnabled = document.getElementById('dsr-enabled');

const aboutSection = document.getElementById('section-about');
const matchRulesSection = document.getElementById('section-match-rules');
const siteRulesSection = document.getElementById('section-site-rules');

// Set these by class so we can add any arbitrary number of them to the page
const aboutLinks = document.getElementsByClassName('about-link');
const matchRulesLinks = document.getElementsByClassName('match-rules-link');
const siteRulesLinks = document.getElementsByClassName('site-rules-link');

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

for ( let link of aboutLinks ) {
	link.addEventListener('click', (e) => {
		matchRulesSection.style.display = 'none';
		siteRulesSection.style.display = 'none';
		aboutSection.style.display = 'block';
	});
}

for ( let link of matchRulesLinks ) {
	link.addEventListener('click', (e) => {
		siteRulesSection.style.display = 'none';
		aboutSection.style.display = 'none';
		matchRulesSection.style.display = 'block';
	});
}

for ( let link of siteRulesLinks ) {
	link.addEventListener('click', (e) => {
		matchRulesSection.style.display = 'none';
		aboutSection.style.display = 'none';
		siteRulesSection.style.display = 'block';
	});
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