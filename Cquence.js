'use strict'

const Cq = (() => {
	const raf = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || ((f) => { setTimeout(f, 1000 / 60) })
	const elem = (id) => document.getElementById(id)

	// IE checking
	const IEVERSION = getInternetExplorerVersion()
	const IE8 = IEVERSION === 8
	const IEWTF = IEVERSION < 8 && IEVERSION > -1

	const style = (e, k, v) => {
		if (k === 'opacity') {
			if (IE8) {
				e.style['-ms-filter'] = `progid:DXImageTransform.Microsoft.Alpha(Opacity=${Math.floor(v * 100)})`
				e.style.filter = `alpha(opacity=${Math.floor(v * 100)})`
			} else {
				e.style[k] = v
			}
		} else {
			e.style[k] = `${v}px`
		}
	}

	const combine = () => {
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions_and_function_scope/arguments
		const list = Array.prototype.slice.call(arguments, 0)
		let d = 0
		for (let i = 0; i < list.length; i++) {
			d = Math.max(list[i].d, d)
		}
		return {
			d,
			f(t) {
				for (const last of list) {
					if (last.d > t) {
						last.f(t)
					} else if (!last.done) {
						last.f(last.d)
						last.done = true
					}
				}
			}
		}
	}

	const sequence = () => {
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions_and_function_scope/arguments
		const timeline = Array.prototype.slice.call(arguments, 0)
		let d = 0
		for (let i = 0; i < timeline.length; i++) {
			d += timeline[i].d
		}
		return {
			d,
			f(t) {
				let last = null
				let total = 0

				for (let i = 0; i < timeline.length; i++) {
					last = timeline[i]
					if (total + last.d > t) {
						last.f(t - total)
						return
					}
					if (!last.done) {
						last.f(last.d)
						last.done = true
					}
					total += last.d
				}
			}
		}
	}

	const animate = (transform) => (id, dur, begin, fin) => ({
		d: dur,

		f(t) {
			const e = elem(id)
			for (const k in begin) {
				const bv = begin[k] // Begin waarde
				const fv = fin[k]   // Finish waarde
				const dx = fv - bv  // Verschil (afstand)

				// p is nu een waarde tussen de 0 en 1 .. en geeft aan hoe ver de animatie is
				const p = transform(Math.max(t / dur, 0))

				// Nieuwe waarde is de factor maal de afstand
				const nv = bv + (p * dx)
				style(e, k, nv)
			}
		}
	})

	// Animation variants
	// http://upshots.org/actionscript/jsas-understanding-easing
	const linear = animate((p) => p)
	const easeIn = animate((p) => p ** 5)
	const easeOut = animate((p) => 1 - (1 - p) ** 5)
	const sleep = (d) => ({
		d,
		f(t) {}
	})

	/* From: http://stackoverflow.com/questions/10964966/detect-ie-version-in-javascript */
	// Returns the version of Internet Explorer or a -1
	// (indicating the use of another browser).
	function getInternetExplorerVersion() {
		let rv = -1 // Return value assumes failure.
		if (navigator.appName === 'Microsoft Internet Explorer') {
			const re = new RegExp('MSIE ([0-9]{1,}[.0-9]{0,})')
			if (re.exec(navigator.userAgent) !== null) {
				rv = parseFloat(RegExp.$1)
			}
		}
		return rv
	}

	const timeline = []
	const start = (Number(new Date())) // Unix timestamp
	const second = 1000
	const stop = 15 * second
	const render = null

	// Gets called recursive by request-animation-frame
	const renderloop = () => {
		// Console.log('1. ', window.render );
		const now = (Number(new Date())) - start      // Relatieve tijd vanaf begin animatie
		if (now < stop) {
			raf(renderloop)
		}
		// Console.log('2. ', window.render );
		if (window.render) {
			window.render.f(now)
		}
	}

	return {
		combine,
		sequence,
		linear,
		animate,
		easeIn,
		easeOut,
		sleep,
		renderloop
	}
})()
