let constants = (function() {
	let consts =  {
		alphabets : '_ABCDEFGHIJKLMNOPQRSTUVWXYZ',
		domIds: {
			input: {
				word	: '#word',
				value 	: '#value',
				exec 	: '#input'
			},
			history: {
				className: '.input-history'
			},
			actions: {
				identifyLetters: '#find',
				probableLetters: '#close'
			},
			output: {
				textArea: 'textarea'
			}
		},
		htmlSyntax: {
			green		: '<span class="text-primary">',
			white		: '<span class="text-white">',
			yellow		: '<span class="text-warning">',
			closeSpan	: '</span>'
		}
	}

	consts.misc =  {
		colors	: { 
			'0' : consts.htmlSyntax.white, 
			'1' : consts.htmlSyntax.yellow,
			'2' : consts.htmlSyntax.green
		}
	}

	return consts
})()

let logicExecutor = (function() {
	
	let model = {}

	function letterWeightInitials(letters){
		let letter_weight = {}
		for(let i = 0; i<constants.alphabets.length; i++) {
			letter_weight[letters[i]] = 0
		}
		return letter_weight
	}

	function calculateLetterWeights(dict, letters) {
		let letter_weight = letterWeightInitials(letters);
		for(let word in dict) {
			word.split('').forEach(l=>letter_weight[l]+=1)
		}
		return letter_weight
	}

	let parseMissingRepeat = function(letter, input, value) {
		let idxs = []
		for(let i = 0; i<input.length; i++) {
			if(input[i]===letter) idxs.push(i)
		}
		positions =  [[],[],[]]
		idxs.forEach(idx=>positions[value[idx]].push(idx))
		if(positions[1].length==0 && positions[2].length==0) return;
		positions[0].forEach(idx=>{
			addValueToCache(letter, idx, '1')
		})
		positions[1].forEach(idx=>{
			addValueToCache(letter, idx, '1')
		})
		positions[2].forEach(idx=>{
			addValueToCache(letter, idx, '2')
		})
		if(positions[2].length > 0 && positions[1].length == 0) {
			for(let i = 0; i<input.length; ++i) {
				if(positions[2].indexOf(i)!==-1) continue;
				addValueToCache(letter, i, '1')
			}
		}
	}

	let addValueToCache = function(letter, idx, type) {
		let obj;
		if(type==='1') obj = model.cache.wrongPosition;
		else if(type==='2') obj = model.cache.found;
		posArr = obj[letter]
		if(posArr === undefined) posArr = new Set()
		posArr.add(idx);
		obj[letter] = posArr
	}

	let parseInputs = function() {
		let inputs = model.inputs
		let latestInputIdx = inputs.length - 1
		let latestInput = inputs[latestInputIdx]

		let word = latestInput.word, value = latestInput.value
		for(let i = 0; i < word.length; i++) {
			switch(value[i]) {
				case '0': {
					let repeat = parseMissingRepeat(word[i], word, value)
					if(!repeat) model.cache.missing.add(word[i])
					break;
				}
				case '1': 
				case '2': {
					addValueToCache(word[i], i, value[i])
				}
			}
		}
	}

	let addInput = function(inputs) {
		model.inputs.push(inputs)
		parseInputs()
	}
	
	// initialize everything
	let initialize = function() { 
		let cache = {
			// contains letters that are missing in actual word
			missing: new Set(),

			// key : letter & value : set of incorrect positions
			wrongPosition: {},

			// key : letter & value : set of correct positions
			found: {}
		}

		let potentialLetters = constants.alphabets

		let inputs = [ 
			// { input: 'sanes', result: '01010' }
		]

		model = {
			cache,
			inputs,
			potentialLetters
		}
		return model
	}

	let main = function() {
		this.model = initialize();
		return this;
	}

	return {
		main,
		addInput
	}
})();

