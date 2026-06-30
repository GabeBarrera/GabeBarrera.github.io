const SECTIONS = document.querySelectorAll('section')
const ANCHORS = document.querySelectorAll('#nav a')
const POPOVER = document.querySelector('#nav')

SECTIONS.forEach((s, index) => {
  s.style.viewTransitionName = `section--${index}`
})

let exposed = false
const LAUNCH = (event) => {
  if (event) {
    exposed = event.newState === 'open' ? true : false
  } else {
    exposed = false
    POPOVER.hidePopover()
  }
  document.startViewTransition(() => {
    document.body.dataset.exposed = exposed
  })
}

const SELECT = event => {
  ANCHORS.forEach(ANCHOR => {
    ANCHOR[event.currentTarget.href === ANCHOR.href ? 'setAttribute' : 'removeAttribute']('autofocus', true)
  })
  SECTIONS.forEach(SECTION => {
    SECTION.dataset.current = event.currentTarget.getAttribute('href') === SECTION.id ? true : false
  })
  LAUNCH()
}

ANCHORS.forEach(anchor => anchor.addEventListener('click', SELECT))


POPOVER.addEventListener('beforetoggle', LAUNCH)

/* Phone numbers: confirm before dialing */
document.querySelectorAll('[data-tel]').forEach(el => {
  el.addEventListener('click', (e) => {
    e.preventDefault()
    const num = el.getAttribute('data-tel')
    if (window.confirm(`Call ${num}?`)) {
      window.location.href = 'tel:' + num.replace(/[^+\d]/g, '')
    }
  })
})

/* Career map */
const CAREER = [
  {
    years: '2011 \u2013 2015',
    name: 'Steele Canyon High School',
    role: 'High School Diploma',
    addr: '12440 Campo Rd, Spring Valley, CA 91978',
    desc: 'Graduated with honors.',
    detail: 'Where it all started \u2014 a charter high school in the hills east of San Diego. I graduated with honors while loading up on AP STEM coursework and getting my first real taste of writing code.',
    highlights: ['Graduated with honors', 'AP coursework across STEM', 'First taste of programming'],
    lat: 32.73044007874343, lng: -116.92527658589
  },
  {
    years: '2014',
    name: 'Senomyx',
    role: 'Chemist (Intern)',
    addr: '4767 Nexus Centre Dr, San Diego, CA 92121',
    desc: 'Titrated chemicals and created new food additive products.',
    detail: 'A summer at the bench in a flavor-science lab. As a chemist intern I titrated reagents, ran assays, and helped formulate novel food-additive compounds headed for taste testing.',
    highlights: ['Hands-on titration & assays', 'Helped formulate new additives', 'First professional lab role'],
    lat: 32.87747639593132, lng: -117.20172435382554
  },
  {
    years: '2015 \u2013 2019',
    name: 'San Diego State University',
    role: 'B.S. Computer Science',
    addr: '5500 Campanile Dr, San Diego, CA 92182',
    desc: 'Attended hackathons; built homemade recon & penetration tools in spare time; honed software development and cybersecurity skills.',
    detail: 'Four years earning a B.S. in Computer Science. Outside of class I lived at hackathons and spent late nights building homemade reconnaissance and penetration-testing tools \u2014 sharpening my engineering instincts and a growing obsession with security.',
    highlights: ['B.S. Computer Science', 'Competitive hackathon regular', 'Built custom recon & pentest tooling'],
    lat: 32.77570, lng: -117.07190
  },
  {
    years: '2016 \u2013 2017',
    name: 'Old Town Ice Cream',
    role: 'Ice Cream Scooper & Barista',
    addr: '2611 San Diego Ave, San Diego, CA 92110',
    desc: 'Served smiles in waffle cones and sold second winds in cups.',
    detail: 'The classic college job. Behind the counter of a busy Old Town shop I scooped cones, pulled espresso, and learned the unglamorous fundamentals of showing up, moving fast, and keeping people happy.',
    highlights: ['Scooped & ran the espresso bar', 'High-volume customer service', 'Open / close & cash handling'],
    lat: 32.753112864830584, lng: -117.19631980765807
  },
  {
    years: '2018 \u2013 Present',
    name: 'Port of San Diego',
    role: 'IT Intern \u2192 Systems Support Analyst \u2192 InfoSec Analyst I \u2192 InfoSec Analyst II',
    addr: '3165 Pacific Highway, San Diego, CA 92101',
    desc: 'Founding member of the Innovation Lab; current InfoSec team software developer and data analytics lead.',
    detail: 'Home base ever since. I joined as an IT intern and grew through Systems Support and two Information Security Analyst roles. A founding member of the Innovation Lab, I now serve as the InfoSec team\'s software developer and data-analytics lead \u2014 building tooling and turning security data into decisions.',
    highlights: ['Founding member, Innovation Lab', 'IT Intern \u2192 InfoSec Analyst II', 'InfoSec software dev & analytics lead'],
    lat: 32.73567805024912, lng: -117.1771063400875
  }
]

