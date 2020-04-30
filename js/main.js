;(function () {
	
	'use strict';



	var isMobile = {
		Android: function() {
			return navigator.userAgent.match(/Android/i);
		},
			BlackBerry: function() {
			return navigator.userAgent.match(/BlackBerry/i);
		},
			iOS: function() {
			return navigator.userAgent.match(/iPhone|iPad|iPod/i);
		},
			Opera: function() {
			return navigator.userAgent.match(/Opera Mini/i);
		},
			Windows: function() {
			return navigator.userAgent.match(/IEMobile/i);
		},
			any: function() {
			return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
		}
	};

	var getHeight = function() {
		var extraHeight = 0;

		if ( isMobile.any() ) extraHeight = 50;
		
		setTimeout(function(){
			$('#fh5co-main').stop().animate({
				'height': $('.fh5co-tab-content.active').height() + extraHeight
			});
		}, 200);
	};

	var pieChart = function() {
		$('.chart').easyPieChart({
			scaleColor: false,
			lineWidth: 10,
			lineCap: 'butt',
			barColor: '#0bc1e6',
			trackColor:	"#000000",
			size: 160,
			animate: 1000
		});
	};

	var tabContainer = function() {
		getHeight();
		$(window).resize(function(){
			getHeight();
		})
	};

	var tabClickTrigger = function() {
		$('.fh5co-tab-menu a').on('click', function(event) {
			event.preventDefault();
			var $this = $(this),
				data = $this.data('tab'),
				pie = $this.data('pie');

			// add/remove active class
			$('.fh5co-tab-menu li').removeClass('active');
			$this.closest('li').addClass('active');

			$('.fh5co-tab-content.active').addClass('animated fadeOutDown');

			setTimeout(function(){
				$('.fh5co-tab-content.active').removeClass('active animated fadeOutDown fadeInUp');
				$('.fh5co-tab-content[data-content="'+data+'"]').addClass('animated fadeInUp active');
				getHeight();
			}, 500);

			if ( pie === 'yes' ) {
				setTimeout(function(){
					pieChart();
				}, 800);
			}
			
		})
	};

	// Document on load.
	$(function(){
		tabContainer();
		tabClickTrigger();

	});


}());
//////////////////////////////////////////////////////////////////////////////:

"use strict";