let htmlExecutor = (function() {

	// get inputs when button is pressed
	let fetchInput = function(model) {
		let word = $(constants.domIds.input.word).val().toUpperCase();
		let value = $(constants.domIds.input.value).val().toUpperCase();
		return { 
			word, 
			value
		};
	}
	let fetchInputRunner = function() {fetchInput()}

	// see what words were entered previously
	let getHtmlForInput = function(word, value) {
		let spans = []
		for(let i = 0; i < word.length; i++) {
			spans.push(constants.misc.colors[value[i]] 
				+ word[i] 
				+ constants.htmlSyntax.closeSpan)
		}
		return spans.join('')
	}

	let setHistory = function(inputs) {
		let doms = $('.input-history');
		let htmls = []
		inputs.forEach(input=>{
			htmls.push(getHtmlForInput(input.word, input.value))
		})
		let inputHistoryDoms = $(constants.domIds.history.className)
		if(inputHistoryDoms.length<inputs.length) {
			alert("Please reset board.");
			return;
		}
		for(let i = 0; i<htmls.length && i<inputHistoryDoms.length; i++) {
			$(inputHistoryDoms[i]).html(htmls[i])
		}
	}

	return {
		constants,
		setHistory,
		fetchInput
	}
})()

let predictor = (function() {

	let words = window.words

	let filterByMissingLetters = function(words, missing) {
		return words.filter(word=> {
			for(let letter in missing) {
				if(word.indexOf(letter) !== -1) {
					return false
				}
			}
			return true
		})
	}

	let filterByPotentialLetters = function(words, potentialLetters) {
		return words.filter(word=>{
			for (let letter in potentialLetters) {
				let positions = potentialLetters[letter];
				for (let position of positions) {
					if(word[position] == letter) {
						return false
					}
				}
			}
			return true
		})
	}

	let filterMissingPotentialLetters = function(words, potentialLetters) {
		let k= words.filter(word=> {
			for(let letter in potentialLetters) {
				if(word.indexOf(letter)===-1) return false;
			}
			return true;
		})
		console.log(words.length, k.length)
		return k
	}

	console.log(filterByPotentialLetters(['SANES', 'AINEE'], {'E': new Set([3])}))

	let filterByFixedLetters = function(words, fixedLetters) {
		return words.filter(word=>{
			for (let letter in fixedLetters) {
				let positions = fixedLetters[letter]
				for (let position of positions) {
					if(word[position] !== letter) {
						return false
					}
				}
			}
			return true
		})
	}

	let getPossibleWords = function(model) {
		let range = [...words]
		range = filterByMissingLetters(range, model.cache.missing)
		range = filterByPotentialLetters(range, model.cache.wrongPosition)
		range = filterMissingPotentialLetters(range, model.cache.wrongPosition)
		return filterByFixedLetters(range, model.cache.found)
	}

	let WEIGHT_TYPES = {
		IDENTIFIER: 'identifier',
		PROBABLE: 'probable'
	}

	let LETTER_TYPE_NAMES = {
		MISSING: 'missing',
		POTENTIAL: 'potential',
		FOUND: 'found',
		UNKNOWN: 'unknown'
	}

	let probable_weights = {
		[LETTER_TYPE_NAMES.MISSING]: -10,
		[LETTER_TYPE_NAMES.POTENTIAL]: 5,
		[LETTER_TYPE_NAMES.FOUND]: 10,
		[LETTER_TYPE_NAMES.UNKNOWN]: 1
	}

	let identifier_weights = {
		[LETTER_TYPE_NAMES.MISSING]: 0,
		[LETTER_TYPE_NAMES.POTENTIAL]: 0,
		[LETTER_TYPE_NAMES.FOUND]: 0,
		[LETTER_TYPE_NAMES.UNKNOWN]: 1
	}

	let findLetterPower= function(letter, missing, potential, found, type) {
		let weights;
		if(type==WEIGHT_TYPES.IDENTIFIER) {
			weights = identifier_weights
		} else if (type==WEIGHT_TYPES.PROBABLE) {
			weights = probable_weights
		}

		if(missing.has(letter)) return weights[LETTER_TYPE_NAMES.MISSING];
		else if(potential.indexOf(letter) !== -1) return weights[LETTER_TYPE_NAMES.POTENTIAL];
		else if(found.indexOf(letter) !== -1) return weights[LETTER_TYPE_NAMES.FOUND];
		else return weights[LETTER_TYPE_NAMES.UNKNOWN]
	}

	let getLetterWeights = function(index, letter, model) {
		let weight = 10;
		if(model.cache.missing[letter]!==undefined) return -weight;
		else if(model.cache.found[letter]!== undefined && model.cache.found[letter].has(index)) return weight;
		else if(model.cache.wrongPosition[letter] !== undefined){
			if(model.cache.wrongPosition[letter].has(index)) return -weight;
			else return weight;
		}
		else return 1;
	}

	let getProbableWords = function(model, count=10) {
		let range = getPossibleWords(model)
		let wordPower = {}

		range.forEach(word=>{
			let power = 0;
			for(let idx in word) {
				power+=getLetterWeights(idx, word[idx], model)
			}
			wordPower[word] = power
		})


		range.sort((a,b)=>wordPower[b] - wordPower[a])
		let words = range.slice(0,count)

		let probableWords = {}
		for(let i = 0; i< count; i++) {
			probableWords[words[i]] = wordPower[words[i]]
		}

		return probableWords
	}



	d = {
		    "cache": {
		        "missing": new Set(['S','A','N','S','K','V','M','L','T','R','Y','C','O']),
		        "wrongPosition": {
		            "E": new Set([2, 4]),
		            "R": new Set([0,2])
		        },
		        "found": {
		            "E": new Set([3, 1]),
		            "D": new Set([0]),
		            "R": new Set([4])
		        }
		    },
		    "inputs": [
		        {
		            "word": "SANES",
		            "value": "00010"
		        },
		        {
		            "word": "KEEVE",
		            "value": "02100"
		        },
		        {
		            "word": "MERLE",
		            "value": "02101"
		        },
		        {
		            "word": "RETRY",
		            "value": "12000"
		        },
		        {
		            "word": "DECOR",
		            "value": "22002"
		        }
		    ],
		    "potentialLetters": "_ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	}
	console.log(getPossibleWords(d))
	console.log(getProbableWords(d))

	return {
		identifyProbableWordPowers: getProbableWords
	}
})();


logicExecutor.main()

$(constants.domIds.input.exec).click(function() {
	logicExecutor.addInput(htmlExecutor.fetchInput());
	htmlExecutor.setHistory(logicExecutor.model.inputs);
	console.log(logicExecutor.model)
	$(constants.domIds.input.word).val("")
	$(constants.domIds.input.value).val("")
});

// $(constants.domIds.actions.identifyLetters).click(function() {
// 	let letterPowers = predictor.identifyLetterPowers(logicExecutor.model);
// 	let output = '';
// 	Object.keys(letterPowers).forEach(letter=>output+=letter+':'+letterPowers[letter]+',\t')
// 	$(constants.domIds.output.textArea).val(output)
// });

$(constants.domIds.actions.probableLetters).click(function() {
	let wordPowers = (predictor.identifyProbableWordPowers(logicExecutor.model, 30))
	let output = '';
	Object.keys(wordPowers).forEach(letter=>output+=letter+':'+wordPowers[letter]+',\t')
	$(constants.domIds.output.textArea).val(output)
});


/*
 * Identify Letters : Find which letters are best to gamble with
 * - Remove words that contain any missing letters
 * - Remove words that don't contain present letters
 * - Remove words that don't have correct position for known letters 
 * - Find power of remaining letters (known & unknown)
 */


/* 
 * Most Probable : Suggest words that are most probable given current data
 * - Identify Letters
 * - Find most probable words using following parameters
 *   + Contains high-power letters (so higher chance this letter also matches)
 *   + Explore positioning for unknown positions by giving points to locations
 */