const initCareer = () => {
  const el = document.getElementById('career-map')
  if (!el || !window.L || el.dataset.ready) return
  el.dataset.ready = '1'

  const map = L.map(el, {
    zoomControl: false,
    attributionControl: true,
    scrollWheelZoom: true,
    fadeAnimation: false
  }).setView([32.78, -117.13], 11)

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '\u00A9 OpenStreetMap, \u00A9 CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map)

  const popupHTML = (e) => `
    <div class="pop">
      <div class="pop__years">${e.years}</div>
      <h3 class="pop__name">${e.name}</h3>
      ${e.role ? `<div class="pop__role">${e.role}</div>` : ''}
      <div class="pop__addr">${e.addr}</div>
      <p class="pop__desc">${e.desc}</p>
      <button type="button" class="pop__more" data-i="${CAREER.indexOf(e)}">Read More \u2192</button>
    </div>`

  const markers = CAREER.map(e => {
    const m = L.circleMarker([e.lat, e.lng], {
      radius: 8,
      color: '#ffffff',
      weight: 2,
      fillColor: '#b07cff',
      fillOpacity: 0.95
    }).addTo(map)
    m.bindPopup(popupHTML(e), {
      className: 'career-pop',
      autoClose: false,
      closeOnClick: false,
      autoPan: false,
      maxWidth: 250
    })
    m.on('click', () => {
      const i = CAREER.indexOf(e)
      if (timelineMode) { goTo(i); if (autoOn) armAuto() }
    })
    return m
  })

  const bounds = L.featureGroup(markers).getBounds()
  const timelineEl = document.getElementById('career-timeline')
  const btns = document.querySelectorAll('.career__btn')
  const career = document.getElementById('#career')

  // controls / state
  const progressEl = document.getElementById('career-progress')
  const progressFill = progressEl.querySelector('span')
  const sidebar = document.getElementById('career-sidebar')
  const sbList = document.getElementById('career-sb-list')
  const sbDetail = document.getElementById('career-sb-detail')
  const LINGER = 10000

  let timelineMode = true
  let step = 0
  let autoOn = false
  let advanceTimer = null

  const closeAll = () => markers.forEach(m => m.closePopup())
  const setActiveChip = (i) => chips.forEach((c, idx) => c.classList.toggle('is-active', idx === i))
  const setActiveSbItem = (i) => sbItems.forEach((it, idx) => it.classList.toggle('is-active', idx === i))

  const goTo = (i, animate = true) => {
    step = i
    setActiveChip(i)
    setActiveSbItem(i)
    closeAll()
    if (animate) map.flyTo([CAREER[i].lat, CAREER[i].lng], 14, { duration: 0.8 })
    else map.setView([CAREER[i].lat, CAREER[i].lng], 14)
    markers[i].openPopup()
  }

  const stopAuto = () => {
    autoOn = false
    clearTimeout(advanceTimer)
    advanceTimer = null
    progressEl.style.display = 'none'
    progressFill.style.transition = 'none'
    progressFill.style.transform = 'scaleX(0)'
  }

  const armAuto = () => {
    clearTimeout(advanceTimer)
    progressEl.style.display = 'block'
    progressFill.style.transition = 'none'
    progressFill.style.transform = 'scaleX(0)'
    void progressFill.offsetWidth
    progressFill.style.transition = `transform ${LINGER}ms linear`
    progressFill.style.transform = 'scaleX(1)'
    advanceTimer = setTimeout(() => {
      goTo((step + 1) % CAREER.length)
      armAuto()
    }, LINGER)
  }

  const startAuto = () => { autoOn = true; armAuto() }

  // sidebar
  const detailHTML = (e) => `
    <div class="sb-years">${e.years}</div>
    <h3 class="sb-name">${e.name}</h3>
    ${e.role ? `<div class="sb-role">${e.role}</div>` : ''}
    <div class="sb-addr">${e.addr}</div>
    <p class="sb-text">${e.detail}</p>
    ${e.highlights ? `<ul class="sb-highlights">${e.highlights.map(h => `<li>${h}</li>`).join('')}</ul>` : ''}`

  const selectDetail = (i) => {
    sbDetail.innerHTML = detailHTML(CAREER[i])
    setActiveSbItem(i)
    sbDetail.scrollTop = 0
  }

  const sbItems = CAREER.map((e, i) => {
    const it = document.createElement('button')
    it.type = 'button'
    it.className = 'career__sb-item'
    it.innerHTML = `<span class="sb-item-years">${e.years}</span><span class="sb-item-name">${e.name}</span>`
    it.addEventListener('click', () => { selectDetail(i); goTo(i) })
    sbList.appendChild(it)
    return it
  })

  const openSidebar = (i) => {
    stopAuto()
    selectDetail(i)
    sidebar.classList.add('is-open')
    sidebar.setAttribute('aria-hidden', 'false')
  }

  const closeSidebar = () => {
    sidebar.classList.remove('is-open')
    sidebar.setAttribute('aria-hidden', 'true')
    if (career.dataset.current === 'true') applyMode()
  }

  document.getElementById('career-sb-close').addEventListener('click', closeSidebar)
  const sbTab = document.getElementById('career-sb-tab')
  sbTab.addEventListener('click', () => {
    if (sidebar.classList.contains('is-open')) {
      closeSidebar()
    } else {
      openSidebar(step)
    }
  })
  el.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.pop__more')
    if (!btn) return
    openSidebar(parseInt(btn.dataset.i, 10))
  })

  // timeline chips
  const chips = CAREER.map((e, i) => {
    const c = document.createElement('button')
    c.type = 'button'
    c.className = 'career__chip'
    c.textContent = e.years
    c.addEventListener('click', () => { goTo(i); if (timelineMode && autoOn) armAuto() })
    timelineEl.appendChild(c)
    return c
  })

  const applyMode = () => {
    if (timelineMode) {
      goTo(step, false)
      startAuto()
    } else {
      stopAuto()
      closeAll()
      map.fitBounds(bounds, { paddingTopLeft: [50, 170], paddingBottomRight: [50, 90] })
      setTimeout(() => markers.forEach(m => m.openPopup()), 200)
    }
  }

  const showTimeline = () => {
    timelineMode = true
    timelineEl.style.display = ''
    btns.forEach(b => b.classList.toggle('is-active', b.dataset.mode === 'timeline'))
    goTo(step)
    startAuto()
  }

  const showInteractive = () => {
    timelineMode = false
    timelineEl.style.display = 'none'
    btns.forEach(b => b.classList.toggle('is-active', b.dataset.mode === 'interactive'))
    stopAuto()
    closeAll()
    map.flyToBounds(bounds, { paddingTopLeft: [50, 170], paddingBottomRight: [50, 90], duration: 0.8 })
    setTimeout(() => markers.forEach(m => m.openPopup()), 850)
  }

  btns.forEach(b => b.addEventListener('click', () => {
    b.dataset.mode === 'interactive' ? showInteractive() : showTimeline()
  }))

  // size + re-apply view when section comes to front; pause when it leaves
  new MutationObserver(() => {
    if (career.dataset.current === 'true') {
      map.invalidateSize()
      setTimeout(() => { map.invalidateSize(); applyMode() }, 240)
    } else {
      stopAuto()
      sidebar.classList.remove('is-open')
      sidebar.setAttribute('aria-hidden', 'true')
    }
  }).observe(career, { attributes: true, attributeFilter: ['data-current'] })

  timelineEl.style.display = ''
  btns.forEach(b => b.classList.toggle('is-active', b.dataset.mode === 'timeline'))
}

