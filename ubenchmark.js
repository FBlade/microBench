(function(bindTo) {

	const block_duration = 500; // do benchmark in blocks of 'block_duration' milliseconds 

	const formatNumber = function(value) {
		value = value.toString();
		var blocks = [];
		do {
			blocks.unshift(value.slice(-3));
			value   = value.slice(0,-3);
		} while (value);

		return blocks.join(',');
	};

	const timeFn = function(_fn,_N) {
		const fn = _fn, N  = _N;  // in case JS compiler optimizes for it

		const tic = new Date();
		for (var n = 0; n < N; n++) fn();
		return new Date() - tic;
	};

	const calibrateFn = function(fn) {
		const duration = 100;	// minimum test duration (milliseconds) to estimate op/sec
		var N = 2, elapsed = 0;

		do {	
			N = Math.floor( N * ( elapsed ? 1.1*duration/elapsed : duration ) );
			elapsed = timeFn(fn,N);
		} while ( elapsed < duration );

		return Math.floor( N / elapsed );	// estimated op/millisecond over 'duration' milliseconds
	};

	const uBenchmark = function(fn, _args, _title, _duration) {
		var args, title, duration;

		// parse arguments
		for(let param, i = 1, I = arguments.length; i < I; i++) {
			param = arguments[i];
			if ( Array.isArray(param)  )
				args = param;
			else switch ( param.constructor ) {
				case Number: duration	= param; continue;
				case String: title 		= param; continue;
			};
		}

		args 	 = args  || [];
		title 	 = title || (fn||{}).name;
		duration = (duration || 2) * 1000;

		fn = ( typeof fn === 'string' ) ? new Function(fn) : ( fn || function(){} );
		var fnString = fn.toString();

		if (args.length > 0)  //bind arguments
			fn = Function.bind.apply(fn, [null].concat(args));

		// estimate op/sec and calculate # iteration for desired block duration
		const N = calibrateFn(fn) * block_duration;

		// benchmark fn
		const I = Math.ceil( duration / Math.min(block_duration,duration) );
		var   i = 0, elapsed = 0;

		while (i++ < I)
			elapsed += timeFn(fn,N);

		// calculate results
		const ops = Math.round( 1000 * I * N / elapsed );
		const uSeconds = Math.round( 1e6/ops * 10000 ) / 10000; //round to 1/10th of nanosecod

		const results = { 'op/sec': formatNumber(ops),  microseconds: uSeconds, ops:ops, fn : fnString };
		if (title) results.title = title;
		return results;
	}

	calibrateFn(function(){});	// make sure everything is loaded into memory
	bindTo.uBench = uBenchmark;

})(window);