window.addEventListener("load",function() {

	let idAnim;

	const nbParticles = 50;
	const initSpeed = 1;
	const rMin = 35;
	const rMax = 50;
	const dimSVG = rMax * 2 + 5;
	const NS = "http://www.w3.org/2000/svg";

	let maxx, maxy;  // canvas sizes (in pixels)
	let particles;
	let click;
	let initDir;
	let noiseInitDir;
	let initHue;
	let noiseInitHue;
	let mouseX = -100, mouseY = -100; // init to unreachable value
	let svg;
	let elems; // array of shapes
	let vertices;
	let polygons;
	let stars;
	let pathHeart;
	let pathSpades;

// shortcuts for Math.…

	const mrandom = Math.random;
	const mfloor = Math.floor;
	const mround = Math.round;
	const mceil = Math.ceil;
	const mabs = Math.abs;
	const mmin = Math.min;
	const mmax = Math.max;

	const mPI = Math.PI;
	const mPIS2 = Math.PI / 2;
	const m2PI = Math.PI * 2;
	const msin = Math.sin;
	const mcos = Math.cos;
	const matan2 = Math.atan2;

	const mhypot = Math.hypot;
	const msqrt = Math.sqrt;

	const rac3   = msqrt(3);
	const rac3s2 = rac3 / 2;
	const mPIS3 = Math.PI / 3;

//-----------------------------------------------------------------------------
// miscellaneous functions
//-----------------------------------------------------------------------------

	function alea (min, max) {
// random number [min..max[ . If no max is provided, [0..min[

		if (typeof max == 'undefined') return min * mrandom();
		return min + (max - min) * mrandom();
	}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	function intAlea (min, max) {
// random integer number [min..max[ . If no max is provided, [0..min[

		if (typeof max == 'undefined') {
			max = min; min = 0;
		}
		return mfloor(min + (max - min) * mrandom());
	} // intAlea

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	function roundedValue (x, nb) {
		/* nb integer >= 0 : places after decimal point (no decimal point if == 0)
        non-significant 0 removed  after decimal point, decimal point removed too if only followed by zeroes
        returns string
        */
		let s;
		let x0 = x;
		let sign ='';
		for (let k = 0; k < nb; ++k) x *= 10;
		s = mround(x).toString();
		if (nb == 0) return s;
		if (s.indexOf('e') != -1) return x0.toString(); // too lazy to manage scientific notation
		if (s.charAt(0) == '-') { // take sign apart if any
			sign = '-';
			s = s.substring(1);
		} // if < 0
		while (s.length < nb + 1 ) s = '0' + s; // add 0 to the left if less than nb figures
		s = s.substring(0, s.length - nb) + '.' + s.substring(s.length - nb);
		/* remove useless zeroes */
		while (s.charAt(s.length - 1) == '0') s = s.substring(0, s.length - 1);
		/* remove final '.' */
		if (s.charAt(s.length - 1) == '.') s = s.substring(0, s.length - 1);
		return sign + s;
	} // roundedValue

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	function NoiseGen(rndFunc, period, nbHarmonics, attenHarmonics, lowValue = 0, highValue = 1) {

		/* this function returns a function which can be used as a noise generator
           the returned functions takes no parameter : it is supposed to be called for
           consecutive, evenly spaced points of time or space.
        - rndFunc is the random generator function used. It must return a value in the range
        [0..1[. If a falsy value is provided (0, false, null, undefined..) Math.random will be used.
        - period determines the speed of variation of the returned value. The higher
        period is, the slowlier the value will change in the noise signal. It must be
        a positive, non zero value (typically a few hundreds).
        - nbHarmonics is an integer giving the number of harmonics used to generate the signal.
        With 0 or 1, a single, smooth signal will be generated
        With 2 or more, internally generated signals of periods up to period / 2, period / 3, will be added.
        nbHarmonics should be kept as low as possible, since every added harmonic increases the
        computation time significantly.
        - attenHarmonics is a float number which should stay in the interval 0..1.
        During harmonics generation, the amplitude of the signal is multiplied by
        attenHarmonics, with respect to the immediatly lower level harmonic.
        attenHarmonics = 0 results in no harmonics at all. attenHarmonics > 1 results in
        harmonics greater than the fundamental, whith the highest harmonics beeing the
        most important. This is not usually the desired behaviour.
        lowValue and highValue are optional floating values. Despite the names, it
        it is not required that highValue > lowValue. The
        returned value will be scaled to the range lowValue..highValue
        (without strict warranty about the limits beeing reached or exceeded, due to
        the finite precision of floating numbers)

        */

		let arP0 = [];  // 'preceeding value' for each harmonic
		let arP1 = [];  // 'succeding value'
		let amplitudes = []; // amplitudes oh harmonics
		let increments = []; // n / period, wich will be added to phases for every point
		let phases = [];
		let globAmplitude = 0;
		if (!rndFunc) rndFunc = Math.random; // default value for rndFunc
		if (nbHarmonics < 1) nbHarmonics = 1;

		for (let kh = 1; kh <= nbHarmonics; ++ kh) {
			arP0[kh] = rndFunc();
			arP1[kh] = rndFunc();
			amplitudes[kh] = (kh == 1) ? 1 : (amplitudes[kh - 1] * attenHarmonics);
			globAmplitude += amplitudes[kh];
			increments[kh] = kh / period;
			phases[kh] = rndFunc();
		} // for kh

		/* normalize amplitudes */
		amplitudes.forEach ((value, kh) => amplitudes[kh] = value / globAmplitude * (highValue - lowValue))

		/* returned function here */
		return function () {
			let pf, pfl;
			let signal = 0;
			for (let kh = nbHarmonics; kh >= 1; --kh) {
				pf = phases[kh] += increments[kh];
				if (phases[kh] >= 1) {
					pf = phases[kh] -= 1;
					arP0[kh] = arP1[kh];
					arP1[kh] = rndFunc();
				} // if full period reached
				pfl = pf * pf * (3 - 2 * pf); // always 0..1, but smoother
				signal += (arP0[kh] * (1 - pfl) + arP1[kh] * pfl) * amplitudes[kh];
			} // for kh
			return signal + lowValue;
		} // returned function
	} // NoiseGen

//-----------------------------------------------------------------------------
	function Particle (k) {

		let c, npts, s;

		let hue = (initHue + alea(-2,2)) % 180;

		this.x = maxx / 2;
		this.y = maxy / 2;
		this.dir = initDir + alea(-mPI / 10, mPI / 10);

		this.speed = initSpeed * alea(0.8, 1.4);

		this.genddir = NoiseGen(null, 100, 2, 0.8, -0.03, 0.03);

		this.genR = NoiseGen(null, 100, 1, 0, rMin, rMax);
		this.r0 = this.genR();
		this.r = 0.1;

		this.color1 = `hsl(${hue},100%,50%)`;
		this.color2 = `hsl(${hue},100%,80%)`;
		this.state = 0; // growth
		this.shape = intAlea(5);
		this.nSides = intAlea(3, 7) // used by polygons only
		this.orient = alea(m2PI);   // random orientation
		this.svg = elems[k];
		while (this.svg.firstChild) this.svg.removeChild(this.svg.firstChild);

		this.svg.setAttribute('stroke',this.color1);

		switch (this.shape) {
			case 0:
				c = document.createElementNS(NS,'circle');
				c.setAttribute('vector-effect','non-scaling-stroke');
				c.setAttribute('cx', 0);
				c.setAttribute('cy', 0);
				c.setAttribute('r', 1);
				break;
			case 1:
				npts = intAlea(3,10);
				c = document.createElementNS(NS,'polygon');
				c.setAttribute('vector-effect','non-scaling-stroke');
				c.setAttribute('points', polygons[npts]);
				break;
			case 2: // stars
				npts = [5, 7][intAlea(2)];
				c = document.createElementNS(NS,'polygon');
				c.setAttribute('vector-effect','non-scaling-stroke');
				c.setAttribute('points', stars[npts]);
				break;

			case 3: // heart
				c = document.createElementNS(NS,'path');
				c.setAttribute('vector-effect','non-scaling-stroke');
				c.setAttribute('d', pathHeart);
				break;

			case 4: // clubs
				c = document.createElementNS(NS,'path');
				c.setAttribute('vector-effect','non-scaling-stroke');
				c.setAttribute('d', 'M 0 0.25 L 0.3 0.8 L -0.3 0.8 z');
				this.svg.appendChild(c);
				c = document.createElementNS(NS,'circle');
				c.setAttribute('vector-effect','non-scaling-stroke');
				c.setAttribute('cx', -0.5);
				c.setAttribute('cy', 0.1);
				c.setAttribute('r', 0.35);
				this.svg.appendChild(c);
				c = document.createElementNS(NS,'circle');
				c.setAttribute('vector-effect','non-scaling-stroke');
				c.setAttribute('cx', 0.5);
				c.setAttribute('cy', 0.1);
				c.setAttribute('r', 0.35);
				this.svg.appendChild(c);
				c = document.createElementNS(NS,'circle');
				c.setAttribute('vector-effect','non-scaling-stroke');
				c.setAttribute('cx', 0);
				c.setAttribute('cy', -0.5);
				c.setAttribute('r', 0.35);
				break;
			case 5: // spades
				c = document.createElementNS(NS,'path');
				c.setAttribute('vector-effect','non-scaling-stroke');
				c.setAttribute('d', 'M 0 0.55 L 0.2 1 L -0.2 1 z');
				this.svg.appendChild(c);
				c = document.createElementNS(NS,'path');
				c.setAttribute('vector-effect','non-scaling-stroke');
				c.setAttribute('d', pathSpades);
				break;
		}
		this.svg.appendChild(c);

	} // Particle

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	Particle.prototype.move = function () {

		this.dir = (this.dir + this.genddir()) % m2PI;
		this.speed += 0.01;

		this.x += this.speed * mcos(this.dir);
		this.y += this.speed * msin(this.dir);

		if (this.y < -this.r || this.y > maxy + this.r || this.x < -this.r || this.x > maxx + this.r) return false;

		if (this.state != 2) { // if not yet exploding, test mouse distance
			let dx = mouseX - this.x;
			let dy = mouseY - this.y;
			if (mhypot (dx, dy) <= this.r) {
				this.state = 2;
				this.r1 = 0;
			}
		}

		switch (this.state) {
			case 0 : this.r += 0.2;
				if (this.r > this.r0 ) this.state = 1;
				break;
			case 1 : this.r = this.genR();
				break;
			case 2 : return false; // the end
		}

		return true;
	} // Particle.move

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	Particle.prototype.draw = function () {

		this.svg.setAttribute('transform',`translate(${this.x} ${this.y}) scale(${this.r})`);

	} // Particle.draw

//-----------------------------------------------------------------------------
	function createElems() {

// creates empty g element with basic properties

		let c;
		elems = [];
		for (let k = 0 ; k < nbParticles; ++k) {
			elems[k] = document.createElementNS(NS,'g');
			svg.appendChild(elems[k]);
			svg.setAttribute('stroke-width',2);
			svg.setAttribute('fill', 'none');

//    c.setAttribute('fill', 'none');
		} // for k

	} // createSVGs

//-----------------------------------------------------------------------------
// returns false if nothing can be done, true if drawing done

	function startOver() {

// dimensions

		maxx = window.innerWidth;
		maxy = window.innerHeight;

		if (maxx < 10) return false;

		svg.setAttribute("width", `${maxx}`);
		svg.setAttribute("height", `${maxy}`);

		createElems();

		noiseInitDir = NoiseGen(null, 200,0,0,-0.03,0.03);
		noiseInitHue = NoiseGen(null, 500,1,0.8,-2,2);

		particles = [];

		initDir = alea(m2PI);
		initHue = alea(360);

		return true; // ok

	} // startOver

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	function mouseMove(event) {

		mouseX = event.clientX;
		mouseY = event.clientY;
	}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	function animate(tStamp) {
		if (idAnim) window.cancelAnimationFrame(idAnim);
		idAnim = undefined;

		if (click && startOver()) click = false;
		if (particles) {
			initDir += noiseInitDir();
			initDir %= m2PI;
			initHue += noiseInitHue();
			initHue %= 360;

			if (particles.length < nbParticles) {
				particles[particles.length] = new Particle(particles.length);
			}
			particles.forEach((part,k) => {
				if (part.move() == false ) {
					particles[k] = new Particle(k);
					particles[k].draw();
				} else part.draw();
			});
		}
		idAnim = window.requestAnimationFrame(animate);

	} // animate
//------------------------------------------------------------------------
//------------------------------------------------------------------------
// beginning of execution

	window.addEventListener('mousemove',mouseMove);
	svg = document.createElementNS(NS,'svg');
	document.body.appendChild(svg);

// pre-compute polygons shapes
	vertices = [];
	polygons = [];
	for (let nb = 3; nb < 10; ++ nb) {
		vertices[nb] = [];
		polygons[nb] = '';
		for (let k = 0; k < nb; ++k) {
			vertices[nb][k] = roundedValue(mcos(m2PI * k / nb - mPIS2), 3) + ',' + roundedValue(msin(m2PI * k / nb - mPIS2), 3);
			polygons[nb] += ' ' + vertices[nb][k];
		}
	}

	stars = [];
	stars[5] = vertices[5][0] + ' ' + vertices[5][2] + ' ' + vertices[5][4] + ' ' + vertices[5][1] + ' ' + vertices[5][3];
	stars[7] = vertices[7][0] + ' ' + vertices[7][3] + ' ' + vertices[7][6] + ' ' + vertices[7][2] + ' ' + vertices[7][5] + ' ' + vertices[7][1] + ' ' + vertices[7][4];

	pathSpades =('M -0.9,0.4 A 0.45,0.45 0,0,0 0,0.4 A 0.45,0.45 0,0,0 0.9,0.4 Q 0.8,0 0,-1 Q -0.8,0 -0.9,0.4 z');
// launch animation
	animate();
	click = true; // to run startOver


}); // window load listener