initCareer()

/* ===== Contacts: famous hackers (sorted by last name) ===== */
const HACKERS = [
  ['Ross', 'Anderson'], ['Jacob', 'Appelbaum'], ['Julian', 'Assange'], ['Andrew', 'Auernheimer'],
  ['Mathew', 'Bevan'], ['Loyd', 'Blankenship'], ['Max', 'Butler'],
  ['Michael', 'Calce'], ['Fred', 'Cohen'], ['Eric', 'Corley'],
  ['Jake', 'Davis'], ['Kim', 'Dotcom'], ['John', 'Draper'],
  ['Joe', 'Engressia'],
  ['Dan', 'Farmer'], ['Halvar', 'Flake'],
  ['Albert', 'Gonzalez'], ['Joe', 'Grand'], ['Virgil', 'Griffith'],
  ['Jeremy', 'Hammond'], ['Markus', 'Hess'], ['George', 'Hotz'],
  ['Barnaby', 'Jack'], ['Jonathan', 'James'], ['Jon Lech', 'Johansen'],
  ['Adrian', 'Lamo'], ['Vladimir', 'Levin'], ['Gordon', 'Lyon'],
  ['Kevin', 'Mitnick'], ['Hector', 'Monsegur'], ['Robert Tappan', 'Morris'],
  ['Bruce', 'Perens'], ['Kevin', 'Poulsen'],
  ['Eric', 'Raymond'], ['Ronald', 'Rivest'], ['Joanna', 'Rutkowska'],
  ['Edward', 'Snowden'], ['Richard', 'Stallman'], ['Gottfrid', 'Svartholm'],
  ['Ehud', 'Tenenbaum'], ['Ken', 'Thompson'], ['Linus', 'Torvalds'],
  ['Tarah', 'Wheeler'], ['Steve', 'Wozniak'],
  ['Peiter', 'Zatko'], ['Phil', 'Zimmermann']
]

const initContacts = () => {
  const list = document.getElementById('contacts-list')
  const indexNav = document.getElementById('contacts-index')
  if (!list || !indexNav) return

  HACKERS.sort((a, b) => (a[1] + a[0]).localeCompare(b[1] + b[0]))

  const groups = {}
  HACKERS.forEach(([first, last]) => {
    const letter = last[0].toUpperCase()
    ;(groups[letter] = groups[letter] || []).push([first, last])
  })

  const groupEls = {}
  Object.keys(groups).sort().forEach(letter => {
    const label = document.createElement('div')
    label.className = 'contacts__group-label'
    label.textContent = letter
    list.appendChild(label)
    groupEls[letter] = label
    groups[letter].forEach(([first, last]) => {
      const row = document.createElement('div')
      row.className = 'contacts__row'
      row.innerHTML = `${first} <b>${last}</b>`
      list.appendChild(row)
    })
  })

  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('')
  ALPHA.forEach(letter => {
    const a = document.createElement('a')
    a.textContent = letter
    a.href = 'javascript:void 0'
    if (groupEls[letter]) {
      a.addEventListener('click', (e) => {
        e.preventDefault()
        list.scrollTo({ top: groupEls[letter].offsetTop, behavior: 'smooth' })
      })
    } else {
      a.style.opacity = '0.32'
    }
    indexNav.appendChild(a)
  })
}

initContacts()

/* ===== Projects: macOS terminal ===== */
const REPOS = [
  ['CyberSOC', 'Security operations dashboard'],
  ['BudgetBuddy', 'Personal budgeting helper'],
  ['TheSabroso', 'Recipes & food project'],
  ['TwoPlayerGame', 'Local two-player game'],
  ['RobotRevenge', 'Robot game'],
  ['PoetryInMotion', 'Poetry showcase'],
  ['TheGuidebook', 'A guidebook for life'],
  ['GabeBarrera.github.io', 'Coding by GabeBarrera'],
  ['sabroso-site', 'Sabroso website'],
  ['DatabaseFramework', 'A simple profile database'],
  ['Net-Worth-Calculator', 'Your personal net worth calculator'],
  ['Valheim-Test-Mod', 'Simple mod for Valheim'],
  ['LCD-show', 'TFT LCD driver for the Raspberry Pi'],
  ['simulated-file-system', 'A file system'],
  ['udp-server', 'A basic UDP client-server'],
  ['tcp-server', 'A basic TCP server-client example'],
  ['posix', 'POSIX semaphores and threading example'],
  ['semaphores', 'POSIX code for semaphore practice'],
  ['simpleshell', 'A simple C shell']
]

const initTerminal = () => {
  const screen = document.getElementById('term-screen')
  const output = document.getElementById('term-output')
  const inputEl = document.getElementById('term-input')
  const hidden = document.getElementById('term-hidden')
  if (!screen || !output || !hidden) return

  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const pad = (s, n) => s + ' '.repeat(Math.max(0, n - s.length))

  const projectsHTML = () => {
    const rows = REPOS.map(([name, desc]) => {
      const url = `https://github.com/GabeBarrera/${name}`
      return `<div class="term__line">  <a href="${url}" target="_blank" rel="noopener">${pad(name, 24)}</a><span class="term__muted">${esc(desc)}</span></div>`
    }).join('')
    return `<div class="term__line term__heading">Public repositories \u2014 github.com/GabeBarrera (${REPOS.length})</div>` +
      `<div class="term__line term__muted">\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500</div>` +
      rows +
      `<div class="term__line">&nbsp;</div>` +
      `<div class="term__line term__muted">tip: type <span class="term__bright">help</span> for available commands.</div>`
  }

  const helpHTML = () =>
    `<div class="term__line term__heading">Available commands</div>` +
    `<div class="term__line term__muted">\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500</div>` +
    `<div class="term__line">  <span class="term__bright">help</span>     &nbsp;Show this list of commands</div>` +
    `<div class="term__line">  <span class="term__bright">projects</span> &nbsp;List all public GitHub projects</div>` +
    `<div class="term__line">  <span class="term__bright">clear</span>    &nbsp;Clear the terminal screen</div>`

  const bannerHTML = () =>
    `<div class="term__line term__bright">Gabe Barrera \u2014 Projects Terminal  (zsh)</div>` +
    `<div class="term__line term__muted">Last login: pulling from github.com/GabeBarrera</div>` +
    `<div class="term__line">&nbsp;</div>`

  const render = (html) => { output.innerHTML = html }

  const run = (raw) => {
    const cmd = raw.trim().toLowerCase()
    // Clear the screen before showing any result
    if (cmd === '') { render(''); return }
    if (cmd === 'clear') { render(''); return }
    if (cmd === 'help') { render(`<div class="term__line term__cmd">$ help</div>` + helpHTML()); return }
    if (cmd === 'projects') { render(`<div class="term__line term__cmd">$ projects</div>` + projectsHTML()); return }
    render(`<div class="term__line term__cmd">$ ${esc(raw.trim())}</div>` +
      `<div class="term__line term__error">command not found: ${esc(raw.trim())}</div>` +
      `<div class="term__line term__muted">type <span class="term__bright">help</span> to see available commands.</div>`)
  }

  // initial state
  render(bannerHTML() + projectsHTML())

  const sync = () => { inputEl.textContent = hidden.value }

  hidden.addEventListener('input', sync)
  hidden.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      run(hidden.value)
      hidden.value = ''
      sync()
      screen.scrollTop = 0
    }
  })

  const focusInput = () => { hidden.focus({ preventScroll: true }) }
  screen.addEventListener('click', focusInput)

  // Focus when projects section becomes current
  const projSection = document.getElementById('#projects')
  if (projSection) {
    new MutationObserver(() => {
      if (projSection.dataset.current === 'true') setTimeout(focusInput, 320)
    }).observe(projSection, { attributes: true, attributeFilter: ['data-current'] })
  }
}

initTerminal()

/* ===== Resume window: matrix rain + forced PDF download ===== */
const initResume = () => {
  // Force the resume PDF to download rather than open inline
  const forceDownload = async (href) => {
    try {
      const res = await fetch(href)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Barrera_Gabriel_IS_Resume.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1500)
    } catch (err) {
      window.open(href, '_blank')
    }
  }
  document.querySelectorAll('#resume-download, #pdfv-download').forEach(dl => {
    dl.addEventListener('click', (e) => {
      e.preventDefault()
      forceDownload(dl.getAttribute('href'))
    })
  })

  // PDF viewer zoom + print
  const canvas = document.querySelector('.pdfv__canvas')
  const zoomLabel = document.getElementById('pdfv-zoom')
  if (canvas && zoomLabel) {
    let zoom = 100
    const apply = () => {
      canvas.style.transform = `scale(${zoom / 100})`
      zoomLabel.textContent = `${zoom}%`
    }
    const zi = document.getElementById('pdfv-zoom-in')
    const zo = document.getElementById('pdfv-zoom-out')
    const zr = document.getElementById('pdfv-zoom-reset')
    if (zi) zi.addEventListener('click', () => { zoom = Math.min(180, zoom + 10); apply() })
    if (zo) zo.addEventListener('click', () => { zoom = Math.max(50, zoom - 10); apply() })
    if (zr) zr.addEventListener('click', () => { zoom = 100; apply() })
  }
  const printBtn = document.getElementById('pdfv-print')
  if (printBtn) printBtn.addEventListener('click', () => window.print())

  // Matrix rain in the resume window
  const mcanvas = document.getElementById('rz-matrix')
  if (!mcanvas) return
  const ctx = mcanvas.getContext('2d')
  let cols, drops, fontSize, raf
  const glyphs = '\u30A2\u30A1\u30AB\u30B5\u30BF\u30CA\u30CF\u30DE\u30E4\u30E3\u30E9\u30EF\u30AC\u30B6\u30C0\u30D0\u30D1\u30A4\u30A3\u30AD\u30B7\u30C1\u30CB\u30D2\u30DF\u30EA\u30AE\u30B8\u30C2\u30D3\u30D4\u30A6\u30A5\u30AF\u30B9\u30C4\u30CC\u30D5\u30E0\u30E6\u30E5\u30EB\u30B0\u30BA\u30D6\u30C5\u30D7\u30A8\u30A7\u30B1\u30BB\u30C6\u30CD\u30D8\u30E1\u30EC\u30B2\u30BC\u30C7\u30D9\u30DA\u30AA\u30A9\u30B3\u30BD\u30C8\u30CE\u30DB\u30E2\u30E8\u30E7\u30ED\u30F2\u30B4\u30BE\u30C9\u30DC\u30DD0123456789ABCDEF{}<>[]/$#@!?*'
  const resize = () => {
    const dpr = window.devicePixelRatio || 1
    const w = mcanvas.offsetWidth || mcanvas.parentElement.offsetWidth
    const h = mcanvas.offsetHeight || mcanvas.parentElement.offsetHeight
    mcanvas.width = w * dpr
    mcanvas.height = h * dpr
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(dpr, dpr)
    fontSize = 14
    cols = Math.max(1, Math.floor(w / fontSize))
    drops = Array(cols).fill(0).map(() => Math.random() * -100)
  }
  const draw = () => {
    const w = mcanvas.offsetWidth, h = mcanvas.offsetHeight
    ctx.fillStyle = 'rgba(6, 4, 12, 0.08)'
    ctx.fillRect(0, 0, w, h)
    ctx.font = `${fontSize}px "JetBrains Mono", monospace`
    for (let i = 0; i < cols; i++) {
      const ch = glyphs[Math.floor(Math.random() * glyphs.length)]
      const x = i * fontSize
      const y = drops[i] * fontSize
      ctx.fillStyle = 'oklch(0.92 0.18 320)'
      ctx.fillText(ch, x, y)
      ctx.fillStyle = 'oklch(0.6 0.2 320 / 0.6)'
      ctx.fillText(ch, x, y - fontSize)
      if (y > h && Math.random() > 0.975) drops[i] = 0
      drops[i] += 0.4
    }
    raf = requestAnimationFrame(draw)
  }
  resize()
  window.addEventListener('resize', resize)
  draw()
}

initResume()

/* ===== Home: type / delete / retype effect ===== */
const initWelcomeTypewriter = () => {
  const out = document.getElementById('welcome-typed')
  if (!out) return
  const phrases = ['Hack', 'Eat', 'Write', 'Game', 'Sleep', 'Repeat']
  const speed = 90
  const pause = 1300
  let i = 0
  let text = ''
  let deleting = false
  const tick = () => {
    const cur = phrases[i]
    let delay
    if (!deleting && text.length < cur.length) {
      text = cur.slice(0, text.length + 1)
      delay = speed
    } else if (!deleting && text.length === cur.length) {
      deleting = true
      delay = pause
    } else if (deleting && text.length > 0) {
      text = cur.slice(0, text.length - 1)
      delay = speed / 2
    } else {
      deleting = false
      i = (i + 1) % phrases.length
      delay = speed
    }
    out.textContent = text
    setTimeout(tick, delay)
  }
  tick()
}

initWelcomeTypewriter()